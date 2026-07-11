export interface CorrelationContext {
  requestId?: string;
  traceId?: string;
  correlationId: string;
  userId?: string;
  workflowId?: string;
  tenantId?: string;
  incidentId?: string;
}
