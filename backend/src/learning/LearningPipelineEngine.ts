import { LoggerService } from '../mastra/services/loggerService';
import { LearningRepository }      from './LearningRepository';
import { FeedbackEngine }           from './FeedbackEngine';
import { KnowledgeExtractor }       from './KnowledgeExtractor';
import { OutcomeScorer }            from './OutcomeScorer';
import { PromptOptimizer }          from './PromptOptimizer';
import { KnowledgeUpdater }         from './KnowledgeUpdater';
import { RecommendationEvaluator }  from './RecommendationEvaluator';
import { eventPublisher }           from '../events/EventPublisher';
import { randomUUID }               from 'crypto';
import { LearningSession }          from './LearningTypes';

export interface LearningTrigger {
  incidentId: string;
  incident:   Record<string, any>;
  decisionId?: string;
  decisionConfidence?: number;
  wasRecommendationCorrect?: boolean;
  wasRootCauseCorrect?: boolean;
  wasRunbookCorrect?: boolean;
  feedbackMetadata?: Record<string, any>;
  promptsToEvaluate?: string[];
  latestPromptMetrics?: {
    accuracyRate: number;
    hallucinationRate: number;
    avgLatencyMs: number;
    sampleCount: number;
  };
}

export class LearningPipelineEngine {
  private log  = new LoggerService('LearningPipelineEngine');
  private repo:                    LearningRepository;
  private feedbackEngine:          FeedbackEngine;
  private knowledgeExtractor:      KnowledgeExtractor;
  private outcomeScorer:           OutcomeScorer;
  private promptOptimizer:         PromptOptimizer;
  private knowledgeUpdater:        KnowledgeUpdater;
  private recommendationEvaluator: RecommendationEvaluator;

  constructor() {
    this.repo                    = new LearningRepository();
    this.feedbackEngine          = new FeedbackEngine(this.repo);
    this.knowledgeExtractor      = new KnowledgeExtractor();
    this.outcomeScorer           = new OutcomeScorer();
    this.promptOptimizer         = new PromptOptimizer(this.repo);
    this.knowledgeUpdater        = new KnowledgeUpdater(this.repo);
    this.recommendationEvaluator = new RecommendationEvaluator(this.repo);
  }

  /**
   * Execute the full learning pipeline for a resolved incident.
   * Each phase is isolated — a failure in one phase does not abort subsequent phases.
   */
  async run(trigger: LearningTrigger): Promise<LearningSession> {
    const { incidentId } = trigger;
    const correlationCtx = {
      incidentId,
      tenantId:      'system',
      traceId:       randomUUID(),
      correlationId: randomUUID()
    };

    this.log.info(`[LearningPipeline] Starting pipeline for incident ${incidentId}`);

    const session   = await this.repo.createSession(incidentId);
    const sessionId = session.id!;

    eventPublisher.publish('LearningStarted', sessionId, 'LearningSession', { incidentId, sessionId }, correlationCtx);

    const phasesCompleted: string[] = [];
    let knowledgeUpdates  = 0;
    let outcomeScore: number | undefined;
    let promptVersionBump = false;
    let artifact: any;

    // ── Phase 1: EXTRACTING ──────────────────────────────────────────────
    try {
      await this.repo.updateSession(incidentId, 'EXTRACTING', { phasesCompleted });
      artifact = await this.knowledgeExtractor.extract(trigger.incident);
      phasesCompleted.push('EXTRACTING');
      this.log.info(`[LearningPipeline] Phase EXTRACTING complete`);
    } catch (err: any) {
      this.log.error(`[LearningPipeline] EXTRACTING failed: ${err.message}`);
      phasesCompleted.push('EXTRACTING_FAILED');
    }

    // ── Phase 2: SCORING ─────────────────────────────────────────────────
    try {
      await this.repo.updateSession(incidentId, 'SCORING', { phasesCompleted });
      const result = this.outcomeScorer.score(trigger.incident, trigger.feedbackMetadata);
      outcomeScore = result.compositeScore;
      phasesCompleted.push('SCORING');
      this.log.info(`[LearningPipeline] Phase SCORING complete — score=${outcomeScore.toFixed(1)}`);
    } catch (err: any) {
      this.log.error(`[LearningPipeline] SCORING failed: ${err.message}`);
      phasesCompleted.push('SCORING_FAILED');
    }

    // ── Phase 3: RECOMMENDATION EVALUATION ──────────────────────────────
    try {
      if (trigger.decisionId && trigger.decisionConfidence !== undefined) {
        await this.recommendationEvaluator.evaluate(
          trigger.decisionId,
          incidentId,
          trigger.decisionConfidence,
          trigger.wasRecommendationCorrect ?? false,
          trigger.wasRootCauseCorrect      ?? false,
          trigger.wasRunbookCorrect        ?? false
        );
        eventPublisher.publish('RecommendationImproved', sessionId, 'LearningSession',
          { incidentId, decisionId: trigger.decisionId }, correlationCtx);
        phasesCompleted.push('RECOMMENDATION_EVAL');
      }
    } catch (err: any) {
      this.log.error(`[LearningPipeline] RECOMMENDATION_EVAL failed: ${err.message}`);
      phasesCompleted.push('RECOMMENDATION_EVAL_FAILED');
    }

    // ── Phase 4: OPTIMIZING ──────────────────────────────────────────────
    try {
      await this.repo.updateSession(incidentId, 'OPTIMIZING', { phasesCompleted });
      if (trigger.promptsToEvaluate && trigger.latestPromptMetrics) {
        for (const promptName of trigger.promptsToEvaluate) {
          const result = await this.promptOptimizer.optimizePrompt(promptName, trigger.latestPromptMetrics);
          if (result.bumped) {
            promptVersionBump = true;
            eventPublisher.publish('PromptImproved', sessionId, 'LearningSession',
              { promptName, newVersion: result.newVersion?.version }, correlationCtx);
          }
        }
      }
      phasesCompleted.push('OPTIMIZING');
      this.log.info(`[LearningPipeline] Phase OPTIMIZING complete — versionBump=${promptVersionBump}`);
    } catch (err: any) {
      this.log.error(`[LearningPipeline] OPTIMIZING failed: ${err.message}`);
      phasesCompleted.push('OPTIMIZING_FAILED');
    }

    // ── Phase 5: UPDATING ────────────────────────────────────────────────
    try {
      await this.repo.updateSession(incidentId, 'UPDATING', { phasesCompleted });
      if (artifact) {
        knowledgeUpdates = await this.knowledgeUpdater.update(sessionId, artifact);
        eventPublisher.publish('KnowledgeUpdated', sessionId, 'LearningSession',
          { incidentId, knowledgeUpdates }, correlationCtx);
      }
      phasesCompleted.push('UPDATING');
      this.log.info(`[LearningPipeline] Phase UPDATING complete — ${knowledgeUpdates} mutations`);
    } catch (err: any) {
      this.log.error(`[LearningPipeline] UPDATING failed: ${err.message}`);
      phasesCompleted.push('UPDATING_FAILED');
    }

    // ── Finalise ─────────────────────────────────────────────────────────
    const feedbackRecords = await this.repo.getFeedbackForIncident(incidentId);
    await this.repo.updateSession(incidentId, 'COMPLETED', {
      phasesCompleted,
      outcomeScore,
      feedbackCount:    feedbackRecords.length,
      knowledgeUpdates,
      promptVersionBump
    });

    eventPublisher.publish('LearningCompleted', sessionId, 'LearningSession', {
      incidentId, sessionId, phasesCompleted, outcomeScore, knowledgeUpdates, promptVersionBump
    }, correlationCtx);

    this.log.info(`[LearningPipeline] COMPLETED for incident ${incidentId} — phases: ${phasesCompleted.join(', ')}`);
    return (await this.repo.getSessionByIncident(incidentId))!;
  }

  getRepository(): LearningRepository { return this.repo; }
  getFeedbackEngine(): FeedbackEngine   { return this.feedbackEngine; }
}

export const learningPipelineEngine = new LearningPipelineEngine();
