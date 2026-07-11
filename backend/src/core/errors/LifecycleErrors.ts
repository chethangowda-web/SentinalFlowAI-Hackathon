import { BaseApplicationError } from './BaseApplicationError';

export class ValidationError extends BaseApplicationError {
  public readonly code = 'VALIDATION_ERROR';
  public readonly retryable = false;
  public readonly httpStatus = 400;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

export class StateTransitionError extends BaseApplicationError {
  public readonly code = 'INVALID_STATE_TRANSITION';
  public readonly retryable = false;
  public readonly httpStatus = 400;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

export class NotFoundError extends BaseApplicationError {
  public readonly code = 'NOT_FOUND';
  public readonly retryable = false;
  public readonly httpStatus = 404;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}
