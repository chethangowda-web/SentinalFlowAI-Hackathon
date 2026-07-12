import { registerApiRoute } from '@mastra/core/server';
import { requireAuth } from '../../auth/middleware/requireAuth';
import { learningPipelineEngine } from '../LearningPipelineEngine';
import { learningRepository }     from '../LearningRepository';
import { dbClient }               from '../../database/client/DatabaseClient';
import { LearningFeedback }        from '../LearningTypes';

// ── GET /custom/v1/learning/statistics ─────────────────────────────────────────
export const learningStatisticsRoute = registerApiRoute('/custom/v1/learning/statistics', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const stats = await learningRepository.getStatistics();
      return c.json({ success: true, data: stats }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }
});

// ── GET /custom/v1/learning/history ─────────────────────────────────────────────
export const learningHistoryRoute = registerApiRoute('/custom/v1/learning/history', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const limit  = Math.min(parseInt(c.req.query('limit')  || '50',  10), 200);
      const offset =           parseInt(c.req.query('offset') || '0',   10);
      const history = await learningRepository.getHistory(limit, offset);
      return c.json({ success: true, data: history, limit, offset }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }
});

// ── GET /custom/v1/learning/prompts ─────────────────────────────────────────────
export const learningPromptsRoute = registerApiRoute('/custom/v1/learning/prompts', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const name = c.req.query('name');
      if (!name) return c.json({ success: false, error: 'Query param "name" is required' }, 400);
      const versions = await learningRepository.getPromptHistory(name);
      return c.json({ success: true, data: versions }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }
});

// ── POST /custom/v1/learning/feedback ───────────────────────────────────────────
export const learningFeedbackRoute = registerApiRoute('/custom/v1/learning/feedback', {
  method: 'POST',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const body = await c.req.json() as LearningFeedback;
      if (!body.incidentId || !body.signalType) {
        return c.json({ success: false, error: 'incidentId and signalType are required' }, 400);
      }
      const signal = await learningPipelineEngine.getFeedbackEngine().processFeedback(body);
      return c.json({ success: true, data: signal }, 201);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }
});

// ── POST /custom/v1/learning/retrain ─────────────────────────────────────────────
export const learningRetrainRoute = registerApiRoute('/custom/v1/learning/retrain', {
  method: 'POST',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const body = await c.req.json() as { incidentId: string; incident: Record<string, any> };
      if (!body.incidentId || !body.incident) {
        return c.json({ success: false, error: 'incidentId and incident payload are required' }, 400);
      }
      // Fire async — return immediately with accepted status
      setImmediate(() => {
        learningPipelineEngine.run({
          incidentId: body.incidentId,
          incident:   body.incident,
          promptsToEvaluate: ['sre-decision-prompt', 'rca-prompt']
        }).catch(err => console.error(`[LearningRoutes] Retrain failed: ${err.message}`));
      });
      return c.json({ success: true, data: { status: 'STARTED', incidentId: body.incidentId } }, 202);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }
});

// ── POST /custom/v1/learning/reindex ─────────────────────────────────────────────
export const learningReindexRoute = registerApiRoute('/custom/v1/learning/reindex', {
  method: 'POST',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const body = await c.req.json() as { incidentId: string; incident: Record<string, any> };
      if (!body.incidentId || !body.incident) {
        return c.json({ success: false, error: 'incidentId and incident payload are required' }, 400);
      }
      setImmediate(() => {
        learningPipelineEngine.run({ incidentId: body.incidentId, incident: body.incident })
          .catch(err => console.error(`[LearningRoutes] Reindex failed: ${err.message}`));
      });
      return c.json({ success: true, data: { status: 'REINDEX_STARTED', incidentId: body.incidentId } }, 202);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }
});

// ── GET /custom/v1/learning/overview ──────────────────────────────────────────
export const learningOverviewRoute = registerApiRoute('/custom/v1/learning/overview', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const stats = await learningRepository.getStatistics();
      const rows = await dbClient.query<any[]>(`
        SELECT cause, COUNT(*) as count
        FROM incident_root_causes
        GROUP BY cause ORDER BY count DESC LIMIT 5
      `);
      const errorRows = await dbClient.query<any[]>(`
        SELECT error_message as error, COUNT(*) as count
        FROM incidents WHERE error_message IS NOT NULL
        GROUP BY error_message ORDER BY count DESC LIMIT 5
      `);
      const runbookRows = await dbClient.query<any[]>(`
        SELECT runbook_name as name, COUNT(*) as count
        FROM runbook_executions WHERE status = 'COMPLETED'
        GROUP BY runbook_name ORDER BY count DESC LIMIT 5
      `);
      return c.json({
        success: true,
        data: {
          totalIncidentsLearned: stats?.totalSessions ?? 0,
          embeddingsGenerated: stats?.totalKnowledgeUpdates ?? 0,
          knowledgeBaseSize: stats?.activePromptVersions ?? 0,
          similarityAccuracy: stats?.avgRecommendationAccuracy ?? 0,
          learningGrowth: stats?.totalFeedbackSignals ?? 0,
          topRootCauses: rows ?? [],
          frequentErrors: errorRows ?? [],
          successfulRunbooks: runbookRows ?? [],
        },
      }, 200);
    } catch (error: any) {
      return c.json({ success: true, data: {
        totalIncidentsLearned: 0,
        embeddingsGenerated: 0,
        knowledgeBaseSize: 0,
        similarityAccuracy: 0,
        learningGrowth: 0,
        topRootCauses: [],
        frequentErrors: [],
        successfulRunbooks: [],
      }}, 200);
    }
  }
});

// ── GET /custom/v1/learning/growth ────────────────────────────────────────────
export const learningGrowthRoute = registerApiRoute('/custom/v1/learning/growth', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const rows = await dbClient.query<any[]>(`
        SELECT DATE_TRUNC('week', created_at) as date,
               COUNT(*) as incidents,
               COALESCE(SUM(knowledge_updates), 0) as embeddings
        FROM learning_sessions
        WHERE created_at >= NOW() - INTERVAL '6 weeks'
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY date ASC
      `);
      const data = (rows ?? []).map((r: any) => ({
        date: r.date ? new Date(r.date).toISOString().split('T')[0] : 'N/A',
        embeddings: parseInt(r.embeddings || '0', 10),
        incidents: parseInt(r.incidents || '0', 10),
      }));
      return c.json({ success: true, data }, 200);
    } catch {
      return c.json({ success: true, data: [] }, 200);
    }
  }
});

// ── GET /custom/v1/learning/similar ───────────────────────────────────────────
export const learningSimilarRoute = registerApiRoute('/custom/v1/learning/similar', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    const incidentId = c.req.query('incidentId');
    if (!incidentId) {
      return c.json({ success: true, data: [] }, 200);
    }
    const rows = await dbClient.query<any[]>(`
      SELECT i.incident_id as id, i.title, i.severity, i.created_at as resolved_at
      FROM incidents i
      WHERE i.deleted_at IS NULL AND i.incident_id != $1
      ORDER BY i.created_at DESC LIMIT 5
    `, [incidentId]);
    const data = (rows ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      severity: r.severity,
      similarity: 0,
      resolvedAt: r.resolved_at,
      runbookUsed: r.runbook_used || 'N/A',
    }));
    return c.json({ success: true, data }, 200);
  }
});

// ── GET /custom/v1/learning/knowledge ─────────────────────────────────────────
export const learningKnowledgeRoute = registerApiRoute('/custom/v1/learning/knowledge', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const catRows = await dbClient.query<any[]>(`
        SELECT DISTINCT root_cause as name FROM incidents
        WHERE deleted_at IS NULL AND root_cause IS NOT NULL AND root_cause != ''
        LIMIT 20
      `);
      const nodes = catRows.map((r: any, i: number) => ({
        id: `cause-${i}`,
        name: r.name.length > 40 ? r.name.substring(0, 40) + '...' : r.name,
        category: 'Root Cause',
        categoryIndex: 0,
        symbolSize: 20 + Math.floor(Math.random() * 15),
      }));
      const serviceRows = await dbClient.query<any[]>(`
        SELECT DISTINCT service FROM incidents WHERE deleted_at IS NULL AND service != '' LIMIT 15
      `);
      const serviceNodes = serviceRows.map((r: any, i: number) => ({
        id: `svc-${i}`,
        name: r.service,
        category: 'Service',
        categoryIndex: 1,
        symbolSize: 15,
      }));
      const links = nodes.slice(0, Math.min(nodes.length, serviceNodes.length)).map((n: any, i: number) => ({
        id: `link-${i}`,
        source: n.id,
        target: serviceNodes[i % serviceNodes.length]?.id || serviceNodes[0]?.id || '',
        label: 'related',
      }));
      return c.json({
        success: true,
        data: {
          nodes: [...nodes, ...serviceNodes],
          links: links.filter((l: any) => l.target),
          categories: ['Root Cause', 'Service'],
        },
      }, 200);
    } catch (error: any) {
      return c.json({ success: true, data: { nodes: [], links: [], categories: [] } }, 200);
    }
  }
});

// ── GET /custom/v1/learning/search ────────────────────────────────────────────
export const learningSearchRoute = registerApiRoute('/custom/v1/learning/search', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const q = c.req.query('q');
      if (!q || q.length < 2) {
        return c.json({ success: true, data: [] }, 200);
      }
      const searchTerm = `%${q}%`;
      const rows = await dbClient.query<any[]>(`
        SELECT incident_id as id, title, summary as content, 'incident' as category, severity as score
        FROM incidents
        WHERE deleted_at IS NULL
          AND (title ILIKE $1 OR summary ILIKE $1 OR description ILIKE $1)
        ORDER BY created_at DESC LIMIT 20
      `, [searchTerm]);
      return c.json({ success: true, data: rows }, 200);
    } catch (error: any) {
      return c.json({ success: true, data: [] }, 200);
    }
  }
});

// ── GET /custom/v1/learning/embeddings ──────────────────────────────────────────
export const learningEmbeddingsRoute = registerApiRoute('/custom/v1/learning/embeddings', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const rows = await dbClient.query<any[]>(`
        SELECT COUNT(*) as total, COALESCE(SUM(knowledge_updates), 0) as generated
        FROM learning_sessions
      `);
      return c.json({
        success: true,
        data: {
          totalEmbeddings: parseInt(rows[0]?.total || '0', 10),
          generated: parseInt(rows[0]?.generated || '0', 10),
        },
      }, 200);
    } catch {
      return c.json({ success: true, data: { totalEmbeddings: 0, generated: 0 } }, 200);
    }
  }
});

// ── GET /custom/v1/learning/recommendations ─────────────────────────────────────
export const learningRecommendationsRoute = registerApiRoute('/custom/v1/learning/recommendations', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const rows = await dbClient.query<Record<string, string>>(`
        SELECT
          COUNT(*)                                                         AS total_decisions,
          AVG(accuracy_score)                                              AS avg_accuracy,
          AVG(precision_score)                                             AS avg_precision,
          AVG(recall_score)                                                AS avg_recall,
          AVG(f1_score)                                                    AS avg_f1,
          AVG(confidence_drift)                                            AS avg_confidence_drift,
          COUNT(*) FILTER (WHERE recommendation_success = TRUE)            AS successful_recommendations,
          ROUND(
            COUNT(*) FILTER (WHERE recommendation_success = TRUE) * 100.0
            / NULLIF(COUNT(*), 0), 2
          )                                                                AS success_rate_pct
        FROM recommendation_accuracy
      `);
      return c.json({ success: true, data: rows[0] ?? {} }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }
});
