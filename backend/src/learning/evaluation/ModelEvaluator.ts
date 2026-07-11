import { LoggerService } from '../../mastra/services/loggerService';
import { HallucinationDetector } from './HallucinationDetector';
import { GroundednessScorer }    from './GroundednessScorer';
import { ConfidenceDriftTracker } from './ConfidenceDriftTracker';
import { LearningRepository }    from '../LearningRepository';

export interface ModelEvalInput {
  sessionId: string;
  modelName: string;
  promptVersion: string;
  llmOutput: string;
  sourceEvidence: string[];
  contextFacts: string[];
  declaredConfidence: number;
  observedAccuracy: number;
  latencyMs: number;
  costUsd: number;
  tokenCount: number;
}

export interface ModelEvalResult {
  modelName: string;
  promptVersion: string;
  latencyMs: number;
  groundednessScore: number;
  hallucinationScore: number;
  consistencyScore: number;
  reasoningQuality: number;
  citationCoverage: number;
  costUsd: number;
  tokenCount: number;
  confidenceDrift: number;
}

export class ModelEvaluator {
  private log                  = new LoggerService('ModelEvaluator');
  private hallucinationDetector = new HallucinationDetector();
  private groundednessScorer    = new GroundednessScorer();
  private driftTracker:          ConfidenceDriftTracker;

  constructor(private readonly repo: LearningRepository) {
    this.driftTracker = new ConfidenceDriftTracker(repo);
  }

  async evaluate(input: ModelEvalInput): Promise<ModelEvalResult> {
    this.log.info(`[ModelEvaluator] Evaluating model=${input.modelName} prompt=${input.promptVersion}`);

    const hallucinationResult = this.hallucinationDetector.detect(input.llmOutput, input.sourceEvidence);
    const groundednessResult  = this.groundednessScorer.score(input.llmOutput, input.contextFacts);
    const driftResult         = await this.driftTracker.track(
      input.promptVersion, input.observedAccuracy, input.declaredConfidence
    );

    // Consistency: inverse of hallucination (grounded claims / total claims)
    const consistencyScore  = 1 - hallucinationResult.score;

    // Reasoning quality: composite of groundedness + consistency
    const reasoningQuality  = (groundednessResult.score * 0.6 + consistencyScore * 0.4);

    // Citation coverage: fraction of source evidence referenced
    const citationCoverage  = groundednessResult.coveredFacts.length /
      Math.max(input.contextFacts.length, 1);

    const result: ModelEvalResult = {
      modelName:          input.modelName,
      promptVersion:      input.promptVersion,
      latencyMs:          input.latencyMs,
      groundednessScore:  groundednessResult.score,
      hallucinationScore: hallucinationResult.score,
      consistencyScore,
      reasoningQuality,
      citationCoverage,
      costUsd:            input.costUsd,
      tokenCount:         input.tokenCount,
      confidenceDrift:    driftResult.drift
    };

    // Persist to model_evaluations table
    await this.repo.db?.query(
      `INSERT INTO model_evaluations
         (session_id, model_name, prompt_version, latency_ms, groundedness_score,
          hallucination_score, consistency_score, reasoning_quality, citation_coverage, cost_usd, token_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        input.sessionId, input.modelName, input.promptVersion, input.latencyMs,
        result.groundednessScore, result.hallucinationScore, result.consistencyScore,
        result.reasoningQuality, result.citationCoverage, result.costUsd, result.tokenCount
      ]
    ).catch((err: Error) => this.log.warn(`[ModelEvaluator] DB persist failed: ${err.message}`));

    this.log.info(`[ModelEvaluator] Eval complete — hallucination=${(result.hallucinationScore * 100).toFixed(1)}%, groundedness=${(result.groundednessScore * 100).toFixed(1)}%`);
    return result;
  }
}
