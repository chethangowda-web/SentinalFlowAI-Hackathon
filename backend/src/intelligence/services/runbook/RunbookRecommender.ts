import { runbookRepository } from '../../../database/repositories/RunbookRepository';
import { DecisionContext, RunbookRecommendation, RiskLevel } from '../../types';

export class RunbookRecommender {
  public async recommend(context: DecisionContext, limit: number = 3): Promise<RunbookRecommendation[]> {
    const runbooks = await runbookRepository.listRunbooks();
    const service = context.incident.service;
    const severity = context.incident.severity;

    // Query historical executions
    const executions = await runbookRepository.listExecutions(1000, 0);

    const scoredRecommendations: RunbookRecommendation[] = [];

    for (const rb of runbooks) {
      let score = 50.0; // Baseline score
      let reasoning = 'General runbook available in workspace.';

      // Match service
      const isServiceMatch = rb.service.toLowerCase() === service.toLowerCase();
      if (isServiceMatch) {
        score += 30;
        reasoning = `Highly relevant: Designed specifically for service ${rb.service}.`;
      }

      // Match severity
      if (rb.severity.toLowerCase() === severity.toLowerCase()) {
        score += 10;
      }

      // Check historical success rate
      const pastExecs = executions.filter((e) => e.runbookId === rb.id);
      if (pastExecs.length > 0) {
        const completed = pastExecs.filter((e) => e.status === 'COMPLETED').length;
        const successRate = completed / pastExecs.length;
        score += successRate * 10.0; // Add up to 10 points for success
        reasoning += ` Historically successful resolving ${Math.round(successRate * 100)}% of runs.`;
      } else {
        score += 5; // Slight boost for new runbooks
      }

      // Risk score deduction
      const riskLevel: RiskLevel = rb.approvalRequired ? 'HIGH' : 'LOW';
      if (riskLevel === 'HIGH') {
        score -= 10; // Deduct for high risk requiring approval
      }

      const recTime = rb.timeoutSeconds ? Math.round(rb.timeoutSeconds / 60) : 10;

      scoredRecommendations.push({
        runbookId: rb.id,
        name: rb.name,
        score: Math.min(100, Math.max(0, score)),
        reasoning,
        estimatedRecoveryTimeMinutes: recTime,
        riskLevel,
      });
    }

    // Sort descending by score
    return scoredRecommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

export const runbookRecommender = new RunbookRecommender();
export default runbookRecommender;
