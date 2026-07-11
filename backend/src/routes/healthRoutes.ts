import { registerApiRoute } from '@mastra/core/server';
import { dbClient } from '../database/client/DatabaseClient';
import { prometheusService } from '../observability/services/PrometheusService';
import { healthService } from '../platform/health/HealthService';

export const healthRoute = registerApiRoute('/health', {
  method: 'GET',
  handler: async (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() }, 200);
  }
});

export const dependenciesHealthRoute = registerApiRoute('/health/dependencies', {
  method: 'GET',
  handler: async (c) => {
    const deps = {
      postgres: 'unknown',
      prometheus: 'unknown'
    };

    try {
      await dbClient.query('SELECT 1');
      deps.postgres = 'ok';
    } catch {
      deps.postgres = 'error';
    }

    try {
      const promOk = await prometheusService.checkHealth();
      deps.prometheus = promOk ? 'ok' : 'error';
    } catch {
      deps.prometheus = 'error';
    }

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
