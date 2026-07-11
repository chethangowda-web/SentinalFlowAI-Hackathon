import { config } from '../../config/config';

export class LogRedactor {
  private static sensitiveKeys = ['password', 'token', 'secret', 'apikey', 'auth', 'key', 'database_url', 'jwt'];

  public static redact(data: any): any {
    if (!data) return data;
    if (typeof data !== 'object') {
      if (typeof data === 'string') {
        return this.redactString(data);
      }
      return data;
    }

    const copy = Array.isArray(data) ? [...data] : { ...data };
    for (const key of Object.keys(copy)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = this.sensitiveKeys.some((k) => lowerKey.includes(k));
      if (isSensitive) {
        copy[key] = '[REDACTED]';
      } else if (typeof copy[key] === 'object') {
        copy[key] = this.redact(copy[key]);
      }
    }
    return copy;
  }

  private static redactString(str: string): string {
    let result = str;
    // Redact postgres://user:password@host format
    result = result.replace(/(postgres:\/\/)([^:]+):([^@]+)(@)/g, '$1$2:[REDACTED]$4');
    return result;
  }
}

export class StructuredLogger {
  private contextName: string;

  constructor(contextName: string) {
    this.contextName = contextName;
  }

  private log(level: string, message: string, metadata?: any): void {
    const redactedMetadata = LogRedactor.redact(metadata);
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      context: this.contextName,
      message,
      metadata: redactedMetadata,
    };
    console.log(JSON.stringify(payload));
  }

  public info(message: string, metadata?: any): void {
    this.log('INFO', message, metadata);
  }

  public warn(message: string, metadata?: any): void {
    this.log('WARN', message, metadata);
  }

  public error(message: string, metadata?: any): void {
    this.log('ERROR', message, metadata);
  }

  public debug(message: string, metadata?: any): void {
    if (config.logging.level === 'debug' || config.logging.level === 'trace') {
      this.log('DEBUG', message, metadata);
    }
  }
}

export default StructuredLogger;
