import { dbClient } from '../database/client/DatabaseClient';
import { LoggerService } from '../mastra/services/loggerService';
import {
  LearningFeedback,
  LearningSession,
  LearningSessionStatus,
  PromptVersionRecord,
  RecommendationEvalReport,
  LearningStatistics
} from './LearningTypes';

export class LearningRepository {
  private log = new LoggerService('LearningRepository');

  // ── Sessions ──────────────────────────────────────────────

  async createSession(incidentId: string): Promise<LearningSession> {
    const rows = await dbClient.query<LearningSession>(
      `INSERT INTO learning_sessions (incident_id, status, phases_completed, feedback_count, knowledge_updates, prompt_version_bump)
       VALUES ($1, 'STARTED', '{}', 0, 0, FALSE)
       ON CONFLICT (incident_id) DO UPDATE SET status = 'STARTED', started_at = NOW(), completed_at = NULL
       RETURNING *`,
      [incidentId]
    );
    return rows[0];
  }

  async updateSession(
    incidentId: string,
    status: LearningSessionStatus,
    patch: Partial<Pick<LearningSession,
      'phasesCompleted' | 'outcomeScore' | 'feedbackCount' |
      'knowledgeUpdates' | 'promptVersionBump' | 'errorMessage'
    >> = {}
  ): Promise<void> {
    const isTerminal = status === 'COMPLETED' || status === 'FAILED';
    await dbClient.query(
      `UPDATE learning_sessions SET
         status              = $2,
         phases_completed    = COALESCE($3::text[], phases_completed),
         outcome_score       = COALESCE($4::numeric, outcome_score),
         feedback_count      = COALESCE($5::int, feedback_count),
         knowledge_updates   = COALESCE($6::int, knowledge_updates),
         prompt_version_bump = COALESCE($7::boolean, prompt_version_bump),
         error_message       = $8,
         completed_at        = CASE WHEN $9 THEN NOW() ELSE completed_at END
       WHERE incident_id = $1`,
      [
        incidentId,
        status,
        patch.phasesCompleted ?? null,
        patch.outcomeScore    ?? null,
        patch.feedbackCount   ?? null,
        patch.knowledgeUpdates ?? null,
        patch.promptVersionBump ?? null,
        patch.errorMessage    ?? null,
        isTerminal
      ]
    );
  }

  async getSessionByIncident(incidentId: string): Promise<LearningSession | null> {
    const rows = await dbClient.query<LearningSession>(
      `SELECT * FROM learning_sessions WHERE incident_id = $1`,
      [incidentId]
    );
    return rows[0] ?? null;
  }

  // ── Feedback ──────────────────────────────────────────────

  async saveFeedback(fb: LearningFeedback): Promise<LearningFeedback> {
    const rows = await dbClient.query<LearningFeedback>(
      `INSERT INTO learning_feedback
         (incident_id, decision_id, session_id, engineer, signal_type, was_correct,
          actual_root_cause, actual_resolution, comments, satisfaction_score, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        fb.incidentId,
        fb.decisionId        ?? null,
        fb.sessionId         ?? null,
        fb.engineer          ?? null,
        fb.signalType,
        fb.wasCorrect        ?? null,
        fb.actualRootCause   ?? null,
        fb.actualResolution  ?? null,
        fb.comments          ?? null,
        fb.satisfactionScore ?? null,
        JSON.stringify(fb.metadata ?? {})
      ]
    );
    return rows[0];
  }

  async getFeedbackForIncident(incidentId: string): Promise<LearningFeedback[]> {
    return dbClient.query<LearningFeedback>(
      `SELECT * FROM learning_feedback WHERE incident_id = $1 ORDER BY created_at ASC`,
      [incidentId]
    );
  }

  // ── Prompt Versions ───────────────────────────────────────

  async savePromptVersion(pv: PromptVersionRecord): Promise<PromptVersionRecord> {
    const rows = await dbClient.query<PromptVersionRecord>(
      `INSERT INTO prompt_versions
         (prompt_name, version, content, variables, status, accuracy_rate,
          hallucination_rate, avg_latency_ms, sample_count, promoted_from_version)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (prompt_name, version) DO UPDATE SET
         accuracy_rate      = EXCLUDED.accuracy_rate,
         hallucination_rate = EXCLUDED.hallucination_rate,
         avg_latency_ms     = EXCLUDED.avg_latency_ms,
         sample_count       = EXCLUDED.sample_count,
         status             = EXCLUDED.status
       RETURNING *`,
      [
        pv.promptName,
        pv.version,
        pv.content,
        JSON.stringify(pv.variables ?? {}),
        pv.status,
        pv.accuracyRate        ?? null,
        pv.hallucinationRate   ?? null,
        pv.avgLatencyMs        ?? null,
        pv.sampleCount         ?? 0,
        pv.promotedFromVersion ?? null
      ]
    );
    return rows[0];
  }

  async getActivePrompt(promptName: string): Promise<PromptVersionRecord | null> {
    const rows = await dbClient.query<PromptVersionRecord>(
      `SELECT * FROM prompt_versions WHERE prompt_name = $1 AND status = 'ACTIVE' ORDER BY version DESC LIMIT 1`,
      [promptName]
    );
    return rows[0] ?? null;
  }

  async getPromptHistory(promptName: string): Promise<PromptVersionRecord[]> {
    return dbClient.query<PromptVersionRecord>(
      `SELECT * FROM prompt_versions WHERE prompt_name = $1 ORDER BY version DESC`,
      [promptName]
    );
  }

  // ── Knowledge Updates ─────────────────────────────────────

  async saveKnowledgeUpdate(
    sessionId: string,
    incidentId: string,
    storeType: string,
    operation: string,
    entityId: string,
    changes: Record<string, unknown>,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await dbClient.query(
      `INSERT INTO knowledge_updates
         (session_id, incident_id, store_type, operation, entity_id, changes, success, error_message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [sessionId, incidentId, storeType, operation, entityId, JSON.stringify(changes), success, errorMessage ?? null]
    );
  }

  // ── Recommendation Accuracy ───────────────────────────────

  async saveRecommendationAccuracy(report: RecommendationEvalReport): Promise<void> {
    await dbClient.query(
      `INSERT INTO recommendation_accuracy
         (decision_id, incident_id, precision_score, recall_score, accuracy_score,
          f1_score, confidence_at_creation, confidence_drift, recommendation_success, evaluation_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        report.decisionId,
        report.incidentId,
        report.precisionScore,
        report.recallScore,
        report.accuracyScore,
        report.f1Score,
        report.confidenceAtCreation,
        report.confidenceDrift,
        report.recommendationSuccess,
        report.evaluationNotes
      ]
    );
  }

  // ── Statistics ────────────────────────────────────────────

  async getStatistics(): Promise<LearningStatistics> {
    const [sessionRows, feedbackRows, promptRows, accuracyRows] = await Promise.all([
      dbClient.query<Record<string, string>>(`
        SELECT
          COUNT(*)                                   AS total,
          COUNT(*) FILTER (WHERE status='COMPLETED') AS completed,
          COUNT(*) FILTER (WHERE status='FAILED')    AS failed,
          AVG(outcome_score)                         AS avg_outcome,
          SUM(knowledge_updates)                     AS total_ku
        FROM learning_sessions
      `),
      dbClient.query<Record<string, string>>(`SELECT COUNT(*) AS total FROM learning_feedback`),
      dbClient.query<Record<string, string>>(`SELECT COUNT(*) AS active FROM prompt_versions WHERE status='ACTIVE'`),
      dbClient.query<Record<string, string>>(`
        SELECT AVG(accuracy_score) AS avg_accuracy, AVG(hallucination_score) AS avg_hallucination
        FROM model_evaluations
      `)
    ]);

    const s = sessionRows[0] ?? {};
    return {
      totalSessions:             Number(s['total'])        || 0,
      completedSessions:         Number(s['completed'])    || 0,
      failedSessions:            Number(s['failed'])       || 0,
      avgOutcomeScore:           Number(s['avg_outcome'])  || 0,
      totalFeedbackSignals:      Number(feedbackRows[0]?.['total']) || 0,
      totalKnowledgeUpdates:     Number(s['total_ku'])     || 0,
      activePromptVersions:      Number(promptRows[0]?.['active']) || 0,
      avgRecommendationAccuracy: Number(accuracyRows[0]?.['avg_accuracy'])     || 0,
      avgHallucinationRate:      Number(accuracyRows[0]?.['avg_hallucination']) || 0,
      mttrImprovementPct:        0
    };
  }

  async getHistory(limit = 50, offset = 0): Promise<LearningSession[]> {
    return dbClient.query<LearningSession>(
      `SELECT * FROM learning_sessions ORDER BY started_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
  }
}

export const learningRepository = new LearningRepository();
