import { dbClient } from '../../database/client/DatabaseClient';
import { qdrantMemory } from '../../mastra/services/qdrantMemory';
import { webSocketGateway } from '../../realtime/gateway/WebSocketGateway';
import { config } from '../../config/config';

export interface ReadinessReport {
  status: 'healthy' | 'degraded';
  database: 'healthy' | 'unhealthy';
  eventBus: 'healthy' | 'unhealthy';
  groq: 'healthy' | 'unhealthy';
  qdrant: 'healthy' | 'offline';
  websocket: 'healthy' | 'unhealthy';
  notifications: 'healthy' | 'unhealthy';
}

export class HealthService {
  public async checkLiveness(): Promise<boolean> {
    return true;
  }

  public async checkReadiness(): Promise<ReadinessReport> {
    const report: ReadinessReport = {
      status: 'healthy',
      database: 'unhealthy',
      eventBus: 'healthy', // EventBus compiles and initializes synchronously
      groq: 'healthy',
      qdrant: 'offline',
      websocket: 'unhealthy',
      notifications: 'healthy', // Always active once templating resolves
    };

    // 1. Postgres Database Health
    try {
      const dbOk = await dbClient.healthCheck();
      report.database = dbOk ? 'healthy' : 'unhealthy';
    } catch {
      report.database = 'unhealthy';
    }

    // 2. Groq Config Verification
    const hasGroqKey = !!config.groq.apiKey;
    report.groq = hasGroqKey ? 'healthy' : 'unhealthy';

    // 3. Qdrant Connection Check
    try {
      await qdrantMemory.ensureInitialized();
      const qOk = await qdrantMemory.healthCheck();
      report.qdrant = (qOk && !qdrantMemory.isDegraded()) ? 'healthy' : 'offline';
    } catch {
      report.qdrant = 'offline';
    }

    // 4. WebSocket Gateway Check
    try {
      const wsOk = webSocketGateway.isHealthy();
      report.websocket = wsOk ? 'healthy' : 'unhealthy';
    } catch {
      report.websocket = 'unhealthy';
    }

    // Overall Status Computation
    const criticalFailures = [
      report.database === 'unhealthy',
      report.groq === 'unhealthy',
      report.websocket === 'unhealthy'
    ];

    if (criticalFailures.some(Boolean) || report.qdrant === 'offline') {
      report.status = 'degraded';
    } else {
      report.status = 'healthy';
    }

    return report;
  }
}

export const healthService = new HealthService();
export default healthService;
