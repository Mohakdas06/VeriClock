
'use client';

import Link from 'next/link';
import { BookOpenCheck, User, UserCog } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RoleSelectionPage() {
    const { user, loading, role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);


    if (loading || user) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center mb-12">
        <BookOpenCheck className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-6 text-4xl font-extrabold text-foreground font-headline drop-shadow-lg">
          Welcome to VeriClock
        </h1>
        <p className="mt-2 text-lg text-muted-foreground drop-shadow-md">
          The smart attendance tracking system. Please select your role to continue.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Link href="/login/admin" className="group">
          <Card className="text-center transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2">
            <CardHeader className="p-8">
              <UserCog className="mx-auto h-20 w-20 text-primary transition-transform duration-300 group-hover:scale-110" />
              <CardTitle className="mt-4 font-headline text-2xl">Admin Login</CardTitle>
              <CardDescription className="mt-1">
                Access the management dashboard to oversee users, devices, and attendance.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/login/student" className="group">
          <Card className="text-center transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2">
            <CardHeader className="p-8">
              <User className="mx-auto h-20 w-20 text-primary transition-transform duration-300 group-hover:scale-110" />
              <CardTitle className="mt-4 font-headline text-2xl">Student Login</CardTitle>
              <CardDescription className="mt-1">
                Check your attendance records and view your personal information.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
