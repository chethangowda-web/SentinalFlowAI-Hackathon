import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useRealtimeStore } from '@/store/realtimeStore';
import { realtimeService } from '@/services/websocket/RealtimeService';
import notificationsApi, { type Notification } from '../api/notificationsApi';

const severityIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  INFO: Info,
  WARN: AlertTriangle,
  ERROR: XCircle,
  SUCCESS: CheckCircle,
};

const severityColor: Record<string, string> = {
  INFO: 'border-blue-500/20 bg-blue-500/5',
  WARN: 'border-amber-500/20 bg-amber-500/5',
  ERROR: 'border-red-500/20 bg-red-500/5',
  SUCCESS: 'border-emerald-500/20 bg-emerald-500/5',
};

const severityBadge: Record<string, string> = {
  INFO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  WARN: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ERROR: 'bg-red-500/10 text-red-400 border-red-500/20',
  SUCCESS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export function NotificationsPage() {
  const { data: notifications, isLoading, isError, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    refetchInterval: 10000,
  });

  const [liveNotifications, setLiveNotifications] = React.useState<Notification[]>([]);
  const { connected } = useRealtimeStore();

  React.useEffect(() => {
    const unsub = realtimeService.subscribeToIncidents((incident: any) => {
      const notification: Notification = {
        id: `live-${Date.now()}`,
        message: incident.title || `New incident: ${incident.id}`,
        severity: incident.severity === 'CRITICAL' || incident.severity === 'HIGH' ? 'ERROR' : 'WARN',
        timestamp: new Date().toISOString(),
        read: false,
      };
      setLiveNotifications((prev) => [notification, ...prev].slice(0, 100));
      toast(notification.message, { description: `Severity: ${incident.severity}` });
    });

    return () => unsub();
  }, []);

  const allNotifications = React.useMemo(() => {
    const map = new Map<string, Notification>();
    (notifications || []).forEach((n) => map.set(n.id, n));
    liveNotifications.forEach((n) => map.set(n.id, n));
    return Array.from(map.values());
  }, [notifications, liveNotifications]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Manage user subscriptions and platform alert dispatches</p>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Manage user subscriptions and platform alert dispatches</p>
        </div>
        <div className="text-center text-xs text-red-400 py-12 border rounded-lg bg-card/20">
          Failed to load notifications: {(error as Error)?.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Manage user subscriptions and platform alert dispatches</p>
        </div>
        <Badge variant="secondary" className="gap-1.5 text-xs px-3 py-1">
          <div className={cn('w-2 h-2 rounded-full', connected ? 'bg-emerald-500 animate-pulse-dot' : 'bg-red-500')} />
          {connected ? 'Live' : 'Disconnected'}
        </Badge>
      </div>

      {allNotifications.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground py-12 border rounded-lg bg-card/20">
          No notifications yet.
        </div>
      ) : (
        <ScrollArea className="h-[600px] rounded-lg border border-border/40">
          <div className="space-y-1 p-2">
            {allNotifications.map((n) => {
              const Icon = severityIcon[n.severity] || Info;
              return (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                    severityColor[n.severity] || 'border-border/30 bg-card/50',
                    !n.read && 'ring-1 ring-primary/20'
                  )}
                >
                  <div className="mt-0.5">
                    <Icon className={cn(
                      'w-4 h-4',
                      n.severity === 'ERROR' && 'text-red-400',
                      n.severity === 'WARN' && 'text-amber-400',
                      n.severity === 'SUCCESS' && 'text-emerald-400',
                      n.severity === 'INFO' && 'text-blue-400'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 shrink-0', severityBadge[n.severity])}>
                    {n.severity}
                  </Badge>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export default NotificationsPage;
