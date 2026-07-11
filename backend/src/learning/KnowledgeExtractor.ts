import { LoggerService } from '../mastra/services/loggerService';
import { IncidentKnowledgeArtifact } from './LearningTypes';

export class KnowledgeExtractor {
  private log = new LoggerService('KnowledgeExtractor');

  /**
   * Extracts a structured IncidentKnowledgeArtifact from a resolved incident's raw data.
   * In production this would call the LLM with a structured extraction prompt;
   * this implementation derives knowledge deterministically from the incident record.
   */
  async extract(incident: Record<string, any>): Promise<IncidentKnowledgeArtifact> {
    const incidentId = incident.id ?? incident.incidentId;
    this.log.info(`[KnowledgeExtractor] Extracting knowledge from incident ${incidentId}`);

    const timeline  = this.buildTimeline(incident);
    const logSummary = incident.description ?? incident.summary ?? 'No log summary available';
    const metricAnomalies = this.extractMetricAnomalies(incident);
    const resolutionSteps = this.extractResolutionSteps(incident);
    const rootCauseNarrative = incident.rootCause ?? incident.root_cause ?? 'Root cause not determined';

    const artifact: IncidentKnowledgeArtifact = {
      incidentId,
      timeline,
      logSummary,
      metricAnomalies,
      resolutionSteps,
      lessonsLearned:   this.deriveLessonsLearned(incident, metricAnomalies, resolutionSteps),
      bestPractices:    this.deriveBestPractices(incident),
      rootCauseNarrative,
      fixSummary:       incident.fixSummary ?? incident.resolution ?? 'Resolution details not recorded',
      extractedAt:      new Date()
    };

    this.log.info(`[KnowledgeExtractor] Extraction complete for incident ${incidentId}: ${resolutionSteps.length} resolution steps, ${metricAnomalies.length} metric anomalies`);
    return artifact;
  }

  private buildTimeline(incident: Record<string, any>): string[] {
    const events: string[] = [];
    if (incident.createdAt || incident.created_at) {
      events.push(`Incident created: ${incident.createdAt ?? incident.created_at}`);
    }
    if (incident.acknowledgedAt || incident.acknowledged_at) {
      events.push(`Acknowledged: ${incident.acknowledgedAt ?? incident.acknowledged_at}`);
    }
    if (incident.resolvedAt || incident.resolved_at) {
      events.push(`Resolved: ${incident.resolvedAt ?? incident.resolved_at}`);
    }
    if (incident.closedAt || incident.closed_at) {
      events.push(`Closed: ${incident.closedAt ?? incident.closed_at}`);
    }
    // Merge in any explicit timeline events from the incident record
    const extra: string[] = incident.timeline ?? incident.timelineEvents ?? [];
    return [...events, ...extra];
  }

  private extractMetricAnomalies(incident: Record<string, any>): string[] {
    const anomalies: string[] = [];
    const metrics = incident.metrics ?? incident.telemetry ?? {};
    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value === 'number' && value > 0) {
        anomalies.push(`${key}: ${value}`);
      }
    }
    if (incident.severity === 'CRITICAL' || incident.severity === 'HIGH') {
      anomalies.push(`High severity incident: ${incident.severity}`);
    }
    return anomalies;
  }

  private extractResolutionSteps(incident: Record<string, any>): string[] {
    const steps: string[] = [];
    const runbooks: any[] = incident.executedRunbooks ?? incident.runbooks ?? [];
    for (const rb of runbooks) {
      steps.push(`Executed runbook: ${rb.name ?? rb.id ?? 'unknown'}`);
    }
    if (incident.manualActions) {
      steps.push(...(Array.isArray(incident.manualActions) ? incident.manualActions : [incident.manualActions]));
    }
    if (steps.length === 0) {
      steps.push('Manual resolution — no automated runbook recorded');
    }
    return steps;
  }

  private deriveLessonsLearned(
    incident: Record<string, any>,
    anomalies: string[],
    steps: string[]
  ): string[] {
    const lessons: string[] = [];
    if (steps.some(s => s.includes('Manual resolution'))) {
      lessons.push('Consider automating this resolution path with a runbook');
    }
    if (anomalies.length > 3) {
      lessons.push('Multiple concurrent metric anomalies — consider cross-signal correlation alerts');
    }
    if (incident.severity === 'CRITICAL') {
      lessons.push('CRITICAL incident — review alert thresholds and on-call escalation policy');
    }
    return lessons.length > 0 ? lessons : ['No specific lessons identified — review manually'];
  }

  private deriveBestPractices(incident: Record<string, any>): string[] {
    const practices: string[] = [
      'Document root cause in postmortem',
      'Update runbook if resolution steps were manual'
    ];
    if (incident.service) {
      practices.push(`Add service-level SLO dashboard for ${incident.service}`);
    }
    return practices;
  }
}
