
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';

interface EditUserDialogProps {
  user: User;
  onUpdateUser: (userId: string, updates: Partial<Omit<User, 'id' | 'rfidUid' | 'registeredAt'>>) => void;
  children: React.ReactNode; // To use as a trigger
}

export function EditUserDialog({ user, onUpdateUser, children }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [rollNo, setRollNo] = useState(user.rollNo);
  const [semester, setSemester] = useState(user.semester);
  const [batch, setBatch] = useState(user.batch);
  const [email, setEmail] = useState(user.email || '');
  const [canAccessResources, setCanAccessResources] = useState(user.canAccessResources || false);
  const [validityDate, setValidityDate] = useState<Date | undefined>(user.validityDate);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setName(user.name);
      setRollNo(user.rollNo);
      setSemester(user.semester);
      setBatch(user.batch);
      setEmail(user.email || '');
      setCanAccessResources(user.canAccessResources || false);
      setValidityDate(user.validityDate ? new Date(user.validityDate) : undefined);
    }
  }, [open, user]);

  const handleSave = async () => {
    if (!name || !rollNo || !semester || !batch) {
        toast({
            title: 'Validation Error',
            description: 'Please fill out all required fields.',
            variant: 'destructive',
        });
        return;
    }
    setLoading(true);
    const updates = {
        name,
        rollNo,
        semester,
        batch,
        email,
        canAccessResources,
        validityDate: validityDate || null,
    };
    await onUpdateUser(user.id, updates);
    setLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit User</DialogTitle>
          <DialogDescription>
            Update the details for {user.name}. RFID UID cannot be changed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-rfid">RFID UID</Label>
            <Input id="edit-rfid" value={user.rfidUid} disabled className="bg-muted/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit-rollNo">Roll No.</Label>
                <Input id="edit-rollNo" value={rollNo} onChange={(e) => setRollNo(e.target.value)} disabled={loading} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="edit-semester">Semester</Label>
                <Input id="edit-semester" value={semester} onChange={(e) => setSemester(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit-batch">Batch</Label>
                <Input id="edit-batch" value={batch} onChange={(e) => setBatch(e.target.value)} disabled={loading} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email (Optional)</Label>
            <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>Validity Date (Optional)</Label>
             <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !validityDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {validityDate ? format(validityDate, 'PPP') : <span>No expiration</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={validityDate}
                  onSelect={setValidityDate}
                  captionLayout="dropdown-buttons"
                  fromYear={new Date().getFullYear() - 5}
                  toYear={new Date().getFullYear() + 10}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center space-x-2 rounded-md border p-3">
              <Switch 
                id="resources-access" 
                checked={canAccessResources}
                onCheckedChange={setCanAccessResources}
                disabled={loading}
              />
              <Label htmlFor="resources-access" className="flex flex-col">
                <span>Resources Access</span>
                <span className="font-normal text-xs text-muted-foreground">
                    Allow this student to view the Resources page.
                </span>
              </Label>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? <Loader2 className="animate-spin" /> : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
