import { registerApiRoute } from '@mastra/core/server';
import { requireAuth } from '../auth/middleware/requireAuth';
import { z } from 'zod';
import { notificationRepository } from '../database/repositories/NotificationRepository';
import { notificationQueue } from '../notifications/NotificationQueue';
import { eventPublisher } from '../events/EventPublisher';

export const getNotificationsRoute = registerApiRoute('/custom/v1/notifications', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    return c.json({
      queueDepth: notificationQueue.metrics.queued - (notificationQueue.metrics.delivered + notificationQueue.metrics.failed),
      metrics: {
        totalQueued: notificationQueue.metrics.queued,
        totalSent: notificationQueue.metrics.sent,
        totalFailed: notificationQueue.metrics.failed,
        totalRetried: notificationQueue.metrics.retried,
        totalDelivered: notificationQueue.metrics.delivered,
        averageLatencyMs: notificationQueue.metrics.latencyCount > 0 
          ? Math.round(notificationQueue.metrics.latencySum / notificationQueue.metrics.latencyCount)
          : 0,
      }
    }, 200);
  }
});

export const getNotificationByIdRoute = registerApiRoute('/custom/v1/notifications/:id', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    const id = c.req.param('id');
    const notif = await notificationRepository.getNotificationById(id);
    if (!notif) {
      return c.json({ error: 'Notification not found' }, 404);
    }
    return c.json(notif, 200);
  }
});

export const getNotificationHistoryRoute = registerApiRoute('/custom/v1/notifications/history', {
  method: 'GET',
  middleware: [requireAuth as any],
  handler: async (c) => {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    const history = await notificationRepository.listNotificationHistory(limit, offset);
    return c.json({ history }, 200);
  }
});

export const testNotificationRoute = registerApiRoute('/custom/v1/notifications/test', {
  method: 'POST',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const schema = z.object({
        target: z.string().min(1, 'Target required'),
        message: z.string().min(1, 'Message required'),
        urgency: z.enum(['LOW', 'HIGH', 'CRITICAL']).default('LOW'),
      });
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      }

      // Publish mock test alert
      eventPublisher.publish(
        'NotificationRequested',
        'test-notification',
        'Notification',
        parsed.data,
        { correlationId: 'test-correlation-id' }
      );

      return c.json({ success: true, message: 'Test notification event published' }, 202);
    } catch {
      return c.json({ error: 'Failed to process test request' }, 500);
    }
  }
});

export const updatePreferencesRoute = registerApiRoute('/custom/v1/notifications/preferences', {
  method: 'PATCH',
  middleware: [requireAuth as any],
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const schema = z.object({
        userId: z.string().min(1, 'userId required'),
        slackWebhook: z.string().optional(),
        teamsWebhook: z.string().optional(),
        discordWebhook: z.string().optional(),
        email: z.string().email().optional(),
        webhookUrl: z.string().optional(),
        preferences: z.record(z.string(), z.any()).default({}),
      });
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      }

      await notificationRepository.savePreference(parsed.data);
      return c.json({ success: true, message: 'Preferences updated' }, 200);
    } catch {
      return c.json({ error: 'Failed to update preferences' }, 500);
    }
  }
});
