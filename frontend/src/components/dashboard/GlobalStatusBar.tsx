import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Cloud,
  Boxes,
  Bot,
  Gauge,
  Database,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRealtimeStore } from '@/store/realtimeStore';
import { useDashboardStore } from '@/features/dashboard/store/dashboardStore';

function useTick() {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  return tick;
}

function StatusItem({
  icon: Icon,
  label,
  children,
  pulse,
}: {
  icon: React.ElementType;
  label: string;
  children?: React.ReactNode;
  pulse?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Icon className="w-3.5 h-3.5 text-muted-foreground/80" />
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

export function GlobalStatusBar() {
  const realtimeConnected = useRealtimeStore((s) => s.connected);
  const realtimeStatus = useRealtimeStore((s) => s.status);
  const lastUpdated = useDashboardStore((s) => s.lastUpdated);
  const tick = useTick();
  const lastSyncSeconds = React.useMemo(() => {
    const val = lastUpdated['realtime'];
    if (!val) return 3;
    const diff = Math.floor(
      (Date.now() - new Date(val).getTime()) / 1000 + tick
    );
    return Math.max(0, diff);
  }, [lastUpdated, tick]);

  const latencyValue = 45;
  const latencyColor =
    latencyValue < 50
      ? 'text-emerald-400'
      : latencyValue < 150
        ? 'text-amber-400'
        : 'text-red-400';

  return (
    <Card
      className={cn(
        'glass-strong rounded-xl px-4 py-2.5',
        'bg-gradient-to-r from-card/95 via-card/90 to-card/95',
        'border-border/60 shadow-sm backdrop-blur-md'
      )}
    >
      <div className="flex items-center gap-0">
        <div className="flex items-center gap-3 shrink-0 pr-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex w-2 h-2">
              <motion.span
                className="absolute inline-flex w-full h-full rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-400 tracking-wide uppercase">
              Production
            </span>
          </div>
        </div>

        <div className="w-px h-5 bg-border/60" />

        <div className="flex items-center gap-3 px-3 shrink-0">
          <Cloud className="w-3.5 h-3.5 text-muted-foreground/80" />
          <span className="text-[11px] font-medium text-muted-foreground">
            AWS EKS
          </span>
        </div>

        <div className="w-px h-5 bg-border/60" />

        <div className="flex items-center gap-2 px-3 shrink-0">
          <Boxes className="w-3.5 h-3.5 text-muted-foreground/80" />
          <span className="text-[11px] font-medium text-muted-foreground">
            23 Services
          </span>
        </div>

        <div className="w-px h-5 bg-border/60" />

        <div className="flex items-center gap-2 px-3 shrink-0">
          <Bot className="w-3.5 h-3.5 text-cyan-400/80" />
          <motion.span
            className="text-[11px] font-medium text-muted-foreground"
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            6 AI Agents Running
          </motion.span>
        </div>

        <div className="w-px h-5 bg-border/60" />

        <div className="flex items-center gap-2 px-3 shrink-0">
          <Gauge className={cn('w-3.5 h-3.5', latencyColor)} />
          <span className={cn('text-[11px] font-medium', latencyColor)}>
            Latency {latencyValue}ms
          </span>
        </div>

        <div className="w-px h-5 bg-border/60" />

        <div className="flex items-center gap-2 px-3 shrink-0">
          <Database className="w-3.5 h-3.5 text-muted-foreground/80" />
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Qdrant Healthy
          </span>
        </div>

        <div className="w-px h-5 bg-border/60" />

        <div className="flex items-center gap-2 px-3 shrink-0">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400/80" />
          </motion.div>
          <span className="text-[11px] font-medium text-indigo-300/80">
            Enkrypt Protected
          </span>
        </div>

        <div className="w-px h-5 bg-border/60" />

        <div className="flex items-center gap-2 pl-3 shrink-0">
          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="text-[11px] font-medium text-muted-foreground/60 tabular-nums">
            Last Sync {lastSyncSeconds} sec ago
          </span>
        </div>
      </div>
    </Card>
  );
}

export default GlobalStatusBar;
