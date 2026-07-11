import { config } from '../../config/config';
import { LoggerService } from '../../mastra/services/loggerService';

export interface JaegerSpan {
  traceID: string;
  spanID: string;
  operationName: string;
  startTime: number;
  duration: number; // in microseconds
  tags: Array<{ key: string; value: any }>;
}

export interface JaegerTrace {
  traceID: string;
  spans: JaegerSpan[];
}

export class JaegerService {
  private log: LoggerService;
  private baseUrl: string;

  constructor() {
    this.log = new LoggerService('JaegerService');
    this.baseUrl = config.observability.jaegerUrl;
  }

  /**
   * Fetch traces for a service from Jaeger.
   */
  public async getTraces(serviceName: string, limit: number = 20): Promise<JaegerTrace[]> {
    try {
      const url = new URL('/api/traces', this.baseUrl);
      url.searchParams.append('service', serviceName);
      url.searchParams.append('limit', limit.toString());

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Jaeger API failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.log.error(`Jaeger traces fetch error [${serviceName}]: ${msg}`);
      return [];
    }
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const url = new URL('/', this.baseUrl);
      const response = await fetch(url.toString());
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const jaegerService = new JaegerService();
export default jaegerService;
