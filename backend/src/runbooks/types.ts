export enum RunbookExecutionStatus {
  PENDING = 'PENDING',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  RUNNING = 'RUNNING',
  ROLLING_BACK = 'ROLLING_BACK',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum StepExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  ROLLBACK = 'ROLLBACK',
}

export interface RunbookStep {
  name: string;
  type: string; // 'RestartDeployment', 'ScaleDeployment', 'DeletePod', 'CordonNode', 'Command', 'Webhook', 'Slack', 'Teams', 'Delay', 'Condition'
  arguments: Record<string, any>;
}

export interface Runbook {
  id: string;
  name: string;
  description?: string;
  service: string;
  triggerEvent: string;
  severity: string;
  enabled: boolean;
  approvalRequired: boolean;
  timeoutSeconds: number;
  retryLimit: number;
  executionSteps: RunbookStep[];
  rollbackSteps: RunbookStep[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RunbookExecutionContext {
  incidentId: string;
  runbookId: string;
  executionId: string;
  traceId?: string;
  requestId?: string;
  aiAnalysis?: any;
  service: string;
  environment: string;
  severity: string;
  kubernetesMetadata?: any;
  prometheusMetrics?: any;
  historicalIncidents?: any[];
}

export interface RunbookExecution {
  id: string;
  incidentId: string;
  runbookId: string;
  status: RunbookExecutionStatus;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  traceId?: string;
  requestId?: string;
  triggeredBy?: string;
}

export interface RunbookExecutionStep {
  id: string;
  executionId: string;
  stepIndex: number;
  name: string;
  type: string;
  status: StepExecutionStatus;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  output?: string;
  error?: string;
  retryCount: number;
}
