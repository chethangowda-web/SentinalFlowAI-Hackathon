export abstract class BaseApplicationError extends Error {
  public abstract readonly code: string;
  public abstract readonly retryable: boolean;
  public abstract readonly httpStatus: number;

  public readonly timestamp: string;
  public readonly details?: unknown;
  public readonly cause?: unknown;

  constructor(message: string, details?: unknown, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    this.details = details;
    this.cause = cause;
    
    // Capture the stack trace properly for custom errors
    Error.captureStackTrace(this, this.constructor);
  }
}
