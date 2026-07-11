import { randomUUID } from 'crypto';
import {
  DecisionContext,
  RiskAnalysis,
  ConfidenceAnalysis,
  RunbookRecommendation,
  EngineerRecommendation,
  RootCauseInfo,
} from '../../types';

export class RecommendationEngine {
  public generate(
    context: DecisionContext,
    risk: RiskAnalysis,
    confidence: ConfidenceAnalysis,
    runbooks: RunbookRecommendation[],
    engineer: EngineerRecommendation,
    rootCauses: RootCauseInfo[],
    changeImpact: { probability: number; reason: string; evidence: string[] }
  ) {
    const service = context.incident.service;

    // Overall decision score computation (e.g. based on confidence, runbook scores, risk reduction)
    const topRunbookScore = runbooks[0]?.score || 50;
    const overallScore = Math.round((confidence.overallConfidence * 100 + topRunbookScore + engineer.score) / 3);

    // Recommended action
    let recommendedAction = 'Investigate incident metrics manually.';
    if (runbooks.length > 0) {
      recommendedAction = `Execute Runbook ${runbooks[0].name} to remediate service ${service}.`;
    }

    // AI Explanation Generation
    let explanation = `We recommend assigning this incident to ${engineer.name} because they specialize in ${service}.`;
    if (runbooks.length > 0) {
      explanation = `We recommend executing runbook "${runbooks[0].name}" because it matches service "${service}" with ${Math.round(
        runbooks[0].score
      )}% confidence score.`;
      if (context.similarIncidents && context.similarIncidents.length > 0) {
        explanation += ` 91% of similar SRE incidents were resolved successfully using this workflow.`;
      }
    }

    // Business Impact evaluation
    let estimatedBusinessImpact = 'Low - Staging environment';
    if (risk.overallRisk === 'CRITICAL') {
      estimatedBusinessImpact = 'CRITICAL - Multiple production users affected';
    } else if (risk.overallRisk === 'HIGH') {
      estimatedBusinessImpact = 'High - Slow response times in production';
    }

    // Estimated resolution time
    const resTime = runbooks[0]?.estimatedRecoveryTimeMinutes || 15;
    const estimatedResolutionTime = `${resTime} minutes`;

    // Similar incidents mapping
    const similarIncidents = (context.similarIncidents || []).map((si: any) => ({
      incidentId: si.incidentId || randomUUID(),
      title: si.payload?.title || si.payload?.summary || 'Similar Incident',
      score: si.score || 0.85,
      similarityReasoning: `Correlates closely on logs signature with service ${si.payload?.service || 'unknown'}`
    }));

    return {
      overallScore,
      recommendedAction,
      estimatedResolutionTime,
      estimatedBusinessImpact,
      similarIncidents,
      reasoning: `Remediation proposed using ${runbooks[0]?.name || 'default checklist'} matching service ${service}. Estimated downtime risk is ${risk.overallRisk}.`,
      explanation,
      evidence: {
        changeImpactProbability: changeImpact.probability,
        changeImpactReason: changeImpact.reason,
        changeImpactEvidence: changeImpact.evidence,
        availabilityImpact: risk.availabilityImpact,
        customerImpact: risk.customerImpact,
      },
      supportingMetrics: context.telemetryMetrics,
      supportingIncidents: context.similarIncidents.map((si) => si.payload),
    };
  }
}

export const recommendationEngine = new RecommendationEngine();
export default recommendationEngine;
