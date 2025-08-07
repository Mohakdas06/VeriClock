
'use client';
import { useAuth } from '@/context/auth-context';
import AdminDashboard from '@/components/dashboards/admin-dashboard';
import StudentDashboard from '@/components/dashboards/student-dashboard';
import { Loader2 } from 'lucide-react';


export default function DashboardPage() {
  const { role, loading } = useAuth();
  
  if (loading) {
     return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (role === 'admin') {
    return <AdminDashboard />;
  }
  
  if (role === 'student') {
    return <StudentDashboard />;
  }

  // Fallback or loading state
  return null;
}
