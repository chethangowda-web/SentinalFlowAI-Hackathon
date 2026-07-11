import { LoggerService } from '../../mastra/services/loggerService';
import { LearningRepository } from '../LearningRepository';

export interface ConfidenceDriftResult {
  promptName: string;
  currentConfidence: number;
  baselineConfidence: number;
  drift: number;          // positive = over-confident, negative = under-confident
  isDegrading: boolean;
  alertThreshold: number;
}

const DRIFT_ALERT_THRESHOLD = 0.10; // >10% drift triggers an alert

export class ConfidenceDriftTracker {
  private log = new LoggerService('ConfidenceDriftTracker');
  private baselineStore = new Map<string, number>(); // promptName → baseline confidence

  constructor(private readonly repo: LearningRepository) {}

  /**
   * Record a new confidence data point and compute drift vs. rolling baseline.
   */
  async track(promptName: string, observedAccuracy: number, declaredConfidence: number): Promise<ConfidenceDriftResult> {
    const key = promptName;
    if (!this.baselineStore.has(key)) {
      // Seed baseline from DB on first access
      const history = await this.repo.getPromptHistory(promptName);
      const activeVersions = history.filter(p => p.status === 'ACTIVE' || p.status === 'DEPRECATED');
      if (activeVersions.length > 0 && activeVersions[0].accuracyRate !== undefined) {
        this.baselineStore.set(key, activeVersions[0].accuracyRate!);
      } else {
        this.baselineStore.set(key, declaredConfidence); // first observation becomes baseline
      }
    }

    const baseline = this.baselineStore.get(key)!;
    const drift = declaredConfidence - observedAccuracy;
    const isDegrading = Math.abs(drift) > DRIFT_ALERT_THRESHOLD;

    // Update baseline with exponential moving average (α=0.1)
    const updatedBaseline = baseline * 0.9 + observedAccuracy * 0.1;
    this.baselineStore.set(key, updatedBaseline);

    const result: ConfidenceDriftResult = {
      promptName,
      currentConfidence:  declaredConfidence,
      baselineConfidence: baseline,
      drift,
      isDegrading,
      alertThreshold: DRIFT_ALERT_THRESHOLD
    };

    if (isDegrading) {
      this.log.warn(`[ConfidenceDriftTracker] DRIFT ALERT for "${promptName}" — drift=${(drift * 100).toFixed(1)}% exceeds threshold`);
    } else {
      this.log.debug(`[ConfidenceDriftTracker] "${promptName}" drift=${(drift * 100).toFixed(1)}% — within threshold`);
    }

    return result;
  }
}
