
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { User, AttendanceLog } from '@/lib/types';
import { isSameDay, isWeekend, startOfMonth, endOfMonth, eachDayOfInterval, format, isBefore } from 'date-fns';
import { AttendancePieChart } from '../attendance-pie-chart';
import { DailyAttendancePieChart } from '../daily-attendance-pie-chart';

interface StudentDetailDialogProps {
  user: User;
  children: React.ReactNode;
}

const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[1]) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

export function StudentDetailDialog({ user, children }: StudentDetailDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [attendanceLogs, setAttendanceLogs] = React.useState<AttendanceLog[]>([]);
  const [loadingLogs, setLoadingLogs] = React.useState(true);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedDay, setSelectedDay] = React.useState<Date | undefined>(new Date());

  React.useEffect(() => {
    if (open && user) {
      setLoadingLogs(true);
      const logsRef = collection(db, 'attendance_logs');
      const q = query(logsRef, where('userId', '==', user.id));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as AttendanceLog[];
        setAttendanceLogs(logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
        setLoadingLogs(false);
      }, (error) => {
        console.error("Error fetching student attendance logs:", error);
        setLoadingLogs(false);
      });

      return () => unsubscribe();
    }
  }, [user, open]);

  const { presentDays, absentDays, presentDaysForCalendar } = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const today = new Date();

    const logsInMonth = attendanceLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= monthStart && logDate <= monthEnd;
    });
    
    const uniquePresentDays = new Set(logsInMonth.map(log => format(log.timestamp, 'yyyy-MM-dd')));

    const pastWeekdaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(
        day => isBefore(day, today) && !isWeekend(day)
    ).length;

    const presentScansCount = uniquePresentDays.size;
    const absentDaysCount = Math.max(0, pastWeekdaysInMonth - presentScansCount);
    
    return {
        presentDays: presentScansCount,
        absentDays: absentDaysCount,
        presentDaysForCalendar: attendanceLogs.map(log => new Date(log.timestamp)),
    };
  }, [attendanceLogs, currentMonth]);

  const scansOnSelectedDay = React.useMemo(() => {
    if (!selectedDay) return 0;
    return attendanceLogs.filter(log => isSameDay(log.timestamp, selectedDay)).length;
  }, [attendanceLogs, selectedDay]);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Student Details</DialogTitle>
          <DialogDescription>
            Mini-dashboard for {user.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 max-h-[70vh] overflow-y-auto pr-4">
             <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader className="items-center text-center">
                        <Avatar className="h-24 w-24 text-3xl mb-4 border-4 border-primary/20">
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="font-headline">{user.name}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Roll No.</span>
                        <span className="font-medium">{user.rollNo}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Semester</span>
                        <span className="font-medium">{user.semester}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Batch</span>
                        <span className="font-medium">{user.batch}</span>
                        </div>
                        <div className="flex justify-between pt-2">
                        <span className="text-muted-foreground">RFID UID</span>
                        <span className="font-mono text-xs p-1 bg-muted rounded">{user.rfidUid}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Attendance Calendar</CardTitle>
                        <CardDescription>Attendance record for {user.name}.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                    {loadingLogs ? (
                        <Skeleton className="h-64 w-full" />
                    ) : (
                        <Calendar
                            mode="single"
                            selected={selectedDay}
                            onSelect={setSelectedDay}
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                            captionLayout="dropdown-buttons"
                            fromYear={new Date().getFullYear() - 5}
                            toYear={new Date().getFullYear()}
                            className="rounded-md border p-3"
                            modifiers={{
                                present: presentDaysForCalendar,
                                absent: eachDayOfInterval({start: startOfMonth(currentMonth), end: endOfMonth(currentMonth)}).filter(day => {
                                    const isWeekday = !isWeekend(day);
                                    const isNotPresent = !presentDaysForCalendar.some(presentDay => isSameDay(day, presentDay));
                                    const isNotFuture = day <= new Date();
                                    return isWeekday && isNotPresent && isNotFuture;
                                }),
                            }}
                            modifiersClassNames={{
                                present: 'day-present',
                                absent: 'day-absent',
                                today: 'day-today',
                            }}
                        />
                    )}
                    </CardContent>
                    <CardFooter>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-[#50C878]" />
                            <span>Present</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-[#FF2E2E]" />
                            <span>Absent</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#FFB343' }} />
                            <span>Today</span>
                        </div>
                    </div>
                </CardFooter>
                </Card>
             </div>

            <div className="lg:col-span-1 space-y-6">
                <AttendancePieChart presentDays={presentDays} absentDays={absentDays} loading={loadingLogs} />
                <DailyAttendancePieChart attendedClasses={scansOnSelectedDay} totalClasses={5} loading={loadingLogs} />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
