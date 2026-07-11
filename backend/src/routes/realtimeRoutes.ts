import { registerApiRoute } from '@mastra/core/server';
import { requireAuth } from '../auth/middleware/requireAuth';
import { connectionRepository } from '../realtime/services/ConnectionRepository';
import { metricsCollector } from '../realtime/services/MetricsCollector';
import { config } from '../config/config';

export const realtimeConnectionsRoute = registerApiRoute('/custom/v1/realtime/connections', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const connections = connectionRepository.getAll().map((conn) => ({
        connectionId: conn.connectionId,
        sessionId: conn.sessionId,
        userId: conn.userId,
        organizationId: conn.organizationId,
        role: conn.role,
        connectedAt: conn.connectedAt.toISOString(),
        lastSeen: conn.lastSeen.toISOString(),
        subscriptions: Array.from(conn.subscriptions),
      }));
      return c.json({ success: true, data: connections }, 200);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: msg }, 500);
    }
  },
});

export const realtimeStatisticsRoute = registerApiRoute('/custom/v1/realtime/statistics', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const stats = metricsCollector.getStats();
      return c.json({ success: true, data: stats }, 200);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: msg }, 500);
    }
  },
});

export const realtimeRoomsRoute = registerApiRoute('/custom/v1/realtime/rooms', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const rooms = connectionRepository.getActiveRooms();
      return c.json({ success: true, data: rooms }, 200);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: msg }, 500);
    }
  },
});

export const realtimeMetricsRoute = registerApiRoute('/custom/v1/realtime/metrics', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const metricsText = metricsCollector.getPrometheusMetrics();
      c.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      return c.text(metricsText, 200);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return c.text(`error: ${msg}`, 500);
    }
  },
});

export const realtimeHealthRoute = registerApiRoute('/custom/v1/realtime/health', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const stats = metricsCollector.getStats();
      return c.json({
        success: true,
        data: {
          status: 'ok',
          gatewayHealth: 'healthy',
          heartbeatIntervalMs: config.websocket.heartbeatInterval,
          connectionCount: stats.activeConnections,
          broadcastLatencyMs: stats.averageBroadcastLatencyMs,
          heartbeatLatencyMs: stats.averageHeartbeatLatencyMs,
          memoryUsage: process.memoryUsage(),
        },
      }, 200);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: msg }, 500);
    }
  },
});
