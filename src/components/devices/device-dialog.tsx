'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import type { Device } from '@/lib/types';


interface AddDeviceDialogProps {
    onAddDevice: (device: Omit<Device, 'id' | 'token' | 'createdAt' | 'mode'>) => void;
}


export function AddDeviceDialog({ onAddDevice }: AddDeviceDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');

  const handleSave = () => {
    if (name && department) {
        onAddDevice({ name, department });
        setOpen(false);
        setName('');
        setDepartment('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Device
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Device</DialogTitle>
          <DialogDescription>
            Fill in the details to register a new RFID device. A unique token will be generated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Main Entrance" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">
              Department
            </Label>
            <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g., CSE" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSave} disabled={!name || !department}>
            Save Device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
