import React from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Boxes,
  Brain,
  Radio,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SystemHealthNode } from '@/features/dashboard/types';

interface InfraNodeCardProps {
  node: SystemHealthNode;
}

const NODE_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  PostgreSQL: { icon: Database, color: '#3b82f6' },
  Kubernetes: { icon: Boxes, color: '#3b82f6' },
  Qdrant: { icon: Database, color: '#a855f7' },
  Redis: { icon: Database, color: '#ef4444' },
  'Groq AI': { icon: Brain, color: '#22c55e' },
  'WebSocket Gateway': { icon: Radio, color: '#06b6d4' },
};

function getNodeIcon(name: string) {
  for (const [key, config] of Object.entries(NODE_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return config;
    }
  }
  return { icon: Database, color: '#6b7280' };
}

function getStatusColor(status: string) {
  switch (status) {
    case 'OK':
      return '#22c55e';
    case 'DEGRADED':
      return '#eab308';
    case 'ERROR':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

function getBadgeVariant(status: string) {
  switch (status) {
    case 'OK':
      return 'default' as const;
    case 'DEGRADED':
      return 'secondary' as const;
    case 'ERROR':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

function getBadgeClasses(status: string) {
  switch (status) {
    case 'OK':
      return 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30';
    case 'DEGRADED':
      return 'bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/30';
    case 'ERROR':
      return '';
    default:
      return '';
  }
}

function isPercentageValue(key: string): boolean {
  const lower = key.toLowerCase();
  return lower.includes('usage') || lower.includes('percentage') || lower.includes('rate') || lower.includes('percent');
}

function MetricValue({ label, value }: { label: string; value: number }) {
  const isPercent = isPercentageValue(label);

  return (
    <div className="space-y-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label.replace(/([A-Z])/g, ' $1').trim()}
      </span>
      <div className="flex items-center gap-2">
        {isPercent ? (
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-mono text-xs font-semibold">{value}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(value, 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="font-mono text-xs font-semibold">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        )}
      </div>
    </div>
  );
}

export function InfraNodeCard({ node }: InfraNodeCardProps) {
  const { icon: Icon, color } = getNodeIcon(node.name);
  const statusColor = getStatusColor(node.status);
  const metrics = node.metrics ?? {};

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="glass rounded-xl border border-border/50 hover:border-primary/20 transition-all duration-200 group"
    >
      <Card className="bg-transparent border-0 shadow-none overflow-hidden">
        <motion.div
          className="h-1 w-full"
          style={{ backgroundColor: statusColor }}
          whileHover={{ scaleX: 1.05 }}
          transition={{ duration: 0.2 }}
          initial={false}
        />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="rounded-lg p-1.5"
                style={{ backgroundColor: color + '15' }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color }} />
              </div>
              <span className="font-semibold text-xs text-foreground">
                {node.name}
              </span>
            </div>
            <Badge
              variant={getBadgeVariant(node.status)}
              className={cn(
                'text-[10px] px-1.5 py-0 font-medium',
                getBadgeClasses(node.status),
              )}
            >
              {node.status === 'OK' ? 'Healthy' : node.status === 'DEGRADED' ? 'Degraded' : 'Error'}
            </Badge>
          </div>

          {Object.keys(metrics).length > 0 && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {Object.entries(metrics).map(([key, val]) => (
                <MetricValue key={key} label={key} value={val} />
              ))}
            </div>
          )}

          {node.usagePercentage !== undefined && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Usage</span>
                <span className="font-mono text-[10px] font-semibold">{node.usagePercentage}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(node.usagePercentage, 100)}%`,
                    backgroundColor: statusColor,
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default InfraNodeCard;
