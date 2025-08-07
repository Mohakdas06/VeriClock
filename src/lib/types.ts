
import type { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export interface Device {
  id: string;
  name: string;
  department: string;
  token: string;
  mode: 'Enrollment' | 'Attendance';
  createdAt: Date;
  lastSeen?: Date;
}

export interface User {
  id:string;
  rfidUid: string;
  name: string;
  rollNo: string;
  semester: string;
  email?: string;
  batch: string;
  registeredAt: Date;
  canAccessResources?: boolean;
  validityDate?: Date;
}

export interface AttendanceLog {
  id: string;
  userId: string;
  userName: string;
  userRollNo: string;
  userSemester: string;
  rfidUid: string;
  deviceId: string;
  department: string; // Added department for analysis
  timestamp: Date;
  status: 'Present';
}

// Used for Firestore interactions with temporary scanned UIDs
export interface TempRfidScan {
    uid: string;
    timestamp: Timestamp; // Firestore timestamp
    deviceId: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Todo' | 'In Progress' | 'Done';

export interface Task {
    id: string;
    userId: string;
    title: string;
    description?: string;
    subject?: string;
    dueDate?: Date;
    priority: TaskPriority;
    status: TaskStatus;
    createdAt: Date;
}
