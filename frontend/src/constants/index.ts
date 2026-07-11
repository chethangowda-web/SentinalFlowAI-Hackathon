export const APP_NAME = 'SentinelFlow';

export const SEVERITY_LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const;
export type Severity = (typeof SEVERITY_LEVELS)[number];

export const SEVERITY_COLORS: Record<Severity, string> = {
  CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/20',
  HIGH:     'bg-orange-500/15 text-orange-400 border-orange-500/20',
  MEDIUM:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  LOW:      'bg-blue-500/15 text-blue-400 border-blue-500/20',
  INFO:     'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

export const INCIDENT_STATUSES = ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const STATUS_COLORS: Record<IncidentStatus, string> = {
  OPEN:          'bg-red-500/15 text-red-400',
  ACKNOWLEDGED:  'bg-yellow-500/15 text-yellow-400',
  INVESTIGATING: 'bg-blue-500/15 text-blue-400',
  RESOLVED:      'bg-green-500/15 text-green-400',
  CLOSED:        'bg-slate-500/15 text-slate-400',
};

export const AGENT_STATES = [
  'CREATED', 'INITIALIZING', 'READY', 'RUNNING',
  'PAUSED', 'RESUMING', 'STOPPING', 'STOPPED',
  'FAILED', 'RECOVERING'
] as const;
export type AgentState = (typeof AGENT_STATES)[number];

export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];
