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
