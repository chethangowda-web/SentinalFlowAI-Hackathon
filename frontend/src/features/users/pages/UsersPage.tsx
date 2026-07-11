import { useQuery } from '@tanstack/react-query';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataGrid } from '@/components/data/DataGrid';
import { formatRelativeTime } from '@/utils/formatters';
import { usersApi, type TeamMember } from '../api/usersApi';

const columnHelper = createColumnHelper<TeamMember>();

const columns: ColumnDef<TeamMember, any>[] = [
  columnHelper.accessor('name', {
    header: 'Name',
    size: 200,
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="flex items-center gap-2.5">
          <Avatar className="w-7 h-7">
            <AvatarImage src={row.avatarUrl} />
            <AvatarFallback className="text-[10px]">
              {row.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-xs font-medium text-foreground truncate">{row.name}</div>
        </div>
      );
    },
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    size: 220,
    cell: (info) => (
      <span className="text-xs text-muted-foreground truncate">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    size: 120,
    cell: (info) => (
      <span className="text-xs font-mono text-foreground capitalize">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    size: 100,
    cell: (info) => {
      const status = info.getValue();
      const variant = status === 'ACTIVE' ? 'default' as const
        : status === 'PENDING' ? 'secondary' as const
        : 'destructive' as const;
      return <Badge variant={variant} className="text-[10px]">{status}</Badge>;
    },
  }),
  columnHelper.accessor('lastActiveAt', {
    header: 'Last Active',
    size: 140,
    cell: (info) => (
      <span className="text-[10px] text-muted-foreground font-mono">
        {info.getValue() ? formatRelativeTime(info.getValue()) : 'Never'}
      </span>
    ),
  }),
];

export function UsersPage() {
  const { data: members = [], isLoading, isError } = useQuery({
    queryKey: ['users', 'members'],
    queryFn: () => usersApi.listMembers(),
    refetchInterval: 30_000,
  });

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Member Directory</h1>
          <p className="text-sm text-muted-foreground">Manage organization user accounts and role permissions</p>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-xs text-muted-foreground text-center">
            Failed to load members. Please try again later.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Member Directory</h1>
        <p className="text-sm text-muted-foreground">Manage organization user accounts and role permissions</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : members.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-xs text-muted-foreground text-center">
            No members found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Total of {members.length} registered platform member{members.length !== 1 ? 's' : ''}.
          </p>
          <DataGrid columns={columns} data={members} height="500px" />
        </div>
      )}
    </div>
  );
}

export default UsersPage;
