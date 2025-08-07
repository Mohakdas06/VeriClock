
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
    onAuthStateChanged, 
    signOut, 
    type User as FirebaseAuthUser, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';
import { isAfter } from 'date-fns';


type UserRole = 'admin' | 'student' | null;

interface AuthContextType {
  user: FirebaseAuthUser | null;
  studentInfo: AppUser | null;
  role: UserRole;
  loading: boolean;
  logout: () => Promise<void>;
  adminLogin: (email: string, pass: string) => Promise<any>;
  studentLogin: (email: string, rfidUid: string) => Promise<any>;
  updateProfile: (name: string, email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  studentInfo: null,
  role: null,
  loading: true,
  logout: async () => {},
  adminLogin: async () => {},
  studentLogin: async () => {},
  updateProfile: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [studentInfo, setStudentInfo] = useState<AppUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setLoading(true);
        if (user) {
            setUser(user);
            // Check if it's a student session
            const studentId = localStorage.getItem('studentId');
            if (studentId) {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('__name__', '==', studentId));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const studentData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as AppUser;
                    setStudentInfo(studentData);
                    setRole('student');
                } else {
                    // This can happen if the student user was deleted.
                    await logout();
                }
            } else {
                 setRole('admin');
            }
        } else {
            setUser(null);
            setStudentInfo(null);
            setRole(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('studentId');
    router.push('/');
  };

  const adminLogin = async (email: string, pass: string) => {
    localStorage.removeItem('studentId'); // Ensure no student session
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    
    // **CRITICAL SECURITY CHECK**
    // After login, verify this user is not a student.
    const usersRef = collection(db, 'users');
    const studentQuery = query(usersRef, where('email', '==', email));
    const studentSnapshot = await getDocs(studentQuery);

    if (!studentSnapshot.empty) {
      // This is a student's email. They should not log in as admin.
      await signOut(auth); // Log them out immediately
      throw new Error('This email is registered to a student. Please use the student login.');
    }
    
    return userCredential;
  }

  const studentLogin = async (email: string, rfidUid: string) => {
    // **CRITICAL SECURITY CHECK**
    // Prevent admin from logging in via student portal
    if (email.toLowerCase() === 'mohakdas942@gmail.com') {
      throw new Error('Invalid credentials for student login.');
    }

    // Find student by email in Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        throw new Error('No student found with this email.');
    }
    const studentDoc = querySnapshot.docs[0];
    const studentData = { 
        id: studentDoc.id, 
        ...studentDoc.data(),
        validityDate: studentDoc.data().validityDate?.toDate() // Convert timestamp to Date
    } as AppUser;
    
    // Check if RFID UID matches
    if (studentData.rfidUid !== rfidUid) {
        throw new Error('Incorrect RFID UID. Please try again.');
    }

    // Check if account is expired
    if (studentData.validityDate && isAfter(new Date(), studentData.validityDate)) {
        throw new Error('This student account has expired.');
    }
    
    // For student login, their RFID UID is their password for Firebase Auth.
    try {
        let userCredential = await signInWithEmailAndPassword(auth, email, rfidUid).catch(async (error) => {
            // If user doesn't exist in Firebase Auth, create it.
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                const newUserCredential = await createUserWithEmailAndPassword(auth, email, rfidUid);
                await updateFirebaseProfile(newUserCredential.user, { displayName: studentData.name });
                return newUserCredential;
            }
             // For any other error (like wrong password), re-throw it to be caught below.
            throw error;
        });
        
        // Store a flag to identify the user as a student
        localStorage.setItem('studentId', studentData.id);
        
        setUser(userCredential.user);
        setStudentInfo(studentData);
        setRole('student');
        return userCredential;
    } catch (error: any) {
        if(error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error("Invalid credentials. The email may be registered to an admin or the RFID UID is incorrect.");
        }
        if(error.code === 'auth/email-already-in-use') {
             throw new Error("This email is already linked to another account that is not a student account.");
        }
        console.error("Student login error:", error);
        throw new Error("An unexpected error occurred during login.");
    }
  }
  
  const updateProfile = async (name: string, email: string) => {
    if (!user) throw new Error("Not authenticated");
    await updateFirebaseProfile(user, { displayName: name });
    // Email update requires re-authentication, so handle separately if needed
  };

  return (
    <AuthContext.Provider value={{ user, studentInfo, role, loading, logout, adminLogin, studentLogin, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
