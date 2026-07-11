import * as React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AgentStatusItem } from '@/features/dashboard/types';

interface AgentPipelineCardProps {
  agent: AgentStatusItem;
}

export function AgentPipelineCard({ agent }: AgentPipelineCardProps) {
  const completion =
    agent.status === 'IDLE' ? 100 : agent.status === 'BUSY' ? 65 : 0;

  const confidence =
    agent.health === 'HEALTHY' ? 96 : agent.health === 'DEGRADED' ? 85 : 50;

  const formattedLatency =
    agent.latencyMs >= 1000
      ? `${(agent.latencyMs / 1000).toFixed(1)}s`
      : `${agent.latencyMs}ms`;

  const statusColor =
    agent.status === 'IDLE'
      ? 'bg-emerald-400'
      : agent.status === 'BUSY'
        ? 'bg-sky-400'
        : 'bg-muted-foreground/40';

  return (
    <Card
      className={cn(
        'glass-strong rounded-xl border-border/50',
        'bg-gradient-to-r from-card/95 via-card/90 to-card/95',
        'backdrop-blur-md hover:border-purple-500/30 transition-all duration-200'
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            {agent.status === 'BUSY' && (
              <motion.span
                className={cn('absolute inline-flex size-full rounded-full', statusColor)}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <span className={cn('relative inline-flex size-2 rounded-full', statusColor)} />
          </span>
          <CardTitle className="text-sm font-semibold">{agent.name}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        <div className="relative h-2 rounded-full bg-muted/30 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white mix-blend-difference">
            {completion}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground">Execution</span>
            <p className="text-[11px] font-mono font-medium text-foreground">
              {formattedLatency}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground">Confidence</span>
            <p className="text-[11px] font-mono font-medium text-foreground">
              {confidence}%
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground">Task</span>
            <p className="text-[11px] font-mono font-medium text-foreground truncate">
              {agent.currentTask || 'Standing by'}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground">Model</span>
            <p className="text-[11px] font-mono font-medium text-foreground truncate">
              {agent.model}
            </p>
          </div>
        </div>

        <div className="pt-1">
          {agent.status === 'BUSY' && (
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-sky-500/15 text-sky-400 border-sky-500/30 animate-pulse text-[10px] px-1.5 py-0"
              >
                RUNNING
              </Badge>
              {agent.currentTask && (
                <span className="text-[11px] text-muted-foreground truncate">
                  {agent.currentTask}
                </span>
              )}
            </div>
          )}
          {agent.status === 'IDLE' && (
            <Badge
              variant="secondary"
              className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0"
            >
              READY
            </Badge>
          )}
          {agent.status === 'OFFLINE' && (
            <Badge
              variant="secondary"
              className="bg-muted/30 text-muted-foreground border-border/40 text-[10px] px-1.5 py-0"
            >
              OFFLINE
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AgentPipelineCard;
