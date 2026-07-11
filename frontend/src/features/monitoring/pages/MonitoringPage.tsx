import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity, Cpu, HardDrive, Database, Container, Globe,
  Radio, Wifi, Server, Gauge, Clock, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const METRICS = [
  { label: 'CPU Usage', value: '23%', icon: Cpu, color: '#2563EB', data: [45, 52, 38, 41, 35, 28, 23] },
  { label: 'Memory', value: '6.2 GB', icon: HardDrive, color: '#22C55E', data: [72, 68, 65, 70, 66, 63, 62] },
  { label: 'Disk I/O', value: '145 MB/s', icon: Database, color: '#A78BFA', data: [120, 135, 128, 142, 138, 140, 145] },
  { label: 'Pods', value: '24/24', icon: Container, color: '#F59E0B', data: [24, 24, 23, 24, 24, 24, 24] },
  { label: 'Containers', value: '89', icon: Server, color: '#06B6D4', data: [85, 87, 88, 88, 89, 89, 89] },
  { label: 'Deployments', value: '12', icon: Globe, color: '#34D399', data: [12, 12, 12, 12, 12, 12, 12] },
  { label: 'Latency P99', value: '245ms', icon: Gauge, color: '#F59E0B', data: [320, 280, 260, 240, 250, 245, 245] },
  { label: 'Requests/s', value: '1,847', icon: Activity, color: '#3B82F6', data: [1200, 1450, 1600, 1750, 1800, 1840, 1847] },
];

const LOG_LINES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  time: new Date(Date.now() - (20 - i) * 3000).toISOString(),
  level: ['INFO', 'WARN', 'ERROR'][Math.floor(Math.random() * 3)] as 'INFO' | 'WARN' | 'ERROR',
  message: [
    'kubelet: Pod authentication-service-7f6b9c7d9-abcde started successfully',
    'prometheus: Scrape of production/istio-proxy (172.16.0.1:15090) completed',
    'istio: Inbound HTTP request to reviews.prod.svc.cluster.local:9080',
    'kubelet: Container auth-db-primary OOMKilled — restart policy triggered',
    'envoy: upstream_reset_before_response_reset_exceeded for cluster auth-service',
    'alertmanager: Firing alert — HighMemoryUsage on pod production-gateway-5x2f1',
    'kube-apiserver: auth delegation error: token_review access denied',
    'fluentd: Successfully flushed 1245 log entries to S3',
    'hpa: Scaling up deployment api-gateway from 3 to 5 replicas',
    'istio: mTLS handshake error between reviews:9080 and ratings:9080',
  ][i % 10],
}));

const LEVEL_COLORS = {
  INFO: 'text-blue-400',
  WARN: 'text-amber-400',
  ERROR: 'text-red-400',
};

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
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

export function MonitoringPage() {
  const [logs, setLogs] = useState(LOG_LINES);

  useEffect(() => {
    const interval = setInterval(() => {
      const levels = ['INFO', 'WARN', 'ERROR'] as const;
      const msgs = [
        'kubelet: Health check passed for pod nginx-ingress-6b9f7c9d8-x7k2l',
        'prometheus: Target prometheus-pushgateway (10.96.0.4:9091) up',
        'envoy: cluster auth-service endpoint 10.1.0.23:8080 health check failed',
        'alertmanager: Resolved alert — HighCPUUsage on worker-node-3',
        'fluentd: Buffer flush to elasticsearch cluster took 2300ms',
      ];
      const newLog = {
        id: Date.now(),
        time: new Date().toISOString(),
        level: levels[Math.floor(Math.random() * 3)],
        message: msgs[Math.floor(Math.random() * msgs.length)],
      };
      setLogs(prev => [...prev.slice(-99), newLog]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Live Monitoring</h1>
          <p className="text-sm text-muted-foreground">Real-time infrastructure telemetry and streaming logs</p>
        </div>
        <Badge variant="secondary" className="gap-1.5 text-xs px-3 py-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
          Streaming Live
        </Badge>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {METRICS.map((metric) => (
          <motion.div
            key={metric.label}
            className="kpi-card"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${metric.color}15` }}>
                <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
              </div>
              <MiniSparkline data={metric.data} color={metric.color} />
            </div>
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{metric.label}</p>
            <p className="text-lg font-bold font-mono text-foreground">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Streaming Logs */}
      <Card className="bg-card border-border/40 rounded-xl overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            Streaming Log Terminal
          </CardTitle>
          <Badge variant="outline" className="text-[10px] gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
            {logs.length} events
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-black/60 border-t border-border/30 rounded-b-xl log-terminal max-h-[480px] overflow-y-auto p-3 space-y-1">
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 text-[11px] leading-relaxed"
              >
                <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0 w-16 tabular-nums">
                  {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className={cn('shrink-0 w-12 font-semibold uppercase', LEVEL_COLORS[log.level])}>
                  {log.level}
                </span>
                <span className="text-slate-300/90">{log.message}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default MonitoringPage;
