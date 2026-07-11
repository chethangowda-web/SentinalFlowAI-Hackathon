import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity, Cpu, HardDrive, Database, Container,
  Radio, Server, Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealtimeStore } from '@/store/realtimeStore';
import { realtimeService } from '@/services/websocket/RealtimeService';
import monitoringApi from '../api/monitoringApi';

const metricIcons: Record<string, React.ComponentType<{ className?: string; color?: string }>> = {
  'CPU Usage': Cpu,
  'Memory': HardDrive,
  'Disk I/O': Database,
  'Pods': Container,
  'Containers': Server,
  'Deployments': Server,
  'Latency P99': Gauge,
  'Requests/s': Activity,
};

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.6}
      />
    </svg>
  );
}

interface LogEntry {
  id: string;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

const LEVEL_COLORS = {
  INFO: 'text-blue-400',
  WARN: 'text-amber-400',
  ERROR: 'text-red-400',
};

export function MonitoringPage() {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const { status: connectionStatus } = useRealtimeStore();

  const { data: healthMetrics, isLoading: metricsLoading, isError: metricsError } = useQuery({
    queryKey: ['health-metrics'],
    queryFn: monitoringApi.getHealthMetrics,
    refetchInterval: 10000,
  });

  React.useEffect(() => {
    const unsubIncident = realtimeService.subscribeToIncidents((data: any) => {
      const entry: LogEntry = {
        id: `log-${Date.now()}-${Math.random()}`,
        time: new Date().toISOString(),
        level: data.severity === 'CRITICAL' || data.severity === 'HIGH' ? 'ERROR' : 'WARN',
        message: `[Incident] ${data.title || data.id}: ${data.severity || 'INFO'} severity`,
      };
      setLogs((prev) => [entry, ...prev].slice(0, 200));
    });

    const unsubDashboard = realtimeService.subscribeToDashboardUpdate((data: any) => {
      const entry: LogEntry = {
        id: `log-${Date.now()}-${Math.random()}`,
        time: new Date().toISOString(),
        level: 'INFO',
        message: `[Dashboard] Stats updated: ${data.totalIncidents || 0} total incidents`,
      };
      setLogs((prev) => [entry, ...prev].slice(0, 200));
    });

    const unsubStatus = realtimeService.subscribeToConnectionStatus((data: any) => {
      const entry: LogEntry = {
        id: `log-${Date.now()}-${Math.random()}`,
        time: new Date().toISOString(),
        level: data.status === 'CONNECTED' ? 'INFO' : 'WARN',
        message: `[Connection] WebSocket ${data.status}`,
      };
      setLogs((prev) => [entry, ...prev].slice(0, 200));
    });

    return () => {
      unsubIncident();
      unsubDashboard();
      unsubStatus();
    };
  }, []);

  const metrics = healthMetrics && healthMetrics.length > 0 ? healthMetrics : [];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Live Monitoring</h1>
          <p className="text-sm text-muted-foreground">Real-time infrastructure telemetry and streaming logs</p>
        </div>
        <Badge variant="secondary" className="gap-1.5 text-xs px-3 py-1">
          <div className={cn('w-2 h-2 rounded-full', connectionStatus === 'CONNECTED' ? 'bg-emerald-500 animate-pulse-dot' : 'bg-red-500')} />
          {connectionStatus === 'CONNECTED' ? 'Streaming Live' : connectionStatus === 'FAILED' ? 'Disconnected' : 'Connecting...'}
        </Badge>
      </div>

      {metricsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : metricsError ? (
        <div className="text-center text-xs text-red-400 py-8 border rounded-lg bg-card/20">
          Failed to load health metrics.
        </div>
      ) : metrics.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((metric) => {
            const Icon = metricIcons[metric.label] || Activity;
            const color = metric.label.includes('CPU') ? '#2563EB'
              : metric.label.includes('Memory') ? '#22C55E'
              : metric.label.includes('Disk') ? '#A78BFA'
              : metric.label.includes('Pod') ? '#F59E0B'
              : metric.label.includes('Container') ? '#06B6D4'
              : metric.label.includes('Deploy') ? '#34D399'
              : metric.label.includes('Latency') ? '#F59E0B'
              : '#3B82F6';

            return (
              <motion.div
                key={metric.label}
                className="kpi-card"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-4 h-4" color={color} />
                  </div>
                  {metric.data && metric.data.length > 1 && (
                    <MiniSparkline data={metric.data} color={color} />
                  )}
                </div>
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{metric.label}</p>
                <p className="text-lg font-bold font-mono text-foreground">{metric.value}</p>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-xs text-muted-foreground py-8 border rounded-lg bg-card/20">
          No metrics data available.
        </div>
      )}

      <Card className="bg-card border-border/40 rounded-xl overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Radio className={cn('w-4 h-4', connectionStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-muted-foreground')} />
            Streaming Log Terminal
          </CardTitle>
          <Badge variant="outline" className="text-[10px] gap-1.5">
            <div className={cn('w-1.5 h-1.5 rounded-full', connectionStatus === 'CONNECTED' ? 'bg-emerald-500 animate-pulse-dot' : 'bg-red-500')} />
            {logs.length} events
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="bg-black/60 border-t border-border/30 rounded-b-xl h-[480px]">
            <div className="p-3 space-y-1">
              {logs.length === 0 ? (
                <div className="text-[11px] text-muted-foreground text-center py-8">
                  Waiting for WebSocket events...
                </div>
              ) : (
                logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3 text-[11px] leading-relaxed border-l-2 pl-2"
                  >
                    <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0 w-16 tabular-nums">
                      {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={cn('shrink-0 w-12 font-semibold uppercase', LEVEL_COLORS[log.level])}>
                      {log.level}
                    </span>
                    <span className="text-slate-300/90">{log.message}</span>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default MonitoringPage;
