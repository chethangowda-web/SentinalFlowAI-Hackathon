import { eventRegistry } from '../../events/EventRegistry';
import { learningPipelineEngine } from '../LearningPipelineEngine';
import { LearningFeedback } from '../LearningTypes';
import { LoggerService } from '../../mastra/services/loggerService';

export class LearningEventSubscriber {
  private log = new LoggerService('LearningEventSubscriber');

  /**
   * Register all EventBus subscriptions for the learning platform.
   * Call this once at application startup.
   */
  register(): void {
    this.log.info('[LearningEventSubscriber] Registering learning event handlers');

    // ── IncidentResolved → start full learning pipeline ─────────────────
    eventRegistry.register('IncidentResolved', async (event) => {
      const payload = event.payload as { incidentId: string; resolvedBy: string; rootCause: string };
      this.log.info(`[LearningEventSubscriber] IncidentResolved — triggering pipeline for ${payload.incidentId}`);
      try {
        await learningPipelineEngine.run({
          incidentId: payload.incidentId,
          incident: {
            id:          payload.incidentId,
            rootCause:   payload.rootCause,
            resolvedAt:  new Date(),
            resolvedBy:  payload.resolvedBy
          },
          promptsToEvaluate: ['sre-decision-prompt', 'rca-prompt']
        });
      } catch (err: any) {
        this.log.error(`[LearningEventSubscriber] Pipeline failed for IncidentResolved ${payload.incidentId}: ${err.message}`);
      }
    });

    // ── IncidentClosed → finalise feedback count ──────────────────────────
    eventRegistry.register('IncidentClosed', async (event) => {
      const payload = event.payload as { incidentId: string; closedBy: string };
      this.log.info(`[LearningEventSubscriber] IncidentClosed — finalising session for ${payload.incidentId}`);
      try {
        const repo    = learningPipelineEngine.getRepository();
        const session = await repo.getSessionByIncident(payload.incidentId);
        if (!session) return;
        const feedback = await repo.getFeedbackForIncident(payload.incidentId);
        await repo.updateSession(payload.incidentId, 'COMPLETED', { feedbackCount: feedback.length });
      } catch (err: any) {
        this.log.error(`[LearningEventSubscriber] IncidentClosed handler failed: ${err.message}`);
      }
    });

    // ── RunbookExecutionCompleted → positive runbook signal ───────────────
    eventRegistry.register('RunbookExecutionCompleted', async (event) => {
      const payload = event.payload as { incidentId: string; runbookId: string; executionId: string };
      try {
        await learningPipelineEngine.getRepository().saveFeedback({
          incidentId: payload.incidentId,
          signalType: 'CORRECT_RUNBOOK',
          wasCorrect: true,
          metadata:   { runbookId: payload.runbookId, executionId: payload.executionId }
        });
      } catch (err: any) {
        this.log.error(`[LearningEventSubscriber] RunbookExecutionCompleted handler failed: ${err.message}`);
      }
    });

    // ── RunbookExecutionFailed → negative runbook signal ─────────────────
    eventRegistry.register('RunbookExecutionFailed', async (event) => {
      const payload = event.payload as { incidentId: string; runbookId: string; executionId: string; error: string };
      try {
        await learningPipelineEngine.getRepository().saveFeedback({
          incidentId: payload.incidentId,
          signalType: 'FAILED_RUNBOOK',
          wasCorrect: false,
          comments:   payload.error,
          metadata:   { runbookId: payload.runbookId, executionId: payload.executionId }
        });
      } catch (err: any) {
        this.log.error(`[LearningEventSubscriber] RunbookExecutionFailed handler failed: ${err.message}`);
      }
    });

    // ── ApprovalGranted → decision accepted signal ────────────────────────
    eventRegistry.register('ApprovalGranted', async (event) => {
      const payload = event.payload as { incidentId: string; runbookId: string; executionId: string; approvedBy: string };
      try {
        await learningPipelineEngine.getRepository().saveFeedback({
          incidentId: payload.incidentId,
          signalType: 'ACCEPTED_RECOMMENDATION',
          wasCorrect: true,
          engineer:   payload.approvedBy,
          metadata:   { executionId: payload.executionId }
        });
      } catch (err: any) {
        this.log.error(`[LearningEventSubscriber] ApprovalGranted handler failed: ${err.message}`);
      }
    });

    // ── ApprovalRejected → decision rejected signal ───────────────────────
    eventRegistry.register('ApprovalRejected', async (event) => {
      const payload = event.payload as { incidentId: string; runbookId: string; executionId: string; rejectedBy: string; reason?: string };
      try {
        await learningPipelineEngine.getRepository().saveFeedback({
          incidentId: payload.incidentId,
          signalType: 'REJECTED_RECOMMENDATION',
          wasCorrect: false,
          engineer:   payload.rejectedBy,
          comments:   payload.reason,
          metadata:   { executionId: payload.executionId }
        });
      } catch (err: any) {
        this.log.error(`[LearningEventSubscriber] ApprovalRejected handler failed: ${err.message}`);
      }
    });

    // ── FeedbackSubmitted → route to FeedbackEngine ───────────────────────
    eventRegistry.register('FeedbackSubmitted', async (event) => {
      const payload = event.payload as LearningFeedback;
      try {
        await learningPipelineEngine.getFeedbackEngine().processFeedback(payload);
      } catch (err: any) {
        this.log.error(`[LearningEventSubscriber] FeedbackSubmitted handler failed: ${err.message}`);
      }
    });

    this.log.info('[LearningEventSubscriber] All 7 event handlers registered');
  }
}

export const learningEventSubscriber = new LearningEventSubscriber();
