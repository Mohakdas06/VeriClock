
'use client';
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakTrackerProps {
    streak: number;
    recordStreak: number;
    weeklyAttendance: { day: string; attended: boolean }[];
    loading: boolean;
}

export function StreakTracker({ streak, recordStreak, weeklyAttendance, loading }: StreakTrackerProps) {
  
  if (loading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex justify-between items-center p-6">
                <Skeleton className="h-16 w-1/2" />
                <Skeleton className="h-16 w-1/2" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline">Attendance Streak</CardTitle>
            <div className="flex items-baseline gap-3">
                 <p className="font-headline text-5xl">
                    {streak}
                </p>
                <p className="text-muted-foreground">days streak</p>
            </div>
             <CardDescription>
                    The record is {recordStreak} days without a break
            </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
           <div className="flex justify-around items-center">
             {(weeklyAttendance || []).map(({ day, attended }) => (
                <div key={day} className="flex flex-col items-center gap-1">
                    <span className={cn("text-4xl", !attended && "opacity-20")}>🔥</span>
                    <span className="text-sm font-medium text-muted-foreground">{day}</span>
                </div>
             ))}
           </div>
        </CardContent>
    </Card>
  );
};
