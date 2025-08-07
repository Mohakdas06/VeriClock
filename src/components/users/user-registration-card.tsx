
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ScanLine, UserPlus, XCircle, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';

interface UserRegistrationCardProps {
  onUserRegistered: (newUser: Omit<User, 'id' | 'registeredAt'>) => void;
}

export function UserRegistrationCard({ onUserRegistered }: UserRegistrationCardProps) {
  const [rfidUid, setRfidUid] = useState('');
  const [validityDate, setValidityDate] = useState<Date | undefined>();
  const [isPolling, setIsPolling] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();

  const pollUid = useCallback(async () => {
    if (document.hidden || isPolling) return; // Don't poll if tab is not active or already polling
    setIsPolling(true);
    try {
      const response = await fetch('/api/rfid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_uid' }),
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.uid && data.uid !== rfidUid) {
        setRfidUid(data.uid);
        toast({
          title: 'New Card Scanned',
          description: `Ready for registration: ${data.uid}`,
        });
      }
    } catch (error) {
      // Silently fail is ok, we'll retry
    } finally {
        setIsPolling(false);
    }
  }, [rfidUid, toast, isPolling]);

  useEffect(() => {
    const interval = setInterval(pollUid, 2000);
    return () => clearInterval(interval);
  }, [pollUid]);

  const clearRfid = async () => {
    const uidToClear = rfidUid;
    setRfidUid('');
    if (uidToClear) {
      try {
        await fetch('/api/rfid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear_uid', uid: uidToClear }),
        });
      } catch (error) {
        console.error('Failed to clear UID on server.', error);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rfidUid) {
      toast({
        title: 'Scan Required',
        description: 'Please scan an RFID card before registering.',
        variant: 'destructive',
      });
      return;
    }
    setIsRegistering(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const newUser: Omit<User, 'id' | 'registeredAt'> = {
      rfidUid,
      name: formData.get('name') as string,
      rollNo: formData.get('rollNo') as string,
      semester: formData.get('semester') as string,
      batch: formData.get('batch') as string,
      email: formData.get('email') as string,
      canAccessResources: false, // Default to no access
      validityDate: validityDate,
    };

    await onUserRegistered(newUser);

    await clearRfid();
    form.reset();
    setValidityDate(undefined);
    setIsRegistering(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <UserPlus /> User Registration
        </CardTitle>
        <CardDescription>
          Scan a new RFID card while a device is in 'Enrollment' mode to register a new user. The UID will appear below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 rounded-md border-2 border-dashed border-primary/50 bg-primary/5 p-4 text-center">
          <div className="mb-2 text-sm font-semibold text-primary">Last Scanned RFID UID</div>
          <div className="font-mono text-2xl tracking-widest text-primary break-all px-2 min-h-[36px] flex items-center justify-center">
            {rfidUid || '---'}
          </div>
          {rfidUid && (
            <Button variant="outline" size="sm" onClick={clearRfid} className="mt-2 text-muted-foreground border-primary hover:bg-primary/10">
              <XCircle className="mr-2" />
              Clear
            </Button>
          )}
        </div>

        <form onSubmit={handleRegister} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rollNo">Roll No.</Label>
            <Input id="rollNo" name="rollNo" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="semester">Semester</Label>
            <Input id="semester" name="semester" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="batch">Batch</Label>
            <Input id="batch" name="batch" placeholder="e.g., 2021-2025" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input id="email" name="email" type="email" />
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
                  {validityDate ? format(validityDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={validityDate}
                  onSelect={setValidityDate}
                  captionLayout="dropdown-buttons"
                  fromYear={new Date().getFullYear()}
                  toYear={new Date().getFullYear() + 10}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="sm:col-span-2 flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={!rfidUid || isRegistering}>
                {isRegistering ? <Loader2 className="animate-spin"/> : 'Register User'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
