
'use client';
import { Users, Cog, CalendarCheck, Wifi, WifiOff } from 'lucide-react';
import { StatCard } from '@/components/stat-card';
import { AttendanceChart } from '@/components/attendance-chart';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, where, getCountFromServer } from 'firebase/firestore';
import { startOfToday, endOfToday } from 'date-fns';
import { db } from '@/lib/firebase';
import type { User, Device, AttendanceLog } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

export default function AdminDashboard() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [userCount, setUserCount] = useState<number>(0);
  const [deviceCount, setDeviceCount] = useState<number>(0);
  const [todayAttendanceCount, setTodayAttendanceCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Fetch counts
  useEffect(() => {
    const fetchCounts = async () => {
      const usersCol = collection(db, 'users');
      const devicesCol = collection(db, 'devices');
      const attendanceCol = collection(db, 'attendance_logs');

      const todayStart = startOfToday();
      const todayEnd = endOfToday();
      
      const attendanceQuery = query(
        attendanceCol,
        where('timestamp', '>=', todayStart),
        where('timestamp', '<=', todayEnd)
      );

      try {
        const [userSnapshot, deviceSnapshot, todayAttendanceSnapshot] = await Promise.all([
          getCountFromServer(usersCol),
          getCountFromServer(devicesCol),
          getCountFromServer(attendanceQuery)
        ]);
        
        setUserCount(userSnapshot.data().count);
        setDeviceCount(deviceSnapshot.data().count);
        setTodayAttendanceCount(todayAttendanceSnapshot.data().count);
      } catch (error) {
        console.error("Error fetching counts: ", error);
      }
    };

    fetchCounts();

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), snapshot => {
        setUserCount(snapshot.size);
    }, (error) => console.error("Users snapshot error: ", error));

    const unsubscribeDevices = onSnapshot(collection(db, 'devices'), snapshot => {
        setDeviceCount(snapshot.size);
    }, (error) => console.error("Devices snapshot error: ", error));

    // Also listen for changes in today's attendance
     const todayStart = startOfToday();
     const todayEnd = endOfToday();
     const attendanceQuery = query(
        collection(db, 'attendance_logs'),
        where('timestamp', '>=', todayStart),
        where('timestamp', '<=', todayEnd)
      );
    const unsubscribeAttendance = onSnapshot(attendanceQuery, snapshot => {
      setTodayAttendanceCount(snapshot.size);
    }, (error) => console.error("Attendance snapshot error: ", error));

    return () => {
        unsubscribeUsers();
        unsubscribeDevices();
        unsubscribeAttendance();
    }
  }, []);

  // Fetch recent users
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'users'), orderBy('registeredAt', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recentUsersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registeredAt: doc.data().registeredAt?.toDate() || new Date()
      })) as User[];
      setUsers(recentUsersData);
      setLoading(false);
    }, (error) => {
      console.error("Recent users snapshot error: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  // Fetch devices for status
  useEffect(() => {
    const q = query(collection(db, 'devices'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const devicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastSeen: doc.data().lastSeen?.toDate()
      })) as Device[];
      setDevices(devicesData);
    }, (error) => {
      console.error("Devices snapshot error: ", error);
    });
    return () => unsubscribe();
  }, []);

  const isDeviceOnline = (device: Device) => {
    if (!device.lastSeen) return false;
    const now = new Date();
    const lastSeen = new Date(device.lastSeen);
    // 5 minutes threshold
    return (now.getTime() - lastSeen.getTime()) < 5 * 60 * 1000;
  }
  
  const adminName = authUser?.displayName?.split(' ')[0] || 'Admin';


  return (
    <>
      <PageHeader title={`Hi, ${adminName}`} description="Here’s your system summary." />
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Users" value={userCount.toString()} icon={Users} description="Registered across all departments" loading={loading && users.length === 0} gradient="kpi-gradient-1" />
        <StatCard title="Total Devices" value={deviceCount.toString()} icon={Cog} description="Active and enrollment devices" loading={loading && users.length === 0} />
        <StatCard title="Today's Attendance" value={todayAttendanceCount.toString()} icon={CalendarCheck} description="Entries recorded today" loading={loading && users.length === 0}/>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6">
        <Card>
            <CardHeader>
                <CardTitle className='font-headline'>Device Status</CardTitle>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
                    {loading ? (
                         [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
                    ) : (
                        devices.map(device => {
                            const isOnline = isDeviceOnline(device);
                            return (
                                <div key={device.id} className="flex items-center space-x-4 rounded-lg border p-4">
                                    {isOnline ? <Wifi className="text-green-500" /> : <WifiOff className="text-red-500" />}
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">{device.name}</p>
                                        <p className="text-sm text-muted-foreground">{device.department}</p>
                                    </div>
                                    <Badge variant={isOnline ? 'default' : 'destructive'} className={cn(isOnline && 'bg-green-100 text-green-800 border-green-200')}>{isOnline ? 'Online' : 'Offline'}</Badge>
                                </div>
                            )
                        })
                    )}
                </CardContent>
            </CardHeader>
        </Card>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <AttendanceChart />
        </div>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Recent Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Roll No.</TableHead>
                  <TableHead>Batch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground md:hidden">{user.rollNo}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{user.rollNo}</TableCell>
                    <TableCell><Badge variant="outline">{user.batch}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

