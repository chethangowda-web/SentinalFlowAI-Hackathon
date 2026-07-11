import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { organizationsApi, type OrganizationDetail } from '../api/organizationsApi';

export function OrganizationsPage() {
  const queryClient = useQueryClient();
  const { activeOrganization, switchOrganization } = useAuthStore();

  const { data: organizations = [], isLoading, isError } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationsApi.listOrganizations(),
    refetchInterval: 30_000,
  });

  const switchMutation = useMutation({
    mutationFn: async (orgId: string) => {
      await switchOrganization(orgId);
    },
    onSuccess: () => {
      toast.success('Organization switched successfully');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: () => {
      toast.error('Failed to switch organization');
    },
  });

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Organizations</h1>
          <p className="text-sm text-muted-foreground">Manage multi-tenancy organization nodes and API keys</p>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-xs text-muted-foreground text-center">
            Failed to load organizations. Please try again later.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Organizations</h1>
        <p className="text-sm text-muted-foreground">Manage multi-tenancy organization nodes and API keys</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : organizations.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-xs text-muted-foreground text-center">
            No organizations available.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org: OrganizationDetail) => {
            const isActive = activeOrganization?.id === org.id;
            return (
              <Card
                key={org.id}
                className={`bg-card border-border transition-all hover:shadow-md ${isActive ? 'ring-2 ring-primary' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      {org.name}
                    </CardTitle>
                    {isActive && (
                      <Badge variant="default" className="text-[10px]">Active</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Slug</span>
                    <span className="font-mono text-foreground">{org.slug}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Role</span>
                    <span className="font-mono text-foreground capitalize">{org.role}</span>
                  </div>
                  {org.memberCount !== undefined && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Members</span>
                      <span className="font-mono text-foreground">{org.memberCount}</span>
                    </div>
                  )}
                  {!isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 text-xs"
                      onClick={() => switchMutation.mutate(org.id)}
                      disabled={switchMutation.isPending}
                    >
                      {switchMutation.isPending ? 'Switching...' : 'Switch'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrganizationsPage;
