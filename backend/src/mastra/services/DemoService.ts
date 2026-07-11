import { telemetryIngestor } from './telemetryIngestor';
import { LoggerService } from './loggerService';
import { correlationEngine } from '../../observability/pipeline/CorrelationEngine';

export class DemoService {
  private log = new LoggerService('DemoService');
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  public startDemoMode() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.log.info('[DemoService] Starting Demo Mode. Simulating production traffic...');

    // Seed immediate traffic events so the dashboard has data right away
    this.simulateNormalTraffic();
    this.simulateCpuSpike();
    this.simulateDatabaseLatency();

    this.interval = setInterval(() => {
      this.generateTraffic();
    }, 15000); // Generate events every 15 seconds
  }

  public stopDemoMode() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    this.log.info('[DemoService] Stopped Demo Mode.');
  }

  private async ingestAndProcess(payload: any) {
    try {
      const fullPayload = {
        source: 'simulated-agent',
        host: 'demo-host-01',
        application: 'sentinelflow-demo',
        region: 'us-west-2',
        environment: 'production',
        ...payload
      };
      const validated = await telemetryIngestor.ingest(fullPayload);
      await correlationEngine.processTelemetry(validated);
    } catch (err: any) {
      this.log.error(`[DemoService] Ingestion processing failed: ${err.message}`);
    }
  }

  private generateTraffic() {
    const scenarios = [
      this.simulateCpuSpike.bind(this),
      this.simulateMemoryLeak.bind(this),
      this.simulateDatabaseLatency.bind(this),
      this.simulateNetworkTimeout.bind(this),
      this.simulateNormalTraffic.bind(this),
    ];

    // Pick a random scenario, weighted towards normal traffic
    const isIncident = Math.random() < 0.2; // 20% chance of incident
    
    if (isIncident) {
      const incidentScenarios = scenarios.slice(0, 4);
      const randomIncident = incidentScenarios[Math.floor(Math.random() * incidentScenarios.length)];
      randomIncident();
    } else {
      this.simulateNormalTraffic();
    }
  }

  private simulateNormalTraffic() {
    this.ingestAndProcess({
      service: 'api-gateway',
      environment: 'production',
      metrics: { cpu: Math.random() * 30 + 10, memory: Math.random() * 40 + 20 },
      logs: 'INFO: Request processed successfully\nINFO: Cache hit for user profile',
    });
  }

  private simulateCpuSpike() {
    this.log.warn('[DemoService] Simulating CPU Spike');
    this.ingestAndProcess({
      service: 'auth-service',
      environment: 'production',
      metrics: { cpu: 98.5, memory: 50 },
      logs: 'WARN: CPU utilization exceeded 95%\nERROR: Failed to acquire lock for JWT signing\nERROR: Timeout while checking rate limit Redis cache',
    });
  }

  private simulateMemoryLeak() {
    this.log.warn('[DemoService] Simulating Memory Leak');
    this.ingestAndProcess({
      service: 'payment-processor',
      environment: 'production',
      metrics: { cpu: 40, memory: 96.2 },
      logs: 'WARN: Heap memory usage critically high\nERROR: OutOfMemoryError thrown in garbage collector\nFATAL: Container restarting due to OOMKilled',
    });
  }

  private simulateDatabaseLatency() {
    this.log.warn('[DemoService] Simulating Database Latency');
    this.ingestAndProcess({
      service: 'inventory-db',
      environment: 'production',
      metrics: { cpu: 60, memory: 70, db_latency_ms: 4500 },
      logs: 'WARN: Query execution time exceeded 4000ms\nERROR: Connection pool exhausted\nERROR: Client timeout waiting for connection',
    });
  }

  private simulateNetworkTimeout() {
    this.log.warn('[DemoService] Simulating Network Timeout');
    this.ingestAndProcess({
      service: 'third-party-integration',
      environment: 'production',
      metrics: { cpu: 20, memory: 30, error_rate: 0.15 },
      logs: 'WARN: Upstream API returned 504 Gateway Timeout\nERROR: Retries exhausted for request ID xyz',
    });
  }
}

export const demoService = new DemoService();
export default demoService;
