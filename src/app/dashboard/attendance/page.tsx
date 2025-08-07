
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { columns } from '@/components/attendance/columns';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Download, Filter, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { AttendanceLog, Device } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { type DateRange } from 'react-day-picker';


export default function AttendancePage() {
    const [date, setDate] = React.useState<DateRange | undefined>({ from: new Date(), to: new Date()});
    const [semester, setSemester] = React.useState<string>('all');
    
    const [allLogs, setAllLogs] = React.useState<AttendanceLog[]>([]);
    const [filteredLogs, setFilteredLogs] = React.useState<AttendanceLog[]>([]);
    
    const [loading, setLoading] = React.useState(true);
    const { toast } = useToast();

    // Fetch all logs initially and listen for real-time updates
    React.useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(collection(db, "attendance_logs"), (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date()
            })) as AttendanceLog[];
            const sortedLogs = logsData.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
            setAllLogs(sortedLogs);
            setFilteredLogs(sortedLogs); // Initially show all logs
            setLoading(false);
        }, (error) => {
            console.error("Error fetching attendance logs: ", error);
            toast({
                title: "Firestore Error",
                description: "Could not fetch attendance logs. Check console and security rules.",
                variant: "destructive"
            });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);
    

    const handleFilter = async () => {
        let logs = allLogs;

        if (date?.from && date?.to) {
            logs = logs.filter(log => {
                const logDate = new Date(log.timestamp);
                return logDate >= startOfDay(date.from!) && logDate <= endOfDay(date.to!);
            });
        }
        
        if (semester !== 'all') {
            logs = logs.filter(log => log.userSemester === semester);
        }

        setFilteredLogs(logs);

        toast({
            title: 'Filters Applied',
            description: `Showing ${logs.length} records.`
        })
    };

    const handleExport = () => {
        const headers = ['Name', 'Roll No.', 'Semester', 'Date', 'Time', 'Device ID', 'Status'];
        const data = filteredLogs.map(log => {
            const timestamp = new Date(log.timestamp);
            return [
                log.userName,
                log.userRollNo,
                log.userSemester,
                timestamp.toLocaleDateString(),
                timestamp.toLocaleTimeString(),
                log.deviceId,
                log.status,
            ];
        });
    
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + data.map(e => e.join(",")).join("\n");
    
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "attendance_log.csv");
        document.body.appendChild(link);
    
        link.click();
        document.body.removeChild(link);

        toast({
            title: 'Exporting Data',
            description: 'Attendance log has been downloaded.'
        })
    }

    if (loading) {
        return (
          <>
            <PageHeader title="Attendance Logs" description="View, filter, and export attendance records." />
             <div className="rounded-lg border shadow-sm p-4 space-y-4 bg-card">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
          </>
        )
      }

  return (
    <>
      <PageHeader title="Attendance Logs" description="View, filter, and export attendance records." />
      
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                'w-[300px] justify-start text-left font-normal bg-card',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'LLL dd, y')} -{' '}
                    {format(date.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(date.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={date}
              onSelect={setDate}
              captionLayout="dropdown-buttons"
              fromYear={new Date().getFullYear() - 10}
              toYear={new Date().getFullYear()}
              initialFocus
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="w-[180px] bg-card hover:bg-muted">
                <SelectValue placeholder="All Semesters" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value="SEM1">SEM1</SelectItem>
                <SelectItem value="SEM2">SEM2</SelectItem>
                <SelectItem value="SEM3">SEM3</SelectItem>
                <SelectItem value="SEM4">SEM4</SelectItem>
                <SelectItem value="SEM5">SEM5</SelectItem>
                <SelectItem value="SEM6">SEM6</SelectItem>
                <SelectItem value="SEM7">SEM7</SelectItem>
                <SelectItem value="SEM8">SEM8</SelectItem>
            </SelectContent>
        </Select>


        <Button onClick={handleFilter}>
            <Filter className="mr-2 h-4 w-4" />
            Apply Filter
        </Button>

        <div className="ml-auto">
            <Button variant="outline" onClick={handleExport} disabled={filteredLogs.length === 0} className="bg-black text-white hover:bg-black/80">
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
            </Button>
        </div>
      </div>

      <div className="rounded-lg border shadow-sm bg-card">
        <DataTable columns={columns} data={filteredLogs} />
      </div>
    </>
  );
}
