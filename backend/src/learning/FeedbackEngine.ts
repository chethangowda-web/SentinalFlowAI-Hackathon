import { LoggerService } from '../mastra/services/loggerService';
import {
  FeedbackSignalType,
  LearningFeedback,
  ProcessedFeedbackSignal
} from './LearningTypes';
import { LearningRepository } from './LearningRepository';
import { learningService } from '../intelligence/services/LearningService';
import { DecisionFeedback } from '../intelligence/types';

// Importance weight per signal type (higher = stronger learning signal)
const SIGNAL_WEIGHTS: Record<FeedbackSignalType, number> = {
  ACCEPTED_RECOMMENDATION:  0.6,
  REJECTED_RECOMMENDATION:  0.9,
  MANUAL_OVERRIDE:          1.0,
  CORRECT_ROOT_CAUSE:       0.7,
  WRONG_ROOT_CAUSE:         0.95,
  CORRECT_RUNBOOK:          0.65,
  FAILED_RUNBOOK:           0.85
};

const POSITIVE_SIGNALS = new Set<FeedbackSignalType>([
  'ACCEPTED_RECOMMENDATION',
  'CORRECT_ROOT_CAUSE',
  'CORRECT_RUNBOOK'
]);

export class FeedbackEngine {
  private log = new LoggerService('FeedbackEngine');

  constructor(private readonly repo: LearningRepository) {}

  /**
   * Process a raw feedback submission into a normalized signal and persist it.
   * Also delegates to the existing LearningService for backward compatibility.
   */
  async processFeedback(fb: LearningFeedback): Promise<ProcessedFeedbackSignal> {
    this.log.info(`[FeedbackEngine] Processing signal=${fb.signalType} for incident=${fb.incidentId}`);

    // Persist to learning_feedback table
    await this.repo.saveFeedback(fb);

    // Backward-compat: delegate to existing LearningService if a decisionId is present
    if (fb.decisionId) {
      const legacyFb: DecisionFeedback = {
        decisionId:              fb.decisionId,
        engineer:                fb.engineer ?? 'system',
        feedback:                fb.comments ?? '',
        wasRecommendationCorrect: fb.wasCorrect ?? false,
        actualRootCause:         fb.actualRootCause,
        accepted:                fb.signalType === 'ACCEPTED_RECOMMENDATION',
        rejected:                fb.signalType === 'REJECTED_RECOMMENDATION',
        manualOverride:          fb.signalType === 'MANUAL_OVERRIDE',
        submittedAt:             new Date()
      };
      await learningService.recordFeedback(legacyFb).catch(err =>
        this.log.warn(`[FeedbackEngine] Legacy LearningService.recordFeedback failed: ${err.message}`)
      );
    }

    const signal: ProcessedFeedbackSignal = {
      incidentId:            fb.incidentId,
      signalType:            fb.signalType,
      positiveReinforcement: POSITIVE_SIGNALS.has(fb.signalType),
      weight:                SIGNAL_WEIGHTS[fb.signalType] ?? 0.5,
      details: {
        wasCorrect:       fb.wasCorrect,
        actualRootCause:  fb.actualRootCause,
        satisfactionScore: fb.satisfactionScore
      }
    };

    this.log.info(`[FeedbackEngine] Signal processed: positive=${signal.positiveReinforcement}, weight=${signal.weight}`);
    return signal;
  }

  /**
   * Batch-process all unprocessed feedback for an incident and aggregate into a summary signal.
   */
  async aggregateFeedbackForIncident(incidentId: string): Promise<ProcessedFeedbackSignal[]> {
    const records = await this.repo.getFeedbackForIncident(incidentId);
    return records.map(fb => ({
      incidentId:            fb.incidentId,
      signalType:            fb.signalType,
      positiveReinforcement: POSITIVE_SIGNALS.has(fb.signalType),
      weight:                SIGNAL_WEIGHTS[fb.signalType] ?? 0.5,
      details:               fb.metadata ?? {}
    }));
  }
}
