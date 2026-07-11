import { DecisionContext, RootCauseInfo } from '../../types';

export class RootCauseEngine {
  public calculate(context: DecisionContext): RootCauseInfo[] {
    const service = context.incident.service;
    const aiRootCause = context.incident.rootCause || '';
    const telemetry = context.telemetryMetrics || {};
    const deployments = context.deploymentHistory || [];

    const rootCauses: RootCauseInfo[] = [];

    // 1. Check AI Root Cause pipeline result
    if (aiRootCause) {
      rootCauses.push({
        cause: aiRootCause,
        score: context.incident.confidenceScore || 0.85,
        evidence: ['AI Incident Analysis Pipeline deduction'],
        category: 'AI Pipeline',
      });
    }

    // 2. Check Kubernetes deployment history
    const matchingDeployment = deployments.find(
      (d) =>
        d.name.toLowerCase().includes(service.toLowerCase()) || service.toLowerCase().includes(d.name.toLowerCase())
    );
    if (matchingDeployment && matchingDeployment.restartedAt) {
      rootCauses.push({
        cause: `Recent deployment modification on service ${service}`,
        score: 0.75,
        evidence: [`Deployment ${matchingDeployment.name} restarted at ${matchingDeployment.restartedAt}`],
        category: 'Infrastructure Change',
      });
    }

    // 3. Check High CPU or Memory Usage in Telemetry
    if (telemetry.cpuUsage && telemetry.cpuUsage > 80) {
      rootCauses.push({
        cause: `Resource saturation: High CPU utilization on ${service}`,
        score: 0.7,
        evidence: [`CPU utilization is currently at ${telemetry.cpuUsage}%`],
        category: 'Resource Saturation',
      });
    }

    // 4. Check HTTP Error rates
    if (telemetry.httpErrorRate && telemetry.httpErrorRate > 1.5) {
      rootCauses.push({
        cause: `Upstream service failure or high error rates on ${service}`,
        score: 0.65,
        evidence: [`HTTP error rate spiked to ${telemetry.httpErrorRate}%`],
        category: 'Upstream Dependency',
      });
    }

    // Default if empty
    if (rootCauses.length === 0) {
      rootCauses.push({
        cause: 'Unknown software regression or transient node failure',
        score: 0.5,
        evidence: ['No deployment restart or high resource usage correlated'],
        category: 'Software Regression',
      });
    }

    // Sort descending by score
    return rootCauses.sort((a, b) => b.score - a.score);
  }
}

export const rootCauseEngine = new RootCauseEngine();
export default rootCauseEngine;
