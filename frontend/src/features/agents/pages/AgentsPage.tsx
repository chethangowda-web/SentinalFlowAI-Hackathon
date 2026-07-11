import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AgentCard, type AgentStatus } from '@/components/ai/AgentCard';
import { AgentGraph } from '@/components/ai/AgentGraph';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bot, Activity, CheckCircle, Clock, Cpu, GitBranch, RefreshCw,
} from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';
import agentsApi from '../api/agentsApi';

function MetricBadge({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; color: string;
}) {
  return (
    <motion.div
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-accent/20 border border-border/30"
      whileHover={{ y: -1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-1.5 rounded-md" style={{ backgroundColor: `${color}15`, color }}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold font-mono text-foreground">{value}</p>
      </div>
    </motion.div>
  );
}

function buildTopology(agents: { id: string; name: string }[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = agents.map((agent, i) => ({
    id: agent.id,
    data: { label: agent.name },
    position: { x: 200 + (i % 4) * 160, y: Math.floor(i / 4) * 100 },
  }));

  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `e${nodes[i].id}-${nodes[i + 1].id}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      animated: i % 2 === 0,
    });
  }

  return { nodes, edges };
}

export function AgentsPage() {
  const { data: agents, isLoading, isError, error } = useQuery({
    queryKey: ['agents'],
    queryFn: agentsApi.list,
    refetchInterval: 15000,
  });

  const { data: metrics } = useQuery({
    queryKey: ['agent-metrics'],
    queryFn: agentsApi.getMetrics,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agent Pipeline Orchestration</h1>
          <p className="text-sm text-muted-foreground">Real-time agent pipeline monitoring</p>
        </div>
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-36" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </motion.div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agent Pipeline Orchestration</h1>
          <p className="text-sm text-muted-foreground">Real-time agent pipeline monitoring</p>
        </div>
        <div className="text-center text-xs text-red-400 py-12 border rounded-lg bg-card/20">
          Failed to load agents: {(error as Error)?.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agent Pipeline Orchestration</h1>
          <p className="text-sm text-muted-foreground">Real-time agent pipeline monitoring</p>
        </div>
        <div className="text-center text-xs text-muted-foreground py-12 border rounded-lg bg-card/20">
          No agents found.
        </div>
      </div>
    );
  }

  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.status === 'BUSY').length;
  const avgRate = Math.round(agents.reduce((sum, a) => sum + a.successRate, 0) / totalAgents);
  const totalRuns = agents.reduce((sum, a) => sum + a.runsCount, 0);
  const uniqueModels = [...new Set(agents.map((a) => a.model))].length;

  const { nodes, edges } = buildTopology(agents);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agent Pipeline Orchestration</h1>
          <p className="text-sm text-muted-foreground">
            {totalAgents}-stage pipeline: Real-time agent monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5 text-xs px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
            {totalAgents - activeAgents} Online
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <MetricBadge icon={Bot} label="Total Agents" value={totalAgents} color="#2563eb" />
        <MetricBadge icon={Activity} label="Active Now" value={activeAgents} color="#22c55e" />
        <MetricBadge icon={CheckCircle} label="Avg Success" value={metrics ? `${metrics.avgSuccessRate}%` : `${avgRate}%`} color="#8b5cf6" />
        <MetricBadge icon={Clock} label="Total Executions" value={metrics ? metrics.totalExecutions.toLocaleString() : totalRuns.toLocaleString()} color="#f59e0b" />
        <MetricBadge icon={Cpu} label="Models" value={uniqueModels} color="#06b6d4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {agents.map((stage, i) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02, duration: 0.3 }}
          >
            <AgentCard
              name={stage.name}
              status={stage.status as AgentStatus}
              model={stage.model}
              runsCount={stage.runsCount}
              successRate={stage.successRate}
              lastActive={stage.lastActive}
            />
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border border-border/40 overflow-hidden bg-card/50">
        <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Pipeline Topology</span>
          </div>
          <Badge variant="outline" className="text-[10px] gap-1.5">
            <RefreshCw className="w-3 h-3" />
            Auto-layout
          </Badge>
        </div>
        <div className="h-[500px]">
          <AgentGraph nodes={nodes} edges={edges} />
        </div>
      </div>
    </motion.div>
  );
}

export default AgentsPage;
