export interface RequestContext {
  organizationId: string;
  userId: string;
  traceId: string;
  requestId: string;
  userRole?: string;
}
