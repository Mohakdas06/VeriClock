
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { Device } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ArrowUpDown, Copy, RefreshCw, Wifi, WifiOff } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';


interface ColumnsProps {
    onUpdate: (deviceId: string, updates: Partial<Device>) => void;
    onDelete: (deviceId: string) => void;
}

const isDeviceOnline = (device: Device) => {
    if (!device.lastSeen) return false;
    const now = new Date();
    const lastSeen = new Date(device.lastSeen);
    // 5 minutes threshold
    return (now.getTime() - lastSeen.getTime()) < 5 * 60 * 1000;
};

export const columns = ({ onUpdate, onDelete }: ColumnsProps): ColumnDef<Device>[] => [
    {
        id: 'sl.no',
        header: 'Sl. No.',
        cell: ({ row, table }) => {
            const rowIndex = row.index + 1;
            const pageIndex = table.getState().pagination.pageIndex;
            const pageSize = table.getState().pagination.pageSize;
            return <div>{pageIndex * pageSize + rowIndex}</div>;
        },
        enableSorting: false,
        enableHiding: false,
      },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Device Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
        const isOnline = isDeviceOnline(row.original);
        return (
            <div className="flex items-center gap-2">
                 <span className="relative flex h-3 w-3">
                    <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", isOnline ? "animate-ping bg-green-400" : "bg-red-400")}></span>
                    <span className={cn("relative inline-flex rounded-full h-3 w-3", isOnline ? "bg-green-500" : "bg-red-500")}></span>
                </span>
                <div className="font-medium">{row.original.name}</div>
            </div>
        )
    },
  },
  {
    accessorKey: 'department',
    header: 'Department',
  },
  {
    accessorKey: 'token',
    header: 'Token',
    cell: ({ row }) => {
        const { toast } = useToast();
        const handleCopyToken = () => {
            navigator.clipboard.writeText(row.original.token);
            toast({
                title: 'Token Copied',
                description: 'Device token has been copied to clipboard.',
            });
        }
        return (
            <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{row.original.token}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyToken}>
                    <Copy className="h-3 w-3" />
                </Button>
            </div>
        )
    },
  },
  {
    accessorKey: 'mode',
    header: 'Mode',
    cell: ({ row }) => {
      const { toast } = useToast();
      const isEnrollment = row.original.mode === 'Enrollment';
      
      const handleModeChange = (checked: boolean) => {
        const newMode = checked ? 'Enrollment' : 'Attendance';
        onUpdate(row.original.id, { mode: newMode });
         toast({
          title: 'Mode Updated',
          description: `Device "${row.original.name}" switched to ${newMode} mode.`,
        });
      };
      
      return (
        <div className="flex items-center space-x-2">
            <Switch
                id={`mode-switch-${row.original.id}`}
                checked={isEnrollment}
                onCheckedChange={handleModeChange}
                aria-label={`Switch to ${isEnrollment ? 'Attendance' : 'Enrollment'} mode`}
            />
            <Label htmlFor={`mode-switch-${row.original.id}`}>
                 <Badge variant={isEnrollment ? 'default' : 'secondary'}>
                    {row.original.mode}
                </Badge>
            </Label>
        </div>
      );
    },
  },
  {
    accessorKey: 'lastSeen',
    header: 'Last Seen',
    cell: ({ row }) => row.original.lastSeen ? formatDistanceToNow(new Date(row.original.lastSeen), { addSuffix: true }) : 'Never'
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const device = row.original;
      const { toast } = useToast();

      const handleRegenerateToken = () => {
        const newToken = Math.random().toString(36).substring(2, 15);
        onUpdate(device.id, { token: newToken });
        toast({
          title: 'Token Regenerated',
          description: `New token generated for device "${device.name}".`,
        });
      };

      const handleDelete = () => {
        onDelete(device.id);
      };

      return (
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(device.id)}>
                <Copy className="mr-2" />
                Copy Device ID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRegenerateToken}>
                <RefreshCw className="mr-2" />
                Regenerate Token
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/40">
                  Delete Device
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the device
                <span className="font-semibold"> {device.name} </span>
                and remove its data from our servers.
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
    },
  },
];
