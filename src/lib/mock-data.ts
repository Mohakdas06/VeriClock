import type { Device, User, AttendanceLog } from './types';

// Mock data is no longer the primary source of truth.
// It can be used for initial setup or as a fallback.
// The application now uses Firestore.

export const mockDevices: Device[] = [
  {
    id: 'dev-001',
    name: 'Main Entrance Scanner',
    department: 'CSE',
    token: 'xY3z...aB8p',
    mode: 'Attendance',
    createdAt: new Date('2023-10-01T09:00:00Z'),
  },
  {
    id: 'dev-002',
    name: 'Lab 1 Scanner',
    department: 'ECE',
    token: 'qW5r...tY9u',
    mode: 'Enrollment',
    createdAt: new Date('2023-10-01T09:05:00Z'),
  },
];

export const mockUsers: User[] = [
  {
    id: 'usr-001',
    rfidUid: '1234567890',
    name: 'John Doe',
    rollNo: 'CSE001',
    semester: '5th',
    email: 'john.doe@example.com',
    batch: '2021-2025',
    registeredAt: new Date('2023-10-05T11:00:00Z'),
  },
];

export const mockAttendanceLogs: AttendanceLog[] = [
  {
    id: 'log-001',
    userId: 'usr-001',
    userName: 'John Doe',
    userRollNo: 'CSE001',
    userSemester: '5th',
    rfidUid: '1234567890',
    deviceId: 'dev-001',
    timestamp: new Date(),
    status: 'Present',
  },
];
