
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { AddDeviceDialog } from '@/components/devices/device-dialog';
import { columns } from '@/components/devices/columns';
import { DataTable } from '@/components/data-table';
import type { Device } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function DevicesPage() {
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'devices'), (snapshot) => {
      const devicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to Date object
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastSeen: doc.data().lastSeen?.toDate(),
      })) as Device[];
      setDevices(devicesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching devices:", error);
      toast({
        title: 'Firestore Error',
        description: 'Failed to fetch devices. Check console for details and ensure security rules are correct.',
        variant: 'destructive',
      });
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [toast]);

  const handleAddDevice = async (newDevice: Omit<Device, 'id' | 'token' | 'createdAt' | 'mode'>) => {
    try {
      const fullNewDevice = {
        ...newDevice,
        token: Math.random().toString(36).substring(2, 15),
        createdAt: serverTimestamp(),
        mode: 'Attendance',
      };
      await addDoc(collection(db, 'devices'), fullNewDevice);
      toast({
        title: 'Device Added',
        description: `Device "${newDevice.name}" has been successfully registered.`,
      });
    } catch (error) {
      console.error("Error adding device: ", error);
      toast({
        title: 'Error',
        description: 'Failed to add device.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateDevice = async (deviceId: string, updates: Partial<Omit<Device, 'id'>>) => {
    const deviceRef = doc(db, 'devices', deviceId);
    try {
      await updateDoc(deviceRef, updates);
      // Toast is now handled in columns component for immediate feedback
    } catch (error) {
      console.error("Error updating device: ", error);
      toast({
        title: 'Error',
        description: 'Failed to update device.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    const deviceToDelete = devices.find(d => d.id === deviceId);
    try {
      await deleteDoc(doc(db, 'devices', deviceId));
      if (deviceToDelete) {
        toast({
          title: 'Device Deleted',
          description: `Device "${deviceToDelete.name}" has been deleted.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error("Error deleting device: ", error);
      toast({
        title: 'Error',
        description: 'Failed to delete device.',
        variant: 'destructive',
      });
    }
  };

  const deviceColumns = React.useMemo(() => columns({
    onUpdate: handleUpdateDevice,
    onDelete: handleDeleteDevice
  }), [devices]);
  
  if (loading) {
    return (
      <>
        <PageHeader title="Device Management" description="Add, update, and manage your RFID devices.">
          <Skeleton className="h-10 w-32" />
        </PageHeader>
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
      <PageHeader title="Device Management" description="Add, update, and manage your RFID devices.">
        <AddDeviceDialog onAddDevice={handleAddDevice} />
      </PageHeader>
      <div className="rounded-lg border shadow-sm bg-card">
        <DataTable columns={deviceColumns} data={devices} />
      </div>
    </>
  );
}
