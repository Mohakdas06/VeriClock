
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpenCheck, LayoutDashboard, Cog, Users, CalendarCheck, Menu, Bot, Loader2, UserCircle, Library, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserNav } from '@/components/user-nav';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

const adminNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/devices', label: 'Devices', icon: Cog },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/dashboard/scheduling', label: 'Scheduling', icon: Bot },
];

const studentNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: UserCircle },
    { href: '/dashboard/python-lab', label: 'Python Lab', icon: FlaskConical },
    { href: '/dashboard/resources', label: 'Resources', icon: Library, requiredPermission: 'canAccessResources' },
];

function NavLink({ href, icon: Icon, label, isMobile = false }: { href: string; icon: React.ElementType; label: string; isMobile?: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const linkContent = (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-4 rounded-full p-3 text-muted-foreground transition-all duration-300 ease-in-out hover:bg-primary/10 hover:text-primary',
        isActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
        isMobile ? 'w-full rounded-lg' : 'justify-center'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className={cn('font-medium', { 'sr-only': !isMobile })}>{label}</span>
    </Link>
  );

  if (isMobile) {
    return linkContent;
  }

  return (
    <TooltipProvider delayDuration={0}>
        <Tooltip>
            <TooltipTrigger asChild>
                {linkContent}
            </TooltipTrigger>
            <TooltipContent side="right">
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}


function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { role, studentInfo } = useAuth();
  
  const getNavItems = () => {
    if (role === 'admin') {
      return adminNavItems;
    }
    if (role === 'student') {
      // Always include Python Lab for students
      const baseItems = studentNavItems.filter(item => item.href !== '/dashboard/resources');
      if (studentInfo?.canAccessResources) {
          const resourcesItem = studentNavItems.find(item => item.href === '/dashboard/resources');
          if(resourcesItem) baseItems.push(resourcesItem);
      }
      return baseItems;
    }
    return [];
  };

  const navItems = getNavItems();


  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };
  
  const mobileNav = (
     <nav className="grid gap-2 text-lg font-medium">
        <SheetHeader>
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        </SheetHeader>
        <Link
            href="/dashboard"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            onClick={handleLinkClick}
            >
            <BookOpenCheck className="h-6 w-6" />
            <span className="font-semibold">VeriClock</span>
        </Link>
        {navItems.map((item) => (
            <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                    'flex items-center gap-4 px-2.5 rounded-lg text-muted-foreground hover:text-foreground',
                     pathname === item.href && 'bg-muted text-foreground'
                )}
            >
                <item.icon className="h-5 w-5" />
                {item.label}
            </Link>
        ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="fixed left-4 top-4 z-10 hidden flex-col items-center gap-4 sm:flex">
        <Link
            href="/dashboard"
            className="group flex h-12 w-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
            >
            <BookOpenCheck className="h-6 w-6 transition-all group-hover:rotate-12" />
            <span className="sr-only">VeriClock</span>
        </Link>
        <aside className="flex w-16 flex-col items-center rounded-full bg-card p-2 shadow-lg">
              <nav className="flex flex-col items-center gap-2">
                  {navItems.map((item) => (
                      <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
                  ))}
              </nav>
        </aside>
      </div>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-24">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sm:max-w-xs">
                    {mobileNav}
                </SheetContent>
            </Sheet>
            <div className="ml-auto flex items-center gap-4">
                <UserNav />
            </div>
        </header>
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, role, studentInfo } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace('/');
            return;
        }

        // Redirect students away from admin pages
        if (role === 'student') {
            const allowedStudentPaths = ['/dashboard', '/dashboard/python-lab'];
            if (studentInfo?.canAccessResources) {
                allowedStudentPaths.push('/dashboard/resources');
            }
            if (!allowedStudentPaths.includes(pathname)) {
                router.replace('/dashboard');
            }
        }

    }, [user, loading, role, studentInfo, router, pathname]);

    if (loading || !user) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
  );
}
