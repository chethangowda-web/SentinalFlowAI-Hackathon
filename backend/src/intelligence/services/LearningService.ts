import { decisionRepository } from '../repositories/DecisionRepository';
import { DecisionFeedback } from '../types';
import { LoggerService } from '../../mastra/services/loggerService';

export class LearningService {
  private log = new LoggerService('LearningService');

  public async recordFeedback(fb: DecisionFeedback): Promise<DecisionFeedback> {
    this.log.info(`[LearningService] Recording feedback for decision ${fb.decisionId}`);

    // Persist to Postgres
    const saved = await decisionRepository.saveFeedback(fb);

    // Update Decision status if overridden/rejected
    const report = await decisionRepository.findById(fb.decisionId);
    if (report) {
      if (fb.manualOverride || fb.rejected) {
        await decisionRepository.updateDecision(
          fb.decisionId,
          'OVERRIDDEN',
          `Operator override: ${fb.feedback || 'No comments'}`
        );
      } else if (fb.accepted) {
        await decisionRepository.updateDecision(fb.decisionId, 'APPROVED', `Accepted by operator ${fb.engineer}`);
      }
    }

    // Baseline reinforcement logs (Future ML integration entry point)
    this.log.info(
      `[LearningService] SRE feedback logged: correct=${fb.wasRecommendationCorrect}, actualRootCause=${fb.actualRootCause}`
    );

    return saved;
  }
}

export const learningService = new LearningService();
export default learningService;
