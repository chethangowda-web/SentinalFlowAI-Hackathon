import * as React from 'react';
import { motion } from 'framer-motion';
import { AgentCard, type AgentStatus } from '@/components/ai/AgentCard';
import { AgentGraph } from '@/components/ai/AgentGraph';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bot, Activity, CheckCircle, Clock, Cpu, Play,
  Zap, GitBranch, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Node, Edge } from '@xyflow/react';

const PIPELINE_STAGES = [
  { id: '1', name: 'Incident Intake', model: 'embedding-service', runs: 1240, rate: 99, status: 'IDLE' as AgentStatus, lastActive: '2m ago' },
  { id: '2', name: 'Learning Retrieval (RAG)', model: 'qdrant-memory', runs: 1180, rate: 97, status: 'IDLE' as AgentStatus, lastActive: '2m ago' },
  { id: '3', name: 'Anomaly Detection', model: 'groq/llama-3.1-8b', runs: 1150, rate: 96, status: 'BUSY' as AgentStatus, lastActive: 'Just now' },
  { id: '4', name: 'Infrastructure Monitoring', model: 'prometheus/grafana', runs: 980, rate: 94, status: 'IDLE' as AgentStatus, lastActive: '5m ago' },
  { id: '5', name: 'Kubernetes Operations', model: 'k8s-api', runs: 920, rate: 93, status: 'IDLE' as AgentStatus, lastActive: '5m ago' },
  { id: '6', name: 'Security Compliance', model: 'static-analysis', runs: 870, rate: 95, status: 'IDLE' as AgentStatus, lastActive: '8m ago' },
  { id: '7', name: 'Alert Correlation', model: 'argo/github', runs: 840, rate: 91, status: 'IDLE' as AgentStatus, lastActive: '8m ago' },
  { id: '8', name: 'Root Cause Analysis', model: 'groq/llama-3.1-8b', runs: 790, rate: 89, status: 'IDLE' as AgentStatus, lastActive: '10m ago' },
  { id: '9', name: 'Runbook Recommendation', model: 'groq/llama-3.1-8b', runs: 740, rate: 90, status: 'IDLE' as AgentStatus, lastActive: '10m ago' },
  { id: '10', name: 'Decision Intelligence', model: 'groq/llama-3.1-8b', runs: 690, rate: 88, status: 'IDLE' as AgentStatus, lastActive: '12m ago' },
  { id: '11', name: 'Timeline Generator', model: 'sre-engine', runs: 650, rate: 98, status: 'IDLE' as AgentStatus, lastActive: '12m ago' },
  { id: '12', name: 'Postmortem Generator', model: 'groq/llama-3.1-8b', runs: 600, rate: 92, status: 'IDLE' as AgentStatus, lastActive: '15m ago' },
  { id: '13', name: 'Enkrypt AI Governance', model: 'governance-firewall', runs: 580, rate: 99, status: 'IDLE' as AgentStatus, lastActive: '15m ago' },
  { id: '14', name: 'Notification Agent', model: 'slack/teams/email', runs: 550, rate: 97, status: 'IDLE' as AgentStatus, lastActive: '15m ago' },
  { id: '15', name: 'Learning Store', model: 'qdrant-vector', runs: 500, rate: 96, status: 'IDLE' as AgentStatus, lastActive: '18m ago' },
  { id: '16', name: 'PostgreSQL Persistence', model: 'database', runs: 480, rate: 100, status: 'IDLE' as AgentStatus, lastActive: '18m ago' },
];

const TOPOLOGY_NODES: Node[] = [
  { id: '1', data: { label: 'Incident Intake' }, position: { x: 400, y: 0 } },
  { id: '2', data: { label: 'Learning Retrieval (RAG)' }, position: { x: 400, y: 80 } },
  { id: '3', data: { label: 'Anomaly Detection' }, position: { x: 400, y: 160 } },
  { id: '4', data: { label: 'Infrastructure Monitoring' }, position: { x: 200, y: 260 } },
  { id: '5', data: { label: 'Kubernetes Operations' }, position: { x: 400, y: 260 } },
  { id: '6', data: { label: 'Security Compliance' }, position: { x: 600, y: 260 } },
  { id: '7', data: { label: 'Alert & Deployment Correlation' }, position: { x: 400, y: 340 } },
  { id: '8', data: { label: 'Root Cause Analysis' }, position: { x: 400, y: 420 } },
  { id: '9', data: { label: 'Runbook Recommendation' }, position: { x: 400, y: 500 } },
  { id: '10', data: { label: 'Decision Intelligence' }, position: { x: 400, y: 580 } },
  { id: '11', data: { label: 'Timeline Generator' }, position: { x: 250, y: 660 } },
  { id: '12', data: { label: 'Postmortem Generator' }, position: { x: 550, y: 660 } },
  { id: '13', data: { label: 'Enkrypt AI Governance' }, position: { x: 400, y: 740 } },
  { id: '14', data: { label: 'Notification Agent' }, position: { x: 300, y: 820 } },
  { id: '15', data: { label: 'Learning Store' }, position: { x: 500, y: 820 } },
  { id: '16', data: { label: 'PostgreSQL Persistence' }, position: { x: 400, y: 900 } },
];

const TOPOLOGY_EDGES: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
  { id: 'e3-5', source: '3', target: '5', animated: true },
  { id: 'e3-6', source: '3', target: '6', animated: true },
  { id: 'e4-7', source: '4', target: '7' },
  { id: 'e5-7', source: '5', target: '7' },
  { id: 'e6-7', source: '6', target: '7' },
  { id: 'e7-8', source: '7', target: '8', animated: true },
  { id: 'e8-9', source: '8', target: '9', animated: true },
  { id: 'e9-10', source: '9', target: '10', animated: true },
  { id: 'e10-11', source: '10', target: '11' },
  { id: 'e10-12', source: '10', target: '12' },
  { id: 'e11-13', source: '11', target: '13' },
  { id: 'e12-13', source: '12', target: '13' },
  { id: 'e13-14', source: '13', target: '14', animated: true },
  { id: 'e13-15', source: '13', target: '15', animated: true },
  { id: 'e13-16', source: '13', target: '16' },
];

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

export function AgentsPage() {
  const totalAgents = PIPELINE_STAGES.length;
  const activeAgents = PIPELINE_STAGES.filter((a) => a.status === 'BUSY').length;
  const avgRate = Math.round(PIPELINE_STAGES.reduce((sum, a) => sum + a.rate, 0) / totalAgents);
  const totalRuns = PIPELINE_STAGES.reduce((sum, a) => sum + a.runs, 0);

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agent Pipeline Orchestration</h1>
          <p className="text-sm text-muted-foreground">
            16-stage pipeline: Incident Intake → Anomaly Detection → Decision Intelligence → Governance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5 text-xs px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
            {totalAgents - activeAgents} Online
          </Badge>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs cursor-pointer h-8">
            <Play className="w-3 h-3" />
            Run Pipeline
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="flex flex-wrap gap-3">
        <MetricBadge icon={Bot} label="Total Agents" value={totalAgents} color="#2563eb" />
        <MetricBadge icon={Activity} label="Active Now" value={activeAgents} color="#22c55e" />
        <MetricBadge icon={CheckCircle} label="Avg Success" value={`${avgRate}%`} color="#8b5cf6" />
        <MetricBadge icon={Clock} label="Total Executions" value={totalRuns.toLocaleString()} color="#f59e0b" />
        <MetricBadge icon={Cpu} label="Models" value="8" color="#06b6d4" />
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {PIPELINE_STAGES.map((stage, i) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02, duration: 0.3 }}
          >
            <AgentCard
              name={stage.name}
              status={stage.status}
              model={stage.model}
              runsCount={stage.runs}
              successRate={stage.rate}
              lastActive={stage.lastActive}
            />
          </motion.div>
        ))}
      </div>

      {/* Pipeline Topology Graph */}
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
          <AgentGraph nodes={TOPOLOGY_NODES} edges={TOPOLOGY_EDGES} />
        </div>
      </div>
    </motion.div>
  );
}

export default AgentsPage;
