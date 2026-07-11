import { dbClient, DatabaseClient } from '../../database/client/DatabaseClient';
import { DecisionReport, DecisionFeedback, DecisionLifecycleState } from '../types';
import { DatabaseError } from '../../core/errors/DatabaseError';

export class DecisionRepository {
  private db: DatabaseClient = dbClient;

  public async saveDecision(report: DecisionReport): Promise<DecisionReport> {
    const text = `
      INSERT INTO decision_reports (
        id, incident_id, overall_score, confidence, risk_level, recommended_action,
        recommended_runbooks, recommended_engineer, estimated_resolution_time, estimated_business_impact,
        similar_incidents, possible_root_causes, reasoning, evidence, supporting_metrics,
        supporting_incidents, confidence_breakdown, explanation, approval_recommendation,
        status, outcome, version, decision_model_version, prompt_version, embedding_version,
        created_by_model, model_latency_ms, token_usage, execution_time_ms
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
      ) RETURNING *;
    `;

    const params = [
      report.id,
      report.incidentId,
      report.overallScore,
      report.confidence,
      report.riskLevel,
      report.recommendedAction,
      JSON.stringify(report.recommendedRunbooks),
      JSON.stringify(report.recommendedEngineer),
      report.estimatedResolutionTime,
      report.estimatedBusinessImpact,
      JSON.stringify(report.similarIncidents),
      JSON.stringify(report.possibleRootCauses),
      report.reasoning,
      JSON.stringify(report.evidence),
      JSON.stringify(report.supportingMetrics),
      JSON.stringify(report.supportingIncidents),
      JSON.stringify(report.confidenceBreakdown),
      report.explanation,
      report.approvalRecommendation,
      report.status,
      report.outcome,
      report.version,
      report.decisionModelVersion,
      report.promptVersion,
      report.embeddingVersion,
      report.createdByModel,
      report.modelLatencyMs,
      JSON.stringify(report.tokenUsage),
      report.executionTimeMs,
    ];

    const rows = await this.db.query(text, params);
    if (!rows.length) throw new DatabaseError('Failed to save decision report');
    return this.mapToReport(rows[0]);
  }

  public async updateDecision(id: string, status: DecisionLifecycleState, outcome?: string | null): Promise<DecisionReport> {
    const text = `
      UPDATE decision_reports
      SET status = $1, outcome = COALESCE($2, outcome), version = version + 1, updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;
    const rows = await this.db.query(text, [status, outcome || null, id]);
    if (!rows.length) throw new DatabaseError(`Decision report not found: ${id}`);
    return this.mapToReport(rows[0]);
  }

  public async approveDecision(id: string): Promise<DecisionReport> {
    return this.updateDecision(id, 'APPROVED');
  }

  public async rejectDecision(id: string): Promise<DecisionReport> {
    return this.updateDecision(id, 'OVERRIDDEN', 'Rejected by operator');
  }

  public async executeDecision(id: string, outcome: string): Promise<DecisionReport> {
    return this.updateDecision(id, 'EXECUTED', outcome);
  }

  public async saveFeedback(fb: DecisionFeedback): Promise<DecisionFeedback> {
    const text = `
      INSERT INTO decision_feedback (
        id, decision_id, accepted, rejected, manual_override, actual_root_cause,
        actual_resolution_time_ms, was_recommendation_correct, feedback, engineer
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const params = [
      fb.id,
      fb.decisionId,
      fb.accepted,
      fb.rejected,
      fb.manualOverride,
      fb.actualRootCause,
      fb.actualResolutionTimeMs,
      fb.wasRecommendationCorrect,
      fb.feedback,
      fb.engineer,
    ];
    const rows = await this.db.query(text, params);
    if (!rows.length) throw new DatabaseError('Failed to save decision feedback');
    return this.mapToFeedback(rows[0]);
  }

  public async findById(id: string): Promise<DecisionReport | null> {
    const text = `SELECT * FROM decision_reports WHERE id = $1`;
    const rows = await this.db.query(text, [id]);
    return rows.length ? this.mapToReport(rows[0]) : null;
  }

  public async findByIncidentId(incidentId: string): Promise<DecisionReport | null> {
    const text = `SELECT * FROM decision_reports WHERE incident_id = $1 ORDER BY created_at DESC LIMIT 1`;
    const rows = await this.db.query(text, [incidentId]);
    return rows.length ? this.mapToReport(rows[0]) : null;
  }

  public async listHistory(limit: number = 100, offset: number = 0): Promise<DecisionReport[]> {
    const text = `SELECT * FROM decision_reports ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
    const rows = await this.db.query(text, [limit, offset]);
    return rows.map((r) => this.mapToReport(r));
  }

  public async statistics(): Promise<any> {
    const text = `
      SELECT 
        COUNT(*) as total_decisions,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_decisions,
        COUNT(*) FILTER (WHERE status = 'EXECUTED') as executed_decisions,
        COUNT(*) FILTER (WHERE status = 'FAILED') as failed_decisions,
        COUNT(*) FILTER (WHERE status = 'OVERRIDDEN') as overridden_decisions,
        AVG(overall_score) as avg_score,
        AVG(confidence) as avg_confidence,
        AVG(model_latency_ms) as avg_latency
      FROM decision_reports;
    `;
    const feedbackText = `
      SELECT 
        COUNT(*) as total_feedbacks,
        COUNT(*) FILTER (WHERE accepted = TRUE) as accepted_feedbacks,
        COUNT(*) FILTER (WHERE rejected = TRUE) as rejected_feedbacks,
        COUNT(*) FILTER (WHERE was_recommendation_correct = TRUE) as correct_feedbacks
      FROM decision_feedback;
    `;
    const reports = await this.db.query(text);
    const feedbacks = await this.db.query(feedbackText);

    const rep = reports[0] || {};
    const fb = feedbacks[0] || {};

    return {
      totalDecisions: parseInt(rep.total_decisions || '0', 10),
      approvedDecisions: parseInt(rep.approved_decisions || '0', 10),
      executedDecisions: parseInt(rep.executed_decisions || '0', 10),
      failedDecisions: parseInt(rep.failed_decisions || '0', 10),
      overriddenDecisions: parseInt(rep.overridden_decisions || '0', 10),
      averageScore: parseFloat(rep.avg_score || '0'),
      averageConfidence: parseFloat(rep.avg_confidence || '0'),
      averageLatencyMs: parseFloat(rep.avg_latency || '0'),
      totalFeedbacks: parseInt(fb.total_feedbacks || '0', 10),
      acceptedFeedbacks: parseInt(fb.accepted_feedbacks || '0', 10),
      rejectedFeedbacks: parseInt(fb.rejected_feedbacks || '0', 10),
      correctFeedbacks: parseInt(fb.correct_feedbacks || '0', 10),
    };
  }

  private mapToReport(row: any): DecisionReport {
    return {
      id: row.id,
      incidentId: row.incident_id,
      overallScore: parseFloat(row.overall_score || '0'),
      confidence: parseFloat(row.confidence || '0'),
      riskLevel: row.risk_level,
      recommendedAction: row.recommended_action,
      recommendedRunbooks: row.recommended_runbooks || [],
      recommendedEngineer: row.recommended_engineer,
      estimatedResolutionTime: row.estimated_resolution_time,
      estimatedBusinessImpact: row.estimated_business_impact,
      similarIncidents: row.similar_incidents || [],
      possibleRootCauses: row.possible_root_causes || [],
      reasoning: row.reasoning,
      evidence: row.evidence || {},
      supportingMetrics: row.supporting_metrics || {},
      supportingIncidents: row.supporting_incidents || [],
      confidenceBreakdown: row.confidence_breakdown || {},
      explanation: row.explanation,
      approvalRecommendation: row.approval_recommendation,
      status: row.status,
      outcome: row.outcome,
      version: row.version,
      decisionModelVersion: row.decision_model_version,
      promptVersion: row.prompt_version,
      embeddingVersion: row.embedding_version,
      createdByModel: row.created_by_model,
      modelLatencyMs: row.model_latency_ms,
      tokenUsage: row.token_usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      executionTimeMs: row.execution_time_ms,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToFeedback(row: any): DecisionFeedback {
    return {
      id: row.id,
      decisionId: row.decision_id,
      accepted: row.accepted,
      rejected: row.rejected,
      manualOverride: row.manual_override,
      actualRootCause: row.actual_root_cause,
      actualResolutionTimeMs: row.actual_resolution_time_ms,
      wasRecommendationCorrect: row.was_recommendation_correct,
      feedback: row.feedback,
      engineer: row.engineer,
      createdAt: row.created_at,
    };
  }
}

export const decisionRepository = new DecisionRepository();
export default decisionRepository;
