
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';

const COLORS = ['#4CAF50', '#F44336']; // Green for Present, Red for Absent

interface AttendancePieChartProps {
    presentDays: number;
    absentDays: number;
    loading: boolean;
}

export function AttendancePieChart({ presentDays, absentDays, loading }: AttendancePieChartProps) {
    
    const totalDays = presentDays + absentDays;
    const data = [
        { name: 'Present', value: presentDays },
        { name: 'Absent', value: absentDays },
    ];
    const presentPercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    const getPercentageColor = () => {
        if (presentPercentage > 70) {
            return '#50C878'; // Emerald Green
        }
        if (presentPercentage >= 50) {
            return '#FFB343'; // Pastel Orange/Amber
        }
        return '#FF2E2E'; // Bright Red
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Skeleton className="h-32 w-32 rounded-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Attendance Analytics</CardTitle>
                <CardDescription>
                    Your attendance rate for the selected month.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {totalDays > 0 ? (
                    <div className="w-full h-40 relative">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    innerRadius={55}
                                    outerRadius={70}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                         <div className="absolute inset-0 flex items-center justify-center">
                            <span 
                                className="text-3xl font-bold"
                                style={{ color: getPercentageColor() }}
                            >
                                {presentPercentage}%
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                        No attendance data for this month yet.
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <div className="flex w-full justify-center items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[0] }} />
                        <span>Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[1] }} />
                        <span>Absent</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
