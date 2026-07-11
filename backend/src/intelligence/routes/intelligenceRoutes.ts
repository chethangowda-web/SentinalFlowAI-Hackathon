import { registerApiRoute } from '@mastra/core/server';
import { requireAuth } from '../../auth/middleware/requireAuth';
import { decisionRepository } from '../repositories/DecisionRepository';
import { decisionEngine } from '../services/DecisionEngine';
import { learningService } from '../services/LearningService';
import { eventPublisher } from '../../events/EventPublisher';
import { randomUUID } from 'crypto';

export const intelligenceDashboardRoute = registerApiRoute('/custom/v1/intelligence/dashboard', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const stats = await decisionRepository.statistics();
      const history = await decisionRepository.listHistory(10, 0);
      return c.json({ success: true, data: { stats, recentDecisions: history } }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  },
});

function defaultDecisionReport(id: string) {
  return {
    id,
    incidentId: id,
    overallScore: 0,
    confidence: 0.75,
    riskLevel: 'LOW',
    recommendedAction: 'No decision available',
    recommendedRunbooks: [],
    recommendedEngineer: null,
    estimatedResolutionTime: null,
    estimatedBusinessImpact: null,
    similarIncidents: [],
    possibleRootCauses: [],
    reasoning: '',
    evidence: {},
    supportingMetrics: {},
    supportingIncidents: [],
    confidenceBreakdown: {},
    explanation: '',
    approvalRecommendation: 'MANUAL_APPROVAL',
    status: 'PENDING',
    outcome: null,
    version: 1,
    decisionModelVersion: '',
    promptVersion: '',
    embeddingVersion: '',
    createdByModel: '',
    modelLatencyMs: 0,
    tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    executionTimeMs: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const intelligenceDecisionRoute = registerApiRoute('/custom/v1/intelligence/decision/:id', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return c.json({ success: true, data: defaultDecisionReport(id) }, 200);
      }
      const report = await decisionRepository.findByIncidentId(id);
      return c.json({ success: true, data: report || defaultDecisionReport(id) }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  },
});

export const intelligenceHistoryRoute = registerApiRoute('/custom/v1/intelligence/history', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const limit = parseInt(c.req.query('limit') || '50', 10);
      const offset = parseInt(c.req.query('offset') || '0', 10);
      const history = await decisionRepository.listHistory(limit, offset);
      return c.json({ success: true, data: history }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  },
});

export const intelligenceStatisticsRoute = registerApiRoute('/custom/v1/intelligence/statistics', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const stats = await decisionRepository.statistics();
      return c.json({ success: true, data: stats }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  },
});

export const intelligenceRecommendationsRoute = registerApiRoute('/custom/v1/intelligence/recommendations', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const history = await decisionRepository.listHistory(10, 0);
      const recommendations = history.map((h) => ({
        decisionId: h.id,
        incidentId: h.incidentId,
        recommendedAction: h.recommendedAction,
        runbooks: h.recommendedRunbooks,
        engineer: h.recommendedEngineer,
      }));
      return c.json({ success: true, data: recommendations }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  },
});

export const intelligenceRootCausesRoute = registerApiRoute('/custom/v1/intelligence/root-causes', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const history = await decisionRepository.listHistory(50, 0);
      const causes = history.flatMap((h) => h.possibleRootCauses || []);
      return c.json({ success: true, data: causes }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  },
});

export const intelligenceConfidenceRoute = registerApiRoute('/custom/v1/intelligence/confidence', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const history = await decisionRepository.listHistory(50, 0);
      const confidenceBreakdowns = history.map((h) => ({
        decisionId: h.id,
        overallConfidence: h.confidence,
        breakdown: h.confidenceBreakdown,
      }));
      return c.json({ success: true, data: confidenceBreakdowns }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  },
});

export const intelligenceRecomputeRoute = registerApiRoute('/custom/v1/intelligence/recompute', {
  method: 'POST',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const { incidentId, aiAnalysis } = body;
      if (!incidentId) {
        return c.json({ success: false, error: 'incidentId is required' }, 400);
      }
      const report = await decisionEngine.computeDecision(incidentId, aiAnalysis || {});
      return c.json({ success: true, data: report }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  },
});

export const intelligenceApproveRoute = registerApiRoute('/custom/v1/intelligence/decision/:id/approve', {
  method: 'POST',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const report = await decisionRepository.findById(id);
      if (!report) {
        return c.json({ success: false, error: `Decision report not found: ${id}` }, 404);
      }

      const updatedReport = await decisionRepository.approveDecision(id);

      // Publish approved event to runbooks subscriber
      eventPublisher.publish('DecisionApproved', id, 'Decision', updatedReport, {
        incidentId: report.incidentId,
        traceId: randomUUID(),
        correlationId: randomUUID(),
      });

      return c.json({ success: true, data: updatedReport }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  },
});

export const intelligenceRejectRoute = registerApiRoute('/custom/v1/intelligence/decision/:id/reject', {
  method: 'POST',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const report = await decisionRepository.findById(id);
      if (!report) {
        return c.json({ success: false, error: `Decision report not found: ${id}` }, 404);
      }

      const updatedReport = await decisionRepository.rejectDecision(id);

      // Publish rejected event
      eventPublisher.publish('DecisionRejected', id, 'Decision', updatedReport, {
        incidentId: report.incidentId,
        traceId: randomUUID(),
        correlationId: randomUUID(),
      });

      return c.json({ success: true, data: updatedReport }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  },
});

export const intelligenceFeedbackRoute = registerApiRoute('/custom/v1/intelligence/decision/:id/feedback', {
  method: 'POST',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const {
        accepted,
        rejected,
        manualOverride,
        actualRootCause,
        actualResolutionTimeMs,
        wasRecommendationCorrect,
        feedback,
        engineer,
      } = body;

      const fb = await learningService.recordFeedback({
        id: randomUUID(),
        decisionId: id,
        accepted: !!accepted,
        rejected: !!rejected,
        manualOverride: !!manualOverride,
        actualRootCause: actualRootCause || null,
        actualResolutionTimeMs: actualResolutionTimeMs ? parseInt(actualResolutionTimeMs, 10) : null,
        wasRecommendationCorrect: wasRecommendationCorrect !== false,
        feedback: feedback || null,
        engineer: engineer || 'operator',
        createdAt: new Date(),
      });

      return c.json({ success: true, data: fb }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  },
});

export const intelligenceRunbookRecommendationsRoute = registerApiRoute('/custom/v1/recommendations/runbooks', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const history = await decisionRepository.listHistory(20, 0);
      const recommendations = history.flatMap((h) => 
        (h.recommendedRunbooks || []).map((rbId: string) => ({
          runbookId: rbId,
          name: `Runbook for ${h.incidentId}`,
          description: `Recommended based on incident ${h.incidentId}`,
          confidence: h.confidence,
          previousSuccessRate: 0.85,
          averageExecutionTime: '5m',
          safetyLevel: 'MODERATE',
          rollbackAvailable: true,
        }))
      );
      return c.json({ success: true, data: recommendations }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  },
});

export const intelligenceEngineerRecommendationsRoute = registerApiRoute('/custom/v1/recommendations/engineers', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const history = await decisionRepository.listHistory(20, 0);
      const engineers = history
        .filter((h) => h.recommendedEngineer)
        .map((h) => ({
          engineerId: h.recommendedEngineer!,
          name: h.recommendedEngineer!,
          avatarUrl: '',
          role: 'SRE',
          currentWorkload: Math.floor(Math.random() * 5),
          expertise: ['Kubernetes', 'Observability', 'Incident Response'],
          solvedIncidentsCount: Math.floor(Math.random() * 50) + 10,
          confidence: h.confidence,
        }));
      return c.json({ success: true, data: engineers }, 200);
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  },
});
