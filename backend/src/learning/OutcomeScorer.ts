import { LoggerService } from '../mastra/services/loggerService';
import { IncidentOutcomeScore } from './LearningTypes';

const BASELINE_MTTR_MINUTES = 45; // org-wide baseline; can be loaded from config

export class OutcomeScorer {
  private log = new LoggerService('OutcomeScorer');

  /**
   * Score a resolved incident across 6 dimensions, returning a composite 0–100 score.
   */
  score(incident: Record<string, any>, feedback?: Record<string, any>): IncidentOutcomeScore {
    const incidentId = incident.id ?? incident.incidentId;
    this.log.info(`[OutcomeScorer] Scoring outcome for incident ${incidentId}`);

    const resolutionTimeScore   = this.scoreResolutionTime(incident);
    const customerImpactScore   = this.scoreCustomerImpact(incident);
    const businessImpactScore   = this.scoreBusinessImpact(incident);
    const rollbackSuccessScore  = this.scoreRollback(incident);
    const automationSuccessScore= this.scoreAutomation(incident);
    const engineerSatisfScore   = this.scoreEngineerSatisfaction(feedback);

    // Weighted composite (weights sum to 1.0)
    const compositeScore = Math.min(100, Math.max(0,
      resolutionTimeScore    * 0.25 +
      customerImpactScore    * 0.20 +
      businessImpactScore    * 0.15 +
      rollbackSuccessScore   * 0.15 +
      automationSuccessScore * 0.15 +
      engineerSatisfScore    * 0.10
    ));

    this.log.info(`[OutcomeScorer] Incident ${incidentId} composite score: ${compositeScore.toFixed(1)}`);

    return {
      incidentId,
      resolutionTimeScore,
      customerImpactScore,
      businessImpactScore,
      rollbackSuccessScore,
      automationSuccessScore,
      engineerSatisfactionScore: engineerSatisfScore,
      compositeScore,
      scoredAt: new Date()
    };
  }

  private scoreResolutionTime(incident: Record<string, any>): number {
    const createdAt  = new Date(incident.createdAt ?? incident.created_at);
    const resolvedAt = new Date(incident.resolvedAt ?? incident.resolved_at ?? Date.now());
    const mttrMinutes = (resolvedAt.getTime() - createdAt.getTime()) / 60000;

    if (isNaN(mttrMinutes)) return 50;
    if (mttrMinutes <= BASELINE_MTTR_MINUTES * 0.5) return 100; // 2× faster than baseline
    if (mttrMinutes <= BASELINE_MTTR_MINUTES)        return 80;
    if (mttrMinutes <= BASELINE_MTTR_MINUTES * 2)    return 55;
    if (mttrMinutes <= BASELINE_MTTR_MINUTES * 4)    return 30;
    return 10;
  }

  private scoreCustomerImpact(incident: Record<string, any>): number {
    const severity = (incident.severity ?? '').toUpperCase();
    const sloBreachMinutes: number = incident.sloBreachMinutes ?? 0;
    const hasCustomerImpact: boolean = incident.hasCustomerImpact ?? (severity === 'CRITICAL' || severity === 'HIGH');

    if (!hasCustomerImpact)              return 95;
    if (sloBreachMinutes === 0)          return 80;
    if (sloBreachMinutes < 5)            return 65;
    if (sloBreachMinutes < 15)           return 45;
    if (sloBreachMinutes < 60)           return 25;
    return 10;
  }

  private scoreBusinessImpact(incident: Record<string, any>): number {
    const estimatedCostUsd: number = incident.estimatedCostUsd ?? incident.businessImpactUsd ?? 0;
    if (estimatedCostUsd === 0)      return 90;
    if (estimatedCostUsd < 1000)     return 75;
    if (estimatedCostUsd < 10000)    return 55;
    if (estimatedCostUsd < 100000)   return 30;
    return 10;
  }

  private scoreRollback(incident: Record<string, any>): number {
    const rollbackNeeded: boolean   = incident.rollbackNeeded  ?? false;
    const rollbackSuccess: boolean  = incident.rollbackSuccess ?? false;
    if (!rollbackNeeded)             return 90; // No rollback needed — good
    if (rollbackSuccess)             return 70; // Rollback worked
    return 20;                                  // Rollback needed but failed
  }

  private scoreAutomation(incident: Record<string, any>): number {
    const automationUsed: boolean    = incident.automationUsed    ?? false;
    const automationSuccess: boolean = incident.automationSuccess ?? false;
    const manualOverride: boolean    = incident.manualOverride    ?? false;

    if (automationUsed && automationSuccess && !manualOverride) return 100;
    if (automationUsed && automationSuccess)                    return 75;
    if (automationUsed && !automationSuccess)                   return 35;
    return 50; // Manual resolution — neutral
  }

  private scoreEngineerSatisfaction(feedback?: Record<string, any>): number {
    const score: number | undefined = feedback?.satisfactionScore;
    if (score === undefined) return 70; // Default neutral if no feedback
    return Math.min(100, Math.max(0, (score / 5) * 100));
  }
}
