import { DecisionContext } from '../../types';

export class ChangeImpactAnalyzer {
  public analyze(context: DecisionContext): { probability: number; reason: string; evidence: string[] } {
    const service = context.incident.service;
    const deployments = context.deploymentHistory || [];
    const events = context.alerts || [];

    let probability = 0.1; // Baseline
    const evidence: string[] = [];
    let reason = 'No recent deployment found for this service.';

    // Look for matching service deployment
    const matchingDeployment = deployments.find(
      (d) =>
        d.name.toLowerCase().includes(service.toLowerCase()) || service.toLowerCase().includes(d.name.toLowerCase())
    );

    if (matchingDeployment) {
      if (matchingDeployment.restartedAt) {
        const restartTime = new Date(matchingDeployment.restartedAt).getTime();
        const incidentTime = new Date(context.incident.createdAt).getTime();
        const diffMs = Math.abs(incidentTime - restartTime);

        if (diffMs < 1800000) {
          // 30 minutes
          probability = 0.85;
          reason = `High correlation detected: Service ${service} was redeployed within 30 minutes of incident creation.`;
          evidence.push(`Deployment ${matchingDeployment.name} restarted at ${matchingDeployment.restartedAt}`);
        } else if (diffMs < 7200000) {
          // 2 hours
          probability = 0.55;
          reason = `Moderate correlation detected: Service ${service} was redeployed within 2 hours of incident creation.`;
          evidence.push(`Deployment ${matchingDeployment.name} restarted at ${matchingDeployment.restartedAt}`);
        }
      }
    }

    // Check Kubernetes deployment failures in alerts
    const deployFailures = events.filter(
      (e) => e.message.toLowerCase().includes('fail') || e.message.toLowerCase().includes('backoff')
    );
    if (deployFailures.length > 0) {
      probability = Math.min(0.95, probability + 0.15);
      reason = `Pod startup/pull errors detected on cluster: ${reason}`;
      for (const f of deployFailures.slice(0, 2)) {
        evidence.push(`K8s Alert: ${f.reason} - ${f.message}`);
      }
    }

    return {
      probability,
      reason,
      evidence,
    };
  }
}

export const changeImpactAnalyzer = new ChangeImpactAnalyzer();
export default changeImpactAnalyzer;
