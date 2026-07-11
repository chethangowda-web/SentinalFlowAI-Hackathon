export interface Incident {
  incidentId: string; // UUID primary key
  service: string;
  application: string;
  environment: 'dev' | 'staging' | 'production';
  severity: string;
  priority: string;
  status: string;
  title: string;
  summary: string;
  description: string;
  rawLogs: string;
  confidenceScore: number;
  rootCause: string;
  aiReport: Record<string, unknown> | null;
  recommendations: Record<string, unknown> | null;
  similarIncidents: Record<string, unknown>[] | null;
  metadata: Record<string, unknown> | null;
  assignedEngineer: string | null;
  resolution: string | null;
  timeline: Record<string, unknown>[] | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
}
