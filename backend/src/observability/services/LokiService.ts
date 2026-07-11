import { config } from '../../config/config';
import { LoggerService } from '../../mastra/services/loggerService';

export class LokiService {
  private log: LoggerService;
  private baseUrl: string;

  constructor() {
    this.log = new LoggerService('LokiService');
    this.baseUrl = config.observability.lokiUrl;
  }

  /**
   * Run LogQL query on Grafana Loki.
   */
  public async queryLogs(query: string, limit: number = 100): Promise<string[]> {
    try {
      const url = new URL('/loki/api/v1/query_range', this.baseUrl);
      url.searchParams.append('query', query);
      url.searchParams.append('limit', limit.toString());

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Loki query failed: ${response.statusText}`);
      }

      const data = await response.json();
      const streams = data.data?.result || [];
      const logs: string[] = [];

      for (const stream of streams) {
        if (stream.values && Array.isArray(stream.values)) {
          for (const val of stream.values) {
            if (Array.isArray(val) && val.length >= 2) {
              logs.push(val[1]);
            }
          }
        }
      }
      return logs;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.log.error(`Loki query error [${query}]: ${msg}`);
      return [];
    }
  }

  public async getLogsForService(serviceName: string, limit: number = 50): Promise<string[]> {
    const query = `{container="${serviceName}"}`;
    return this.queryLogs(query, limit);
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const url = new URL('/ready', this.baseUrl);
      const response = await fetch(url.toString());
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const lokiService = new LokiService();
export default lokiService;
