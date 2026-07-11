import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Brain,
  Activity,
  Clock,
  Cpu,
  MemoryStick,
  Gauge,
  AlertTriangle,
  Target,
  ShieldCheck,
  UserCheck,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type {
  WarRoomIncident,
  WarRoomTimelineEvent,
  AgentProgress,
  LogEntry,
  WarRoomMetrics,
} from '@/features/dashboard/types';

interface IncidentWarRoomProps {
  incident: WarRoomIncident;
  onClose: () => void;
}

function severityColor(severity: WarRoomIncident['severity']) {
  switch (severity) {
    case 'critical': return 'bg-red-600 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-yellow-500 text-black';
    case 'low': return 'bg-green-500 text-white';
  }
}

function timelineDotColor(type: WarRoomTimelineEvent['type']) {
  switch (type) {
    case 'alert': return 'bg-red-500';
    case 'agent': return 'bg-blue-500';
    case 'decision': return 'bg-purple-500';
    case 'action': return 'bg-amber-500';
    case 'notification': return 'bg-sky-500';
    case 'resolution': return 'bg-green-500';
  }
}

function logLevelColor(level: LogEntry['level']) {
  switch (level) {
    case 'INFO': return 'text-blue-400';
    case 'SUCCESS': return 'text-green-400';
    case 'WARNING': return 'text-yellow-400';
    case 'ERROR': return 'text-red-400';
  }
}

function statusBadgeClass(status: AgentProgress['status']) {
  switch (status) {
    case 'pending': return 'border-dashed text-muted-foreground';
    case 'running': return 'border-blue-500 text-blue-400 animate-pulse';
    case 'completed': return 'bg-green-500/20 text-green-400 border-green-500';
    case 'failed': return 'bg-red-500/20 text-red-400 border-red-500';
  }
}

function CircularGauge({ value, label, icon: Icon, color }: { value: number; label: string; icon: React.ElementType; color: string }) {
  const radius = 28;
  const stroke = 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-4 flex flex-col items-center gap-2">
        <div className="relative flex items-center justify-center">
          <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
            <circle
              stroke="hsl(var(--muted))"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke={color}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <span className="absolute text-xs font-mono font-bold">{Math.round(value)}%</span>
        </div>
        <Icon size={14} className="text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{label}</span>
      </CardContent>
    </Card>
  );
}

function TrustGauge({ score }: { score: number }) {
  const radius = 48;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="hsl(var(--muted))"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute text-lg font-mono font-bold">{score}</span>
      </div>
      <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Trust Score</span>
    </div>
  );
}

function IncidentTimeline({ events }: { events: WarRoomTimelineEvent[] }) {
  return (
    <Card className="bg-card border-border/50 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock size={14} className="text-muted-foreground" />
          Incident Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-0">
          {events.map((event, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative pl-6 pb-4 last:pb-0"
            >
              {i < events.length - 1 && (
                <div className="absolute left-[7px] top-3 bottom-0 w-px bg-border" />
              )}
              <div className={cn('absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-background', timelineDotColor(event.type))} />
              <div className="text-[11px] text-muted-foreground font-mono">{event.time}</div>
              <div className="text-sm font-medium">{event.title}</div>
              <div className="text-xs text-muted-foreground">{event.description}</div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AIReasoningPanel({ rootCause, confidence, aiReasoning }: { rootCause: string; confidence: number; aiReasoning: string }) {
  return (
    <Card className="bg-card border-border/50 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain size={14} className="text-muted-foreground" />
          AI Reasoning
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Root Cause</div>
          <div className="text-sm font-medium">{rootCause}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Confidence</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  confidence >= 80 ? 'bg-green-500' : confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                )}
              />
            </div>
            <span className="text-xs font-mono font-bold">{confidence}%</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">AI Analysis</div>
          <div className="text-xs leading-relaxed bg-muted/50 rounded-md p-3 text-muted-foreground border border-border/50">
            {aiReasoning}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentExecutionProgress({ agents }: { agents: AgentProgress[] }) {
  return (
    <Card className="bg-card border-border/50 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity size={14} className="text-muted-foreground" />
          Agent Execution Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{agent.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{agent.model}</span>
              </div>
              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', statusBadgeClass(agent.status))}>
                {agent.status === 'running' && <Loader2 size={10} className="mr-1 animate-spin" />}
                {agent.status === 'completed' && <CheckCircle size={10} className="mr-1" />}
                {agent.status === 'failed' && <XCircle size={10} className="mr-1" />}
                {agent.status}
              </Badge>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${agent.progress}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className={cn(
                  'h-full rounded-full',
                  agent.status === 'completed' && 'bg-green-500',
                  agent.status === 'running' && 'bg-blue-500',
                  agent.status === 'failed' && 'bg-red-500',
                  agent.status === 'pending' && 'bg-muted-foreground/30',
                )}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{agent.time}</span>
              <span>Confidence: {agent.confidence}%</span>
            </div>
            <div className="text-[11px] text-muted-foreground bg-muted/30 rounded px-2 py-1">{agent.task}</div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

function LiveLogs({ logs }: { logs: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <Card className="bg-card border-border/50 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity size={14} className="text-muted-foreground" />
          Live Logs
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[180px]">
          <div className="space-y-0.5 font-mono text-[11px] leading-relaxed">
            {logs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex gap-2"
              >
                <span className="text-muted-foreground shrink-0">{log.time}</span>
                <span className={cn('shrink-0 font-semibold', logLevelColor(log.level))}>
                  [{log.level}]
                </span>
                <span className="text-foreground/80">{log.message}</span>
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function MetricsPanel({ metrics }: { metrics: WarRoomMetrics }) {
  return (
    <Card className="bg-card border-border/50 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gauge size={14} className="text-muted-foreground" />
          Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-5 gap-2">
          <CircularGauge value={metrics.cpu} label="CPU" icon={Cpu} color="hsl(var(--chart-1))" />
          <CircularGauge value={metrics.memory} label="Memory" icon={MemoryStick} color="hsl(var(--chart-2))" />
          <CircularGauge value={metrics.latency} label="Latency" icon={Clock} color="hsl(var(--chart-3))" />
          <CircularGauge value={metrics.errorRate} label="Error Rate" icon={AlertTriangle} color="hsl(var(--chart-5))" />
          <CircularGauge value={metrics.throughput} label="Throughput" icon={Target} color="hsl(var(--chart-4))" />
        </div>
      </CardContent>
    </Card>
  );
}

function RunbookAndTrust({ suggestedRunbook, enkryptTrustScore }: { suggestedRunbook: string; enkryptTrustScore: number }) {
  return (
    <Card className="bg-card border-border/50 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldCheck size={14} className="text-muted-foreground" />
          Runbook & Trust
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div>
          <div className="text-xs text-muted-foreground mb-2">Suggested Runbook</div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate">{suggestedRunbook}</span>
            <Button size="sm" variant="default" className="shrink-0 gap-1">
              <Play size={12} />
              Execute
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <TrustGauge score={enkryptTrustScore} />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <UserCheck size={12} />
            Human Approval Required
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="default" className="flex-1 gap-1 bg-green-600 hover:bg-green-700">
              <CheckCircle size={12} />
              Approve
            </Button>
            <Button size="sm" variant="destructive" className="flex-1 gap-1">
              <XCircle size={12} />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function IncidentWarRoom({ incident, onClose }: IncidentWarRoomProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Active Incident Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-900/80 via-red-800/60 to-red-900/80 border border-red-500/30 p-5"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(0_72%_51%/0.15),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 animate-pulse pointer-events-none" style={{ boxShadow: 'inset 0 0 40px hsl(0 72% 51% / 0.1)' }} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="animate-pulse text-xs gap-1">
                <span className="w-2 h-2 rounded-full bg-destructive-foreground inline-block animate-pulse" />
                ACTIVE INCIDENT
              </Badge>
              <Badge variant="outline" className={cn('text-xs border-0', severityColor(incident.severity))}>
                {incident.severity.toUpperCase()}
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-white">{incident.title}</h2>
            <div className="flex items-center gap-2 text-xs text-red-200/80">
              <Badge variant="outline" className="border-red-400/30 text-red-200/80 text-[10px]">{incident.service}</Badge>
              <Badge variant="outline" className="border-red-400/30 text-red-200/80 text-[10px]">{incident.environment}</Badge>
              <span>Detected: {incident.detectedAt}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 text-red-200 hover:text-white hover:bg-red-800/50"
          >
            <X size={18} />
          </Button>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Row 1 */}
        <IncidentTimeline events={incident.timeline} />
        <AIReasoningPanel
          rootCause={incident.rootCause}
          confidence={incident.confidence}
          aiReasoning={incident.aiReasoning}
        />

        {/* Row 2 */}
        <AgentExecutionProgress agents={incident.agentProgress} />
        <LiveLogs logs={incident.logs} />

        {/* Row 3 */}
        <MetricsPanel metrics={incident.metrics} />
        <RunbookAndTrust
          suggestedRunbook={incident.suggestedRunbook}
          enkryptTrustScore={incident.enkryptTrustScore}
        />
      </div>
    </motion.div>
  );
}

export default IncidentWarRoom;
