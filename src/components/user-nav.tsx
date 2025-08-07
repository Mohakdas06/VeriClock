
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';


export function UserNav() {
  const { user, logout, role, studentInfo } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[1]) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  
  if (!user) {
    return null;
  }

  const displayName = role === 'student' ? studentInfo?.name : user.displayName;
  const displayEmail = user.email;

  const trigger = (
     <Button
        variant="ghost"
        className="relative h-9 w-9 rounded-full"
      >
        <Avatar className="h-9 w-9 border-2 border-background shadow-md">
            <AvatarImage src={user.photoURL || `https://placehold.co/100x100.png`} alt={displayName || 'user'} data-ai-hint="avatar" />
            <AvatarFallback>{getInitials(displayName || 'U')}</AvatarFallback>
        </Avatar>
     </Button>
  );


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
          {role === 'admin' && (
            <Link href="/dashboard/profile">
              <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
              </DropdownMenuItem>
            </Link>
          )}
     
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
