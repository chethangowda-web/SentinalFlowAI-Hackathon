export interface RenderedTemplate {
  subject: string;
  body: string;
  version: string;
}

export class NotificationTemplateEngine {
  private static version = 'V1';

  private static templates: Record<string, { subject: string; body: string }> = {
    IncidentCreated: {
      subject: '🚨 SentinelFlow: Incident Created - {incidentId}',
      body: 'A new incident {incidentId} has been created in {environment} for service {service}.\nSeverity: {severity}\nTitle: {title}\nStatus: {status}\nTime: {time}'
    },
    IncidentAssigned: {
      subject: '👤 SentinelFlow: Incident Assigned - {incidentId}',
      body: 'Incident {incidentId} has been assigned to {assigneeName} (ID: {assigneeId}) by {assignedBy}.\nTime: {time}'
    },
    IncidentEscalated: {
      subject: '⚡ SentinelFlow: Incident ESCALATED - {incidentId} (Level {level})',
      body: 'Incident {incidentId} in {environment} has been escalated to Level {level} (Max: {maxLevel}) due to no response.\nTime: {time}'
    },
    IncidentResolved: {
      subject: '✅ SentinelFlow: Incident Resolved - {incidentId}',
      body: 'Incident {incidentId} has been resolved by {resolvedBy}.\nRoot Cause: {rootCause}\nResolution ID: {resolutionId}\nTime: {time}'
    },
    IncidentClosed: {
      subject: '🔒 SentinelFlow: Incident Closed - {incidentId}',
      body: 'Incident {incidentId} has been closed by {closedBy}.\nTime: {time}'
    },
    CriticalAlert: {
      subject: '🔥 SentinelFlow: CRITICAL ALERT - {incidentId}',
      body: 'Critical threshold breached for incident {incidentId}.\nDetails: {details}\nTime: {time}'
    },
    InfrastructureFailure: {
      subject: '🔌 SentinelFlow: Infrastructure Failure',
      body: 'Infrastructure components failed on service {service}.\nReason: {reason}\nTime: {time}'
    },
    HealthCheckFailed: {
      subject: '💔 SentinelFlow: Health Check Failed - {service}',
      body: 'Health check failed for service {service}.\nReason: {reason}\nTime: {time}'
    },
    JobFailure: {
      subject: '⚠️ SentinelFlow: Job Failure - {jobName}',
      body: 'Job {jobId} ({jobName}) failed to run successfully.\nDuration: {durationMs}ms\nError: {error}\nTime: {time}'
    },
    DeploymentFailure: {
      subject: '❌ SentinelFlow: Deployment Failure - {service}',
      body: 'Deployment failed for service {service} in {environment}.\nDetails: {details}\nTime: {time}'
    }
  };

  public static render(templateName: string, variables: Record<string, any>): RenderedTemplate {
    const template = this.templates[templateName] || {
      subject: 'SentinelFlow Alert: {eventType}',
      body: 'An event of type {eventType} occurred.\nPayload: {payload}'
    };

    let subject = template.subject;
    let body = template.body;

    const allVars = {
      ...variables,
      time: new Date().toISOString(),
      eventType: templateName,
      payload: JSON.stringify(variables)
    };

    for (const [key, value] of Object.entries(allVars)) {
      const regex = new RegExp(`{${key}}`, 'g');
      subject = subject.replace(regex, String(value ?? ''));
      body = body.replace(regex, String(value ?? ''));
    }

    return {
      subject,
      body,
      version: this.version
    };
  }
}
