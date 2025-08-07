
'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, startOfWeek, eachDayOfInterval } from 'date-fns';
import type { AttendanceLog } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

const chartConfig = {
  attendance: {
    label: 'Attendance',
    color: 'hsl(var(--secondary))',
  },
};

export function AttendanceChart() {
    const [chartData, setChartData] = useState<{ day: string; attendance: number }[]>([]);
    const [totalThisWeek, setTotalThisWeek] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const today = new Date();
        const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const endOfThisWeek = new Date(startOfThisWeek.getTime() + 6 * 24 * 60 * 60 * 1000);

        const q = query(
            collection(db, 'attendance_logs'),
            where('timestamp', '>=', Timestamp.fromDate(startOfThisWeek)),
            where('timestamp', '<=', Timestamp.fromDate(endOfThisWeek))
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({
                ...doc.data(),
                timestamp: doc.data().timestamp.toDate()
            })) as AttendanceLog[];

            const weekDays = eachDayOfInterval({ start: startOfThisWeek, end: endOfThisWeek });
            
            const data = weekDays.map(day => {
                const dayStr = format(day, 'E'); // 'Mon', 'Tue', etc.
                const attendance = logs.filter(log => format(log.timestamp, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')).length;
                return { day: dayStr, attendance };
            });

            setChartData(data);
            setTotalThisWeek(logs.length);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching chart data: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);


  if (loading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[250px] w-full" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Weekly Attendance</CardTitle>
        <CardDescription>Total attendance this week: {totalThisWeek}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip
                    content={<ChartTooltipContent />}
                    cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 2, strokeDasharray: '3 3' }}
                 />
                 <defs>
                    <linearGradient id="fill-attendance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.1}/>
                    </linearGradient>
                 </defs>
                <Line type="monotone" dataKey="attendance" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} fill="url(#fill-attendance)" />
              </LineChart>
            </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
