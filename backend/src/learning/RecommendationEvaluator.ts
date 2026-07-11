import { LoggerService } from '../mastra/services/loggerService';
import { RecommendationEvalReport } from './LearningTypes';
import { LearningRepository } from './LearningRepository';

export class RecommendationEvaluator {
  private log = new LoggerService('RecommendationEvaluator');

  constructor(private readonly repo: LearningRepository) {}

  /**
   * Evaluate a decision's recommendation accuracy after operator feedback is available.
   * Calculates Precision, Recall, Accuracy, F1, and Confidence Drift.
   */
  async evaluate(
    decisionId: string,
    incidentId: string,
    decisionConfidence: number,
    wasRecommendationCorrect: boolean,
    wasRootCauseCorrect: boolean,
    wasRunbookCorrect: boolean
  ): Promise<RecommendationEvalReport> {
    this.log.info(`[RecommendationEvaluator] Evaluating decision ${decisionId}`);

    // Binary classification metrics from 3 binary correctness signals
    // TP = all three correct, FP = recommendation accepted but details wrong, etc.
    const tp = [wasRecommendationCorrect, wasRootCauseCorrect, wasRunbookCorrect].filter(Boolean).length;
    const total = 3;
    const fp = total - tp;
    const fn = fp; // symmetric in this binary model

    const precision  = tp / Math.max(tp + fp, 1);
    const recall     = tp / Math.max(tp + fn, 1);
    const accuracy   = tp / total;
    const f1         = precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;

    // Confidence drift: compare declared confidence vs actual outcome accuracy
    const expectedConfidence = accuracy;
    const confidenceDrift = Math.abs(decisionConfidence - expectedConfidence);

    const report: RecommendationEvalReport = {
      decisionId,
      incidentId,
      precisionScore:      precision,
      recallScore:         recall,
      accuracyScore:       accuracy,
      f1Score:             f1,
      confidenceAtCreation: decisionConfidence,
      confidenceDrift,
      recommendationSuccess: wasRecommendationCorrect,
      evaluationNotes: [
        `TP=${tp}/3`,
        `Confidence drift=${(confidenceDrift * 100).toFixed(1)}%`,
        wasRecommendationCorrect ? 'Primary recommendation accepted' : 'Primary recommendation rejected'
      ].join(' | ')
    };

    await this.repo.saveRecommendationAccuracy(report);
    this.log.info(`[RecommendationEvaluator] F1=${f1.toFixed(3)}, drift=${confidenceDrift.toFixed(3)} for decision ${decisionId}`);
    return report;
  }
}
