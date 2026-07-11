import { registerApiRoute } from '@mastra/core/server';
import { healthService } from '../health/HealthService';
import { performanceService } from '../performance/PerformanceService';
import { APIInfrastructure } from './apiInfrastructure';

export const platformLiveRoute = registerApiRoute('/health/live', {
  method: 'GET',
  handler: async (c) => {
    const isLive = await healthService.checkLiveness();
    return c.json({ status: isLive ? 'ok' : 'unhealthy' }, isLive ? 200 : 503);
  },
});

export const platformReadyRoute = registerApiRoute('/health/ready', {
  method: 'GET',
  handler: async (c) => {
    const readiness = await healthService.checkReadiness();
    return c.json(
      { status: readiness.isReady ? 'ok' : 'degraded', dependencies: readiness.details },
      readiness.isReady ? 200 : 503
    );
  },
});

export const platformStartupRoute = registerApiRoute('/health/startup', {
  method: 'GET',
  handler: async (c) => {
    return c.json({ status: 'ok' }, 200);
  },
});

export const platformMetricsRoute = registerApiRoute('/metrics', {
  method: 'GET',
  handler: async (c) => {
    const metrics = performanceService.getPrometheusMetrics();
    c.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return c.text(metrics, 200);
  },
});

export const platformSwaggerRoute = registerApiRoute('/custom/v1/swagger.json', {
  method: 'GET',
  handler: async (c) => {
    const spec = APIInfrastructure.getOpenAPISpec();
    return c.json(spec, 200);
  },
});
