
'use client';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { AttendanceLog } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { isSameDay, isWeekend, startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, isBefore, differenceInCalendarDays, subDays, startOfWeek } from 'date-fns';
import { AttendancePieChart } from '../attendance-pie-chart';
import { DailyAttendancePieChart } from '../daily-attendance-pie-chart';
import { StreakTracker } from '../streak-tracker';

export default function StudentDashboard() {
  const { studentInfo, loading: authLoading } = useAuth();
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[1]) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  
  useEffect(() => {
    if (studentInfo) {
      setLoadingLogs(true);
      const logsRef = collection(db, 'attendance_logs');
      const q = query(
        logsRef,
        where('userId', '==', studentInfo.id)
      );

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
  }, [studentInfo]);

    const { presentDays, absentDays, presentDaysForCalendar } = useMemo(() => {
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
        
        const presentTimestamps = attendanceLogs.map(log => new Date(log.timestamp));

        return {
            presentDays: presentScansCount,
            absentDays: Math.max(0, pastWeekdaysInMonth - presentScansCount),
            presentDaysForCalendar: presentTimestamps
        };
    }, [attendanceLogs, currentMonth]);
    
     const { currentStreak, recordStreak, weeklyAttendance } = useMemo(() => {
        if (attendanceLogs.length === 0) return { currentStreak: 0, recordStreak: 0, weeklyAttendance: [] };

        const uniqueDaysAttended = [...new Set(
            attendanceLogs.map(log => format(new Date(log.timestamp), 'yyyy-MM-dd'))
        )].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        if (uniqueDaysAttended.length === 0) {
            return { currentStreak: 0, recordStreak: 0, weeklyAttendance: [] };
        }

        // --- Calculate Record Streak ---
        let maxStreak = 0;
        if (uniqueDaysAttended.length > 0) {
            let currentRecordStreak = 1;
            maxStreak = 1;
            for (let i = 1; i < uniqueDaysAttended.length; i++) {
                const date = new Date(uniqueDaysAttended[i]);
                const prevDate = new Date(uniqueDaysAttended[i-1]);
                let expectedPrevDate = subDays(date, 1);
                while(isWeekend(expectedPrevDate)) {
                    expectedPrevDate = subDays(expectedPrevDate, 1);
                }

                if (isSameDay(prevDate, expectedPrevDate)) {
                    currentRecordStreak++;
                } else {
                    currentRecordStreak = 1;
                }
                if (currentRecordStreak > maxStreak) {
                    maxStreak = currentRecordStreak;
                }
            }
        }
        
        // --- Calculate Current Streak ---
        let streak = 0;
        let today = new Date();
        // If today is weekend, the streak check should be against last Friday
        if (isWeekend(today)) {
             today = subDays(today, getDay(today) === 0 ? 2 : 1);
        }
        const todayStr = format(today, 'yyyy-MM-dd');
        
        const sortedUniqueDaysForCurrentStreak = [...uniqueDaysAttended].sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
        const lastAttendedDayIndex = sortedUniqueDaysForCurrentStreak.findIndex(d => d === todayStr);

        if (lastAttendedDayIndex !== -1) {
            streak = 1;
            let lastDate = new Date(sortedUniqueDaysForCurrentStreak[lastAttendedDayIndex]);
            for (let i = lastAttendedDayIndex + 1; i < sortedUniqueDaysForCurrentStreak.length; i++) {
                const prevDate = new Date(sortedUniqueDaysForCurrentStreak[i]);
                let expectedPrevDate = subDays(lastDate, 1);
                while(isWeekend(expectedPrevDate)) {
                    expectedPrevDate = subDays(expectedPrevDate, 1);
                }
                if (isSameDay(prevDate, expectedPrevDate)) {
                    streak++;
                    lastDate = prevDate;
                } else {
                    break;
                }
            }
        }

        // --- Prepare Weekly Data ---
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
        const weekDays = eachDayOfInterval({ start: weekStart, end: new Date() });
        const weeklyData = weekDays.map(day => ({
            day: format(day, 'E'),
            attended: uniqueDaysAttended.includes(format(day, 'yyyy-MM-dd'))
        }));


        return { currentStreak: streak, recordStreak: maxStreak, weeklyAttendance: weeklyData };
    }, [attendanceLogs]);


  const scansOnSelectedDay = useMemo(() => {
    if (!selectedDay) return 0;
    return attendanceLogs.filter(log => isSameDay(log.timestamp, selectedDay)).length;
  }, [attendanceLogs, selectedDay]);
  
  const studentName = studentInfo?.name?.split(' ')[0] || 'Student';

  if (authLoading || !studentInfo) {
     return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <Skeleton className="h-48 w-full" />
        </div>
    );
  }

  const getDayDisplay = () => {
    if (!selectedDay) return '...';
    if (isSameDay(selectedDay, new Date())) return 'today';
    return `on ${format(selectedDay, 'EEEE')}`;
  }

  return (
    <>
      <PageHeader title={`Hi, ${studentName}`} description="Here’s your personal attendance summary." />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Profile Info Card */}
            <Card>
            <CardHeader className="items-center text-center">
                <Avatar className="h-24 w-24 text-3xl mb-4 border-4 border-primary/20">
                <AvatarFallback>{getInitials(studentInfo.name)}</AvatarFallback>
                </Avatar>
                <CardTitle className="font-headline">{studentInfo.name}</CardTitle>
                <CardDescription>{studentInfo.email}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
                <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Roll No.</span>
                <span className="font-medium">{studentInfo.rollNo}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Semester</span>
                <span className="font-medium">{studentInfo.semester}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Batch</span>
                <span className="font-medium">{studentInfo.batch}</span>
                </div>
                <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">RFID UID</span>
                <span className="font-mono text-xs p-1 bg-muted rounded">{studentInfo.rfidUid}</span>
                </div>
            </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Attendance Calendar</CardTitle>
                    <CardDescription>Your attendance for the current month. Select a day to see details.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                {loadingLogs ? (
                    <div className="space-y-2 w-full">
                        <Skeleton className="h-64 w-full" />
                    </div>
                ) : (
                    <Calendar
                        mode="single"
                        selected={selectedDay}
                        onSelect={setSelectedDay}
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        captionLayout="dropdown-buttons"
                        fromYear={new Date().getFullYear() - 2}
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

        <div className="lg:col-span-2 flex flex-col gap-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <AttendancePieChart presentDays={presentDays} absentDays={absentDays} loading={loadingLogs} />
                 <DailyAttendancePieChart attendedClasses={scansOnSelectedDay} totalClasses={5} loading={loadingLogs} />
             </div>
             <StreakTracker streak={currentStreak} recordStreak={recordStreak} weeklyAttendance={weeklyAttendance} loading={loadingLogs} />
        </div>
      </div>
    </>
  );
}
