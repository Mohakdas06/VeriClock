
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { AttendanceLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const columns: ColumnDef<AttendanceLog>[] = [
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
    accessorKey: 'userName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.original.userName}</div>,
  },
  {
    accessorKey: 'userRollNo',
    header: 'Roll No.',
  },
  {
    accessorKey: 'userSemester',
    header: 'Semester',
  },
  {
    accessorKey: 'timestamp',
    header: 'Date & Time',
    cell: ({ row }) => {
        const date = new Date(row.original.timestamp);
        return (
            <div>
                <div>{date.toLocaleDateString()}</div>
                <div className="text-xs text-muted-foreground">{date.toLocaleTimeString()}</div>
            </div>
        )
    }
  },
  {
    accessorKey: 'deviceId',
    header: 'Device ID',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: () => <Badge className="bg-green-100 text-green-800 border-green-200">Present</Badge>
  }
];
