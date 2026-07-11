import { LoggerService } from '../../mastra/services/loggerService';

export interface TimelineEventItem {
  timestamp: string;
  actor: string;
  action: string;
  notes: string;
  metadata: Record<string, any>;
}

export class TimelineGenerator {
  private log = new LoggerService('TimelineGenerator');

  /**
   * Constructs a chronological sequence of SRE events based on the active incident context.
   */
  public generate(context: {
    telemetryLogs?: string;
    metricsSummary?: string;
    kubernetesEvents?: string;
    recentDeployments?: string;
    activeAlerts?: string;
  }): TimelineEventItem[] {
    const timeline: TimelineEventItem[] = [];
    const now = new Date();

    // 1. Process Deployments
    if (context.recentDeployments) {
      const lines = context.recentDeployments.split('\n').filter(l => l.trim().length > 0);
      lines.forEach((line) => {
        const time = new Date(now.getTime() - 1000 * 60 * 60 * 2); // 2 hours ago
        timeline.push({
          timestamp: time.toISOString(),
          actor: 'ArgoCD / Deployer',
          action: 'Deployment Sync Completed',
          notes: line,
          metadata: { step: 'deployment', source: 'git-repo' }
        });
      });
    }

    // 2. Process Alerts
    if (context.activeAlerts) {
      const lines = context.activeAlerts.split('\n').filter(l => l.trim().length > 0);
      lines.forEach((line) => {
        const time = new Date(now.getTime() - 1000 * 60 * 45); // 45 mins ago
        timeline.push({
          timestamp: time.toISOString(),
          actor: 'Prometheus AlertManager',
          action: 'Metric Threshold Exceeded',
          notes: line,
          metadata: { step: 'alert', source: 'prometheus' }
        });
      });
    }

    // 3. Process Kubernetes Events
    if (context.kubernetesEvents) {
      const lines = context.kubernetesEvents.split('\n').filter(l => l.trim().length > 0);
      lines.forEach((line) => {
        const time = new Date(now.getTime() - 1000 * 60 * 30); // 30 mins ago
        timeline.push({
          timestamp: time.toISOString(),
          actor: 'Kubernetes Controller',
          action: 'Pod Status Event',
          notes: line,
          metadata: { step: 'kubernetes', source: 'k8s-cluster' }
        });
      });
    }

    // 4. Process Telemetry Logs
    if (context.telemetryLogs) {
      const lines = context.telemetryLogs.split('\n').filter(l => 
        l.toLowerCase().includes('error') || 
        l.toLowerCase().includes('warn') || 
        l.toLowerCase().includes('fatal') ||
        l.toLowerCase().includes('fail')
      );
      lines.slice(0, 3).forEach((line, index) => {
        const time = new Date(now.getTime() - 1000 * 60 * (15 - index)); // 15 to 13 mins ago
        timeline.push({
          timestamp: time.toISOString(),
          actor: 'Application Log Ingestor',
          action: 'Error Signature Captured',
          notes: line.substring(0, 200).trim(),
          metadata: { step: 'logs', level: 'error' }
        });
      });
    }

    // Fallback events
    if (timeline.length === 0) {
      timeline.push({
        timestamp: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
        actor: 'TelemetryIngestor',
        action: 'Ingestion Baselining Started',
        notes: 'No abnormal signatures or deployment events matched in context window.',
        metadata: { source: 'ingestor' }
      });
    }

    return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}

export const timelineGenerator = new TimelineGenerator();
export default timelineGenerator;
