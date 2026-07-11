import type { IMastraLogger } from '@mastra/core/logger';

/**
 * Lightweight, reusable logger wrapper.
 *
 * - Delegates to the configured Mastra/Pino logger when available.
 * - Falls back to `console` when no logger is provided.
 * - Automatically prefixes every message with `[prefix]`.
 */
export class LoggerService {
  private logger: IMastraLogger | undefined;
  private prefix: string;

  constructor(prefix: string, logger?: IMastraLogger) {
    this.prefix = prefix;
    this.logger = logger;
  }

  public info(msg: string, ...args: any[]): void {
    const formatted = `[${this.prefix}] ${msg}`;
    if (this.logger) {
      this.logger.info(formatted, ...args);
    } else {
      console.info(formatted, ...args);
    }
  }

  public warn(msg: string, ...args: any[]): void {
    const formatted = `[${this.prefix}] ${msg}`;
    if (this.logger) {
      this.logger.warn(formatted, ...args);
    } else {
      console.warn(formatted, ...args);
    }
  }

  public error(msg: string, ...args: any[]): void {
    const formatted = `[${this.prefix}] ${msg}`;
    if (this.logger) {
      this.logger.error(formatted, ...args);
    } else {
      console.error(formatted, ...args);
    }
  }

  public debug(msg: string, ...args: any[]): void {
    const formatted = `[${this.prefix}] ${msg}`;
    if (this.logger) {
      this.logger.debug(formatted, ...args);
    } else {
      console.debug(formatted, ...args);
    }
  }
}
