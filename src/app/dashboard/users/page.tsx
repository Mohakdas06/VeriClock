
'use client';

import { PageHeader } from '@/components/page-header';
import { UserRegistrationCard } from '@/components/users/user-registration-card';
import { UserProfileCard } from '@/components/users/user-profile-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, deleteDoc, doc, getDocs, query, where, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const USERS_PER_PAGE = 9;

export default function UsersPage() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registeredAt: doc.data().registeredAt?.toDate() || new Date(),
        validityDate: doc.data().validityDate?.toDate(),
      })) as User[];
      setAllUsers(usersData.sort((a,b) => b.registeredAt.getTime() - a.registeredAt.getTime()));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users: ", error);
      toast({
        title: "Firestore Error",
        description: "Could not fetch users. Check console and security rules.",
        variant: "destructive"
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
        return allUsers;
    }
    return allUsers.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleUserRegistered = async (newUser: Omit<User, 'id' | 'registeredAt'>) => {
    const q = query(collection(db, "users"), where("rfidUid", "==", newUser.rfidUid));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        toast({
            title: 'Registration Failed',
            description: `A user is already registered with RFID UID: ${newUser.rfidUid}`,
            variant: 'destructive',
        });
        return;
    }

    try {
        await addDoc(collection(db, "users"), {
            ...newUser,
            registeredAt: serverTimestamp()
        });
        toast({
            title: 'User Registered',
            description: `New user "${newUser.name}" has been successfully registered.`,
          });
    } catch(error) {
        console.error("Error adding user: ", error);
        toast({
            title: 'Error',
            description: 'Failed to register the new user.',
            variant: 'destructive',
        });
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<Omit<User, 'id' | 'registeredAt' | 'rfidUid'>>) => {
    const userRef = doc(db, 'users', userId);
    try {
        await updateDoc(userRef, updates);
        toast({
            title: 'User Updated',
            description: 'The user details have been successfully updated.',
        });
    } catch (error) {
        console.error("Error updating user: ", error);
        toast({
            title: 'Update Failed',
            description: 'Could not update user details.',
            variant: 'destructive',
        });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = allUsers.find((user) => user.id === userId);
    if (userToDelete) {
        try {
            await deleteDoc(doc(db, "users", userId));
            toast({
              title: 'User Deleted',
              description: `User "${userToDelete.name}" has been deleted.`,
              variant: 'destructive',
            });
        } catch (error) {
            console.error("Error deleting user: ", error);
            toast({
                title: 'Error',
                description: 'Failed to delete user.',
                variant: 'destructive',
            });
        }
    }
  };

  return (
    <>
      <PageHeader
        title="User Management"
        description="Register new users and manage existing ones."
      />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-2">
          <UserRegistrationCard onUserRegistered={handleUserRegistered} />
        </div>
        <div className="lg:col-span-3">
            <Card>
                <CardHeader>
                    <CardTitle className='font-headline flex items-center gap-2'>
                        <Users /> Registered Users ({filteredUsers.length})
                    </CardTitle>
                    <CardDescription>Browse, search, and manage all registered users.</CardDescription>
                     <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by name or roll no..."
                            className="w-full pl-8"
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setCurrentPage(1); // Reset to first page on search
                            }}
                        />
                    </div>
                </CardHeader>
                <CardContent className="bg-card">
                    {loading ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                            {[...Array(USERS_PER_PAGE)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                         </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                            {paginatedUsers.map(user => (
                                <UserProfileCard 
                                    key={user.id} 
                                    user={user} 
                                    onUpdateUser={handleUpdateUser} 
                                    onDeleteUser={handleDeleteUser} 
                                />
                            ))}
                        </div>
                        {filteredUsers.length === 0 && !loading && (
                          <div className="text-center py-16 text-muted-foreground">
                            <p>No users found matching your search.</p>
                          </div>
                        )}
                      </>
                    )}
                </CardContent>
                 {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                      <Button
                          variant="outline"
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                      >
                          Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                      </span>
                      <Button
                          variant="outline"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                      >
                          Next
                      </Button>
                  </div>
                )}
            </Card>
        </div>
      </div>
    </>
  );
}
