export interface IncidentNote {
  id: string; // UUID
  incidentId: string; // UUID
  author: string;
  markdown: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentAudit {
  id: string; // UUID
  incidentId: string; // UUID
  userId: string;
  action: string;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: Date;
}
