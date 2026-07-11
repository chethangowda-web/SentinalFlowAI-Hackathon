import { IncidentStatus, TimelineEventType } from '../types/status';

export interface IncidentTimelineEvent {
  id: string;
  incidentId: string;
  timestamp: Date;
  actor: string;
  action: TimelineEventType;
  previousStatus: IncidentStatus | null;
  newStatus: IncidentStatus | null;
  oldValue: string | null;
  newValue: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
}

export interface IncidentAssignment {
  id: string; // UUID
  incidentId: string; // UUID
  assignedEngineerId: string;
  assignedEngineerName: string;
  assignedBy: string;
  assignedAt: Date;
}

export interface IncidentResolution {
  id: string; // UUID
  incidentId: string; // UUID
  summary: string;
  rootCause: string;
  correctiveActions: string;
  preventiveActions: string;
  resolvedBy: string;
  resolvedAt: Date;
}
