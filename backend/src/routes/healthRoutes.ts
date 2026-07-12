import { registerApiRoute } from '@mastra/core/server';
import { dbClient } from '../database/client/DatabaseClient';
import { prometheusService } from '../observability/services/PrometheusService';
import { healthService } from '../platform/health/HealthService';
import { redisClient } from '../database/client/RedisClient';
import { qdrantMemory } from '../mastra/services/qdrantMemory';

export const healthRoute = registerApiRoute('/health', {
  method: 'GET',
  handler: async (c) => {
    return c.json({ status: 'ok', service: 'SentinelFlow API', timestamp: new Date().toISOString() }, 200);
  }
});

export const dependenciesHealthRoute = registerApiRoute('/health/dependencies', {
  method: 'GET',
  handler: async (c) => {
    const deps = {
      postgres: 'unknown',
      redis: 'unknown',
      qdrant: 'unknown',
      rabbitmq: 'unknown',
      prometheus: 'unknown',
      groq: 'unknown',
    };

    try {
      await dbClient.query('SELECT 1');
      deps.postgres = 'ok';
    } catch {
      deps.postgres = 'error';
    }

    try {
      const redisOk = await redisClient.healthCheck();
      deps.redis = redisOk ? 'ok' : 'error';
    } catch {
      deps.redis = 'error';
    }

    try {
      const qOk = await qdrantMemory.healthCheck();
      deps.qdrant = qOk ? 'ok' : 'error';
    } catch {
      deps.qdrant = 'error';
    }

    // RabbitMQ check - will be implemented when queue client is available
    deps.rabbitmq = 'ok';

    try {
      const promOk = await prometheusService.checkHealth();
      deps.prometheus = promOk ? 'ok' : 'error';
    } catch {
      deps.prometheus = 'error';
    }

    // Groq check - config based
    const hasGroqKey = !!process.env.GROQ_API_KEY;
    deps.groq = hasGroqKey ? 'ok' : 'error';

    const isHealthy = Object.values(deps).every(v => v === 'ok');

    return c.json({
      status: isHealthy ? 'ok' : 'degraded',
      dependencies: deps,
      timestamp: new Date().toISOString()
    }, isHealthy ? 200 : 503);
  }
});

export const metricsRoute = registerApiRoute('/health/metrics', {
  method: 'GET',
  handler: async (c) => {
    return c.json({
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }, 200);
  }
});

export const readyHealthRoute = registerApiRoute('/health/ready', {
  method: 'GET',
  handler: async (c) => {
    const report = await healthService.checkReadiness();
    return c.json(report, 200);
  }
});

export const readyRoute = registerApiRoute('/ready', {
  method: 'GET',
  handler: async (c) => {
    const report = await healthService.checkReadiness();
    const statusCode = report.status === 'healthy' ? 200 : 503;
    return c.json({ status: report.status, ...report }, statusCode);
  }
});

export const liveRoute = registerApiRoute('/live', {
  method: 'GET',
  handler: async (c) => {
    const alive = await healthService.checkLiveness();
    return c.json({ status: alive ? 'alive' : 'dead' }, alive ? 200 : 503);
  }
});