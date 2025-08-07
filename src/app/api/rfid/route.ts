
// IMPORTANT: This file is used to bridge the hardware and the web application.
// It now uses Firestore to store and retrieve device and user data.

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Device, User, AttendanceLog } from '@/lib/types';

// CORS headers for ESP8266 requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent, Accept',
};

const SCANNED_UID_COLLECTION = 'scanned_uids';
const SCANNED_UID_DOC_ID = 'last_scanned';
const SCAN_EXPIRATION_MS = 60000;

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET /api/rfid (for hardware to send UID)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cardUid = searchParams.get('card_uid');
    const deviceToken = searchParams.get('device_token');

    console.log('Received request:', { cardUid, deviceToken });

    if (!cardUid || !deviceToken) {
      const missingParams = [];
      if (!cardUid) missingParams.push('card_uid');
      if (!deviceToken) missingParams.push('device_token');
      const errorMessage = `Bad Request: Missing required query parameter(s): ${missingParams.join(', ')}.`;
      
      return new NextResponse(errorMessage, { 
        status: 400,
        headers: corsHeaders,
      });
    }

    // Find the device in Firestore
    const devicesRef = collection(db, 'devices');
    const q = query(devicesRef, where('token', '==', deviceToken));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return new NextResponse('Device not found or token is invalid.', { 
        status: 401,
        headers: corsHeaders,
      });
    }

    const deviceDoc = querySnapshot.docs[0];
    const device = deviceDoc.data() as Device;
    const deviceId = deviceDoc.id;

    // Update device's lastSeen timestamp
    await updateDoc(doc(db, 'devices', deviceId), {
      lastSeen: serverTimestamp()
    });

    // Find if user is already registered
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('rfidUid', '==', cardUid));
    const userSnapshot = await getDocs(userQuery);
    const isCardRegistered = !userSnapshot.empty;

    if (device.mode === 'Enrollment') {
      if (isCardRegistered) {
        return new NextResponse('Available', { 
          status: 200,
          headers: corsHeaders,
        });
      }

      // Store the UID temporarily for the frontend to pick up
      await setDoc(doc(db, SCANNED_UID_COLLECTION, SCANNED_UID_DOC_ID), {
        uid: cardUid,
        timestamp: serverTimestamp(),
        deviceId: deviceId,
      });
      
      return new NextResponse('Successful', { 
        status: 200,
        headers: corsHeaders,
      });
    }

    if (device.mode === 'Attendance') {
      if (!isCardRegistered) {
        return new NextResponse('Not registerd!', { 
          status: 404,
          headers: corsHeaders,
        });
      }

      const user = userSnapshot.docs[0].data() as User;
      const userId = userSnapshot.docs[0].id;

      // Log attendance
      const logData = {
        userId: userId,
        userName: user.name,
        userRollNo: user.rollNo,
        userSemester: user.semester,
        rfidUid: cardUid,
        deviceId: deviceId,
        timestamp: serverTimestamp(),
        status: 'Present'
      };

      const newLogRef = doc(collection(db, 'attendance_logs'));
      await setDoc(newLogRef, logData);
      
      return new NextResponse(`login ${user?.name || ''}`, { 
        status: 200,
        headers: corsHeaders,
      });
    }

    return new NextResponse('Not Allowed!', { 
      status: 405,
      headers: corsHeaders,
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return new NextResponse('Internal Server Error', { 
      status: 500,
      headers: corsHeaders,
    });
  }
}

// POST function for frontend polling
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (body.action === 'get_uid') {
      const scannedUidRef = doc(db, SCANNED_UID_COLLECTION, SCANNED_UID_DOC_ID);
      const docSnap = await getDoc(scannedUidRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const timestamp = data.timestamp?.toDate();
        if (timestamp && (Date.now() - timestamp.getTime() < SCAN_EXPIRATION_MS)) {
          return NextResponse.json({ uid: data.uid }, { headers: corsHeaders });
        }
      }
      
      return NextResponse.json({ uid: null }, { headers: corsHeaders });
    }

    if (body.action === 'clear_uid') {
      const scannedUidRef = doc(db, SCANNED_UID_COLLECTION, SCANNED_UID_DOC_ID);
      const docSnap = await getDoc(scannedUidRef);
      
      if (docSnap.exists() && docSnap.data().uid === body.uid) {
        await deleteDoc(scannedUidRef);
      }
      
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Invalid action' }, { 
      status: 400,
      headers: corsHeaders,
    });
    
  } catch (error) {
    console.error('POST API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { 
      status: 500,
      headers: corsHeaders,
    });
  }
}
