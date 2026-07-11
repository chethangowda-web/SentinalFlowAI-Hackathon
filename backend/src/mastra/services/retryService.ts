// ---------------------------------------------------------------------------
// RetryService — generic exponential backoff with jitter and timeout
// ---------------------------------------------------------------------------

export interface RetryOptions {
  /** Maximum number of retry attempts (not counting the initial attempt). Default: 3 */
  maxRetries?: number;
  /** Initial delay in milliseconds before the first retry. Default: 200 */
  initialDelayMs?: number;
  /** Maximum delay cap in milliseconds. Default: 10_000 */
  maxDelayMs?: number;
  /** Per-attempt timeout in milliseconds. 0 means no timeout. Default: 0 */
  timeoutMs?: number;
  /** Whether to add random jitter to the computed delay. Default: true */
  jitter?: boolean;
  /**
   * Predicate that determines whether an error is transient and therefore
   * eligible for a retry. By default, all errors are considered transient.
   */
  isTransient?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 200,
  maxDelayMs: 10_000,
  timeoutMs: 0,
  jitter: true,
  isTransient: () => true,
};

/**
 * Canonical transient-error predicate for HTTP/network errors.
 * Treats rate-limit (429) and server-side (5xx) errors as retryable.
 */
export function isTransientHttpError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    // Network-level transient conditions
    if (
      msg.includes('econnreset') ||
      msg.includes('econnrefused') ||
      msg.includes('etimedout') ||
      msg.includes('socket hang up') ||
      msg.includes('network') ||
      msg.includes('timeout')
    ) {
      return true;
    }
    // HTTP status codes embedded in error messages (common in REST clients)
    const statusMatch = msg.match(/\b(429|502|503|504)\b/);
    if (statusMatch) {
      return true;
    }
  }
  return false;
}

function computeDelay(attempt: number, options: Required<RetryOptions>): number {
  // Exponential backoff: initialDelayMs * 2^attempt
  const exponential = options.initialDelayMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, options.maxDelayMs);
  if (!options.jitter) {
    return capped;
  }
  // Full jitter: random value in [0, capped]
  return Math.random() * capped;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (timeoutMs <= 0) {
    return promise;
  }
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[RetryService] Attempt timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export class RetryService {
  private readonly options: Required<RetryOptions>;

  constructor(options: RetryOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Execute `fn` with automatic retries according to the configured policy.
   *
   * @param fn   Async operation to execute.
   * @param label  Human-readable label used in log output.
   */
  public async execute<T>(fn: () => Promise<T>, label = 'operation'): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await withTimeout(fn(), this.options.timeoutMs);
      } catch (error) {
        lastError = error;
        const isLast = attempt === this.options.maxRetries;
        const transient = this.options.isTransient(error);

        if (!transient) {
          console.error(
            `[RetryService] Non-transient error on ${label} (attempt ${attempt + 1}). Aborting retries.`,
            error instanceof Error ? error.message : error,
          );
          throw error;
        }

        if (isLast) {
          break;
        }

        const delay = computeDelay(attempt, this.options);
        console.warn(
          `[RetryService] Transient error on ${label} (attempt ${attempt + 1}/${this.options.maxRetries + 1}). Retrying in ${Math.round(delay)}ms.`,
          error instanceof Error ? error.message : error,
        );
        await sleep(delay);
      }
    }

    // All attempts exhausted.
    if (lastError instanceof Error) {
      throw new Error(
        `[RetryService] All ${this.options.maxRetries + 1} attempts failed for ${label}: ${lastError.message}`,
      );
    }
    throw new Error(`[RetryService] All ${this.options.maxRetries + 1} attempts failed for ${label}.`);
  }
}
