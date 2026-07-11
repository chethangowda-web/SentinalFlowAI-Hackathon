import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { DataGrid } from '@/components/data/DataGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import auditApi, { type AuditLog } from '../api/auditApi';

const severityColor: Record<string, string> = {
  INFO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  WARN: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ERROR: 'bg-red-500/10 text-red-400 border-red-500/20',
  CRITICAL: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export function AuditPage() {
  const { data: logs, isLoading, isError, error } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: auditApi.list,
    refetchInterval: 15000,
  });

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      size: 180,
      cell: ({ row }) => new Date(row.original.timestamp).toLocaleString(),
    },
    { accessorKey: 'user', header: 'User', size: 140 },
    { accessorKey: 'action', header: 'Action', size: 260 },
    {
      accessorKey: 'severity',
      header: 'Severity',
      size: 100,
      cell: ({ row }) => (
        <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0', severityColor[row.original.severity] || '')}>
          {row.original.severity}
        </Badge>
      ),
    },
    { accessorKey: 'entity', header: 'Entity', size: 180 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Security Audit Trail</h1>
          <p className="text-sm text-muted-foreground">Immutable logs recording all admin actions and settings changes</p>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Security Audit Trail</h1>
          <p className="text-sm text-muted-foreground">Immutable logs recording all admin actions and settings changes</p>
        </div>
        <div className="text-center text-xs text-red-400 py-12 border rounded-lg bg-card/20">
          Failed to load audit logs: {(error as Error)?.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Security Audit Trail</h1>
          <p className="text-sm text-muted-foreground">Immutable logs recording all admin actions and settings changes</p>
        </div>
        <div className="text-center text-xs text-muted-foreground py-12 border rounded-lg bg-card/20">
          No audit logs found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Security Audit Trail</h1>
        <p className="text-sm text-muted-foreground">Immutable logs recording all admin actions and settings changes</p>
      </div>
      <DataGrid columns={columns} data={logs} height="600px" />
    </div>
  );
}

export default AuditPage;
