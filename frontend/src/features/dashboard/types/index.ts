export interface DashboardStats {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  averageResolutionTimeMs: number;
  averageAiConfidence: number;
  incidentsToday: number;
  incidentsThisWeek: number;
  incidentsThisMonth: number;
}

export interface IncidentTrendItem {
  day: string;
  count: number;
}

export interface SeverityStatsItem {
  severity: string;
  priority: string;
  count: number;
}

export interface ServiceStatsItem {
  service: string;
  count: number;
}

export interface AgentStatusItem {
  id: string;
  name: string;
  status: 'IDLE' | 'BUSY' | 'OFFLINE';
  health: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  latencyMs: number;
  tokenUsage: number;
  currentTask?: string;
  lastActive: string;
  model: string;
}

export interface SystemHealthNode {
  name: string;
  status: 'OK' | 'DEGRADED' | 'ERROR';
  usagePercentage?: number;
  metrics?: Record<string, number>;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'INCIDENT_CREATED' | 'INCIDENT_UPDATED' | 'RUNBOOK_EXECUTED' | 'AI_DECISION' | 'NOTIFICATION_SENT' | 'AGENT_COMPLETED' | 'USER_LOGIN' | 'AUDIT';
  message: string;
  details?: Record<string, any>;
}

export interface DashboardFilters {
  timeRange: '24h' | '7d' | '30d';
  organizationId: string | null;
  environment: 'all' | 'dev' | 'staging' | 'production';
  service: string | null;
  severity: 'all' | 'low' | 'medium' | 'high' | 'critical';
  assignedTeam: string | null;
}

export interface WarRoomIncident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  service: string;
  environment: string;
  detectedAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  rootCause: string;
  confidence: number;
  timeline: WarRoomTimelineEvent[];
  aiReasoning: string;
  agentProgress: AgentProgress[];
  logs: LogEntry[];
  metrics: WarRoomMetrics;
  suggestedRunbook: string;
  enkryptTrustScore: number;
}

export interface WarRoomTimelineEvent {
  time: string;
  title: string;
  description: string;
  type: 'alert' | 'agent' | 'decision' | 'action' | 'notification' | 'resolution';
}

export interface AgentProgress {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  time: string;
  confidence: number;
  model: string;
  task: string;
}

export interface LogEntry {
  time: string;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
}

export interface WarRoomMetrics {
  cpu: number;
  memory: number;
  latency: number;
  errorRate: number;
  throughput: number;
}

export interface ExecutiveKPI {
  label: string;
  value: string;
  trend: number;
  trendDirection: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
}

export interface HeatmapItem {
  service: string;
  health: number;
  status: 'OK' | 'DEGRADED' | 'ERROR';
  latency: number;
  errorRate: number;
}

export interface AITimelineEvent {
  time: string;
  title: string;
  agent: string;
  icon: string;
  status: 'completed' | 'running' | 'pending' | 'failed';
}

export interface TopologyNode {
  id: string;
  type: string;
  label: string;
  status: 'OK' | 'DEGRADED' | 'ERROR';
  icon: string;
}
