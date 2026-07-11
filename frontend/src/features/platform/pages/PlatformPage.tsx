import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { platformApi, PLATFORM_SERVICES, type DependencyHealth } from '../api/platformApi';

function ServiceBadge({ status }: { status: string }) {
  const variant =
    status === 'healthy' ? 'default' as const
    : 'destructive' as const;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge variant={variant} className="text-[10px]">{label}</Badge>;
}

export function PlatformPage() {
  const { data: dependencies, isLoading, isError } = useQuery({
    queryKey: ['platform', 'dependencies'],
    queryFn: async () => {
      const [ready, deps] = await Promise.all([
        platformApi.getReady(),
        platformApi.getDependencies(),
      ]);
      return { ready, deps };
    },
    refetchInterval: 30_000,
  });

  const serviceStatusMap = new Map<string, string>();
  if (dependencies?.deps) {
    for (const dep of dependencies.deps) {
      serviceStatusMap.set(dep.name, dep.status);
    }
    if (dependencies?.ready?.status) {
      serviceStatusMap.set('Platform API', dependencies.ready.status);
    }
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Engine Status</h1>
          <p className="text-sm text-muted-foreground">General microservice status and telemetry health controls</p>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-xs text-muted-foreground text-center">
            Failed to load platform status. Please try again later.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Engine Status</h1>
        <p className="text-sm text-muted-foreground">General microservice status and telemetry health controls</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORM_SERVICES.map((svc) => (
            <Card key={svc} className="bg-card border-border">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-32 mb-3" />
                <Skeleton className="h-6 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORM_SERVICES.map((serviceName) => {
            const status = serviceStatusMap.get(serviceName) || 'offline';
            return (
              <Card key={serviceName} className="bg-card border-border hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {serviceName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ServiceBadge status={status} />
                  {dependencies?.deps?.find((d: DependencyHealth) => d.name === serviceName)?.latency && (
                    <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                      Latency: {dependencies.deps.find((d: DependencyHealth) => d.name === serviceName)!.latency}ms
                    </p>
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

export default PlatformPage;
