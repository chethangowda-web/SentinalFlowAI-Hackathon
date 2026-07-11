import { cacheManager } from '../cache/CacheManager';

export class PerformanceService {
  private metrics: Map<string, { value: number; type: 'counter' | 'gauge' | 'histogram'; label?: string }> = new Map();
  private dbConnections = 0;
  private wsConnections = 0;

  constructor() {
    this.setGauge('platform_up', 1);
  }

  public incrementCounter(name: string, value = 1): void {
    const current = this.metrics.get(name) || { value: 0, type: 'counter' };
    this.metrics.set(name, { value: current.value + value, type: 'counter' });
  }

  public setGauge(name: string, value: number, label?: string): void {
    this.metrics.set(name, { value, type: 'gauge', label });
  }

  public observeHistogram(name: string, value: number): void {
    const current = this.metrics.get(name) || { value: 0, type: 'histogram' };
    const avg = current.value === 0 ? value : (current.value + value) / 2;
    this.metrics.set(name, { value: avg, type: 'histogram' });
  }

  public setDbConnections(count: number): void {
    this.dbConnections = count;
    this.setGauge('db_connections_active', count);
  }

  public setWsConnections(count: number): void {
    this.wsConnections = count;
    this.setGauge('ws_connections_active', count);
  }

  public getPrometheusMetrics(): string {
    let output = '';

    const cacheStats = cacheManager.getMetrics();
    this.setGauge('cache_hit_ratio', cacheStats.hitRatio);
    this.setGauge('cache_keys_total', cacheStats.keysCount);

    for (const [name, metric] of this.metrics.entries()) {
      output += `# HELP ${name} SRE Platform performance metric\n`;
      output += `# TYPE ${name} ${metric.type}\n`;
      if (metric.label) {
        output += `${name}{${metric.label}} ${metric.value}\n\n`;
      } else {
        output += `${name} ${metric.value}\n\n`;
      }
    }

    return output;
  }
}

export const performanceService = new PerformanceService();
export default performanceService;
