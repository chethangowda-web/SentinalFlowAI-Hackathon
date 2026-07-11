import { LoggerService } from '../../mastra/services/loggerService';

export class ChaosTestingHook {
  private static log = new LoggerService('ChaosTestingHook');
  private static latencyDelayMs = 0;
  private static databaseErrorProbability = 0.0;

  public static setLatencyInjection(delayMs: number): void {
    this.latencyDelayMs = delayMs;
    this.log.warn(`[ChaosTesting] Latency injection enabled: ${delayMs}ms`);
  }

  public static setDatabaseErrorProbability(prob: number): void {
    this.databaseErrorProbability = prob;
    this.log.warn(`[ChaosTesting] Database error injection enabled: probability=${prob}`);
  }

  public static async injectLatency(): Promise<void> {
    if (this.latencyDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyDelayMs));
    }
  }

  public static injectDatabaseError(): void {
    if (this.databaseErrorProbability > 0.0) {
      if (Math.random() < this.databaseErrorProbability) {
        this.log.error('[ChaosTesting] Injecting database simulated connection failure!');
        throw new Error('[Simulated Chaos] Database connection pool closed.');
      }
    }
  }

  public static clear(): void {
    this.latencyDelayMs = 0;
    this.databaseErrorProbability = 0.0;
    this.log.info('[ChaosTesting] Chaos injections cleared.');
  }
}

export default ChaosTestingHook;
