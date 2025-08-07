
'use client';

import type { User } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Edit, MoreVertical, Trash2, CalendarOff } from 'lucide-react';
import { EditUserDialog } from './edit-user-dialog';
import { StudentDetailDialog } from './student-detail-dialog';
import { format } from 'date-fns';

interface UserProfileCardProps {
  user: User;
  onUpdateUser: (userId: string, updates: Partial<Omit<User, 'id' | 'rfidUid' | 'registeredAt'>>) => void;
  onDeleteUser: (userId: string) => void;
}

export function UserProfileCard({ user, onUpdateUser, onDeleteUser }: UserProfileCardProps) {
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[1]) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  
  const handleDelete = () => {
    onDeleteUser(user.id);
  };

  return (
    <AlertDialog>
        <StudentDetailDialog user={user}>
            <Card className="text-center transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-4 flex flex-col items-center justify-center relative">
                    <div className="absolute top-2 right-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <EditUserDialog user={user} onUpdateUser={onUpdateUser}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Edit className="mr-2" />
                                        Edit User
                                    </DropdownMenuItem>
                                </EditUserDialog>
                                <DropdownMenuSeparator />
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/40">
                                        <Trash2 className="mr-2" />
                                        Delete User
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <Avatar className="h-16 w-16 text-xl border-2">
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <p className="mt-2 font-semibold text-sm truncate w-full">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.rollNo}</p>
                    {user.validityDate && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <CalendarOff className="h-3 w-3" />
                            Expires {format(new Date(user.validityDate), 'PPP')}
                        </p>
                    )}
                </CardContent>
            </Card>
        </StudentDetailDialog>
      
       <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the user
                    <span className="font-semibold"> {user.name} </span>
                    and remove their data from our servers.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  );
}
