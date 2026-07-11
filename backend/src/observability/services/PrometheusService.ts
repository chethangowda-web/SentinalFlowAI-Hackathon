import { config } from '../../config/config';
import { LoggerService } from '../../mastra/services/loggerService';

export class PrometheusService {
  private log: LoggerService;
  private baseUrl: string;

  constructor() {
    this.log = new LoggerService('PrometheusService');
    this.baseUrl = config.observability.prometheusUrl;
  }

  private async query(promql: string): Promise<any> {
    try {
      const url = new URL('/custom/v1/query', this.baseUrl);
      url.searchParams.append('query', promql);
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Prometheus query failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data?.result || [];
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.log.error(`Prometheus query error [${promql}]: ${msg}`);
      return [];
    }
  }

  public async runQuery(promql: string): Promise<any> {
    return this.query(promql);
  }

  public async getCpuMetrics(serviceName: string): Promise<any> {
    const query = `rate(container_cpu_usage_seconds_total{container="${serviceName}"}[5m])`;
    return this.query(query);
  }

  public async getMemoryMetrics(serviceName: string): Promise<any> {
    const query = `container_memory_working_set_bytes{container="${serviceName}"}`;
    return this.query(query);
  }

  public async getPodRestarts(serviceName: string): Promise<any> {
    const query = `kube_pod_container_status_restarts_total{container="${serviceName}"}`;
    return this.query(query);
  }

  public async getNodeHealth(): Promise<any> {
    const query = `up{job="kubernetes-nodes"}`;
    return this.query(query);
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const url = new URL('/-/healthy', this.baseUrl);
      const response = await fetch(url.toString());
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const prometheusService = new PrometheusService();
