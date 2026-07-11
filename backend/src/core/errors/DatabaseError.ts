import { BaseApplicationError } from './BaseApplicationError';

export class DatabaseError extends BaseApplicationError {
  public readonly code = 'DATABASE_ERROR';
  public readonly retryable: boolean;
  public readonly httpStatus = 500;

  constructor(message: string, details?: unknown, cause?: unknown, retryable: boolean = false) {
    super(message, details, cause);
    this.retryable = retryable;
  }
}
