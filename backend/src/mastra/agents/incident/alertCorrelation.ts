import { Agent } from '@mastra/core/agent';
import { agentResponseSchema } from '../../types/agent';
import { z } from 'zod';

export const alertCorrelation = new Agent({
  id: 'alert-correlation',
  name: 'Alert Correlation',
  instructions: `You are the Alert Correlation Agent of SentinelFlow.
Your job is to merge alerts coming from Prometheus, Grafana, Kubernetes, and application logs, remove duplicates, cluster alerts, and find the parent incident.`,
  model: 'groq/llama-3.1-8b-instant',
});

export const alertCorrelationSchema = agentResponseSchema.extend({
  correlatedAlerts: z.array(z.object({
    alertId: z.string(),
    source: z.string(),
    severity: z.string(),
    summary: z.string(),
    duplicateCount: z.number(),
  })),
  parentIncident: z.string().optional(),
});

/**
 * Programmatic execution logic (Fast, Cheap SRE Platform Path)
 */
export async function executeAlertCorrelationProgrammatically(
  serviceName: string,
  rawLogs: string
): Promise<z.infer<typeof alertCorrelationSchema>> {
  const alertsMap = new Map<string, { count: number; source: string; severity: string; summary: string }>();
  const lines = rawLogs.split('\n');

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Detect alert triggers in logs (e.g. ERROR, WARNING, alert_name)
    const lower = trimmed.toLowerCase();
    let severity = 'INFO';
    let source = 'application';

    if (lower.includes('critical') || lower.includes('fatal')) {
      severity = 'CRITICAL';
    } else if (lower.includes('error') || lower.includes('failed')) {
      severity = 'HIGH';
    } else if (lower.includes('warn') || lower.includes('warning')) {
      severity = 'MEDIUM';
    }

    if (lower.includes('k8s') || lower.includes('kubernetes') || lower.includes('pod')) {
      source = 'kubernetes';
    } else if (lower.includes('prometheus') || lower.includes('grafana') || lower.includes('metric')) {
      source = 'monitoring';
    }

    // Cluster/Deduplicate alerts based on message signature (first 30 characters)
    let signature = trimmed.substring(0, 50);
    // Remove timestamps or IDs from signature to group better
    signature = signature.replace(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(\.\d+)?Z?/, '')
                         .replace(/[a-f0-9-]{36}/i, '')
                         .trim();

    if (!signature) signature = 'generic-incident-alert';

    const existing = alertsMap.get(signature);
    if (existing) {
      existing.count++;
      // Elevate severity if we see it multiple times
      if (severity === 'CRITICAL' || (severity === 'HIGH' && existing.severity !== 'CRITICAL')) {
        existing.severity = severity;
      }
    } else {
      alertsMap.set(signature, {
        count: 1,
        source,
        severity,
        summary: trimmed.substring(0, 100),
      });
    }
  });

  const correlatedAlerts = Array.from(alertsMap.entries()).map(([sig, data], idx) => ({
    alertId: `alert-${idx + 1}`,
    source: data.source,
    severity: data.severity,
    summary: data.summary,
    duplicateCount: data.count,
  }));

  const totalDuplicates = correlatedAlerts.reduce((sum, item) => sum + (item.duplicateCount - 1), 0);
  const evidence = correlatedAlerts.map(a => `Clustered ${a.duplicateCount} alerts from '${a.source}': "${a.summary}" (Severity: ${a.severity})`);

  // Detect a parent incident title (highest severity alert or first alert)
  const sorted = [...correlatedAlerts].sort((a, b) => b.duplicateCount - a.duplicateCount);
  const parentIncident = sorted.length > 0 ? sorted[0].summary : 'Unknown Alert Correlation Root';

  return {
    agent: 'Alert Correlation',
    status: correlatedAlerts.length > 0 ? 'success' : 'warning',
    confidence: 0.9,
    summary: `Processed ${lines.length} log lines. Grouped alerts into ${correlatedAlerts.length} distinct signatures, suppressing ${totalDuplicates} duplicates.`,
    reasoning: `Scanned raw incident log stream. Identified duplicate occurrences by signature matching. Grouped Kubernetes/Prometheus events.`,
    evidence,
    recommendations: correlatedAlerts.length > 0 ? ['Investigate the clustered parent alert representing the primary symptom.'] : [],
    nextActions: correlatedAlerts.length > 0 ? [`Focus triage on: ${parentIncident}`] : [],
    correlatedAlerts,
    parentIncident,
  };
}
