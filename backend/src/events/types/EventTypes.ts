export interface IncidentCreatedPayload {
  incidentId: string;
  service: string;
  environment: string;
  title: string;
  severity: string;
  status: string;
}

export interface IncidentUpdatedPayload {
  incidentId: string;
  changes: Record<string, unknown>;
}

export interface IncidentStatusChangedPayload {
  incidentId: string;
  oldStatus: string | null;
  newStatus: string;
  reason?: string;
}

export interface IncidentAssignedPayload {
  incidentId: string;
  assigneeId: string;
  assigneeName: string;
  assignedBy: string;
}

export interface IncidentResolvedPayload {
  incidentId: string;
  resolutionId: string;
  resolvedBy: string;
  rootCause: string;
}

export interface IncidentClosedPayload {
  incidentId: string;
  closedBy: string;
}

export interface IncidentDeletedPayload {
  incidentId: string;
  deletedBy: string;
}

export interface IncidentAnalysisCompletedPayload {
  incidentId: string;
  confidence: number;
  isAnomaly: boolean;
  rootCause?: string;
}

export interface TimelineEventCreatedPayload {
  incidentId: string;
  action: string;
  actor: string;
  oldValue?: string;
  newValue?: string;
}

export interface NoteCreatedPayload {
  incidentId: string;
  noteId: string;
  author: string;
}

export interface NoteUpdatedPayload {
  incidentId: string;
  noteId: string;
  editor: string;
}

export interface NoteDeletedPayload {
  incidentId: string;
  noteId: string;
  deletedBy: string;
}

export interface TelemetryReceivedPayload {
  service: string;
  environment: string;
  logCount: number;
}

export interface EmbeddingGeneratedPayload {
  incidentId: string;
  dimensions: number;
}

export interface SimilaritySearchCompletedPayload {
  incidentId: string;
  matchCount: number;
}

export interface AnomalyDetectedPayload {
  incidentId: string;
  isAnomaly: boolean;
  score: number;
}

export interface RunbookTriggeredPayload {
  incidentId: string;
  runbookId: string;
  triggeredBy: string;
}

export interface NotificationRequestedPayload {
  target: string;
  message: string;
  urgency: 'LOW' | 'HIGH' | 'CRITICAL';
}

export interface AuditLogCreatedPayload {
  incidentId: string;
  action: string;
  userId: string;
  ipAddress?: string;
}

export interface HealthCheckFailedPayload {
  service: string;
  reason: string;
}

export interface JobCompletedPayload {
  jobId: string;
  jobName: string;
  durationMs: number;
}

export interface RunbookMatchedPayload {
  incidentId: string;
  runbookId: string;
  policyDetails: string;
}

export interface ApprovalRequestedPayload {
  incidentId: string;
  runbookId: string;
  executionId: string;
  approvalType: string;
}

export interface ApprovalGrantedPayload {
  incidentId: string;
  runbookId: string;
  executionId: string;
  approvedBy: string;
}

export interface ApprovalRejectedPayload {
  incidentId: string;
  runbookId: string;
  executionId: string;
  rejectedBy: string;
  reason?: string;
}

export interface RunbookExecutionStartedPayload {
  incidentId: string;
  runbookId: string;
  executionId: string;
}

export interface RunbookStepStartedPayload {
  executionId: string;
  stepIndex: number;
  stepName: string;
  stepType: string;
}

export interface RunbookStepCompletedPayload {
  executionId: string;
  stepIndex: number;
  stepName: string;
  durationMs: number;
  output?: string;
}

export interface StepRetryingPayload {
  executionId: string;
  stepIndex: number;
  attempt: number;
  error: string;
}

export interface StepFailedPayload {
  executionId: string;
  stepIndex: number;
  error: string;
}

export interface RunbookExecutionCompletedPayload {
  incidentId: string;
  runbookId: string;
  executionId: string;
  durationMs: number;
}

export interface RunbookExecutionFailedPayload {
  incidentId: string;
  runbookId: string;
  executionId: string;
  error: string;
  durationMs: number;
}

export interface RollbackStartedPayload {
  incidentId: string;
  runbookId: string;
  executionId: string;
}

export interface RollbackCompletedPayload {
  incidentId: string;
  runbookId: string;
  executionId: string;
}

export interface RollbackFailedPayload {
  incidentId: string;
  runbookId: string;
  executionId: string;
  error: string;
}

export interface ExecutionTimedOutPayload {
  executionId: string;
  timeoutSeconds: number;
}

export interface ExecutionCancelledPayload {
  executionId: string;
  cancelledBy: string;
}

// ── Learning & Continuous Improvement Events ──────────────────────────────

export interface FeedbackSubmittedPayload {
  incidentId: string;
  decisionId?: string;
  engineer: string;
  signalType: string;
  wasCorrect?: boolean;
}

export interface LearningStartedPayload {
  incidentId: string;
  sessionId: string;
}

export interface KnowledgeUpdatedPayload {
  incidentId: string;
  knowledgeUpdates: number;
}

export interface PromptImprovedPayload {
  promptName: string;
  newVersion: number;
}

export interface RecommendationImprovedPayload {
  incidentId: string;
  decisionId: string;
}

export interface LearningCompletedPayload {
  incidentId: string;
  sessionId: string;
  phasesCompleted: string[];
  outcomeScore?: number;
  knowledgeUpdates: number;
  promptVersionBump: boolean;
}
