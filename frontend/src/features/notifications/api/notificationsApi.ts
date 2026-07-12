import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export interface NotificationMetrics {
  totalQueued: number;
  totalSent: number;
  totalFailed: number;
  totalRetried: number;
  totalDelivered: number;
  averageLatencyMs: number;
}

export interface Notification {
  id: string;
  message: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  timestamp: string;
  read: boolean;
}

export interface BackendNotificationResponse {
  queueDepth: number;
  metrics: NotificationMetrics;
}

export const notificationsApi = {
  list: async (): Promise<Notification[]> => {
    const res = await apiClient.get<BackendNotificationResponse>(endpoints.notifications.list);
    const metrics = res.data.metrics;
    const notifications: Notification[] = [
      {
        id: 'metrics-summary',
        message: `${metrics.totalDelivered} notifications delivered, ${metrics.totalFailed} failed`,
        severity: metrics.totalFailed > 0 ? 'ERROR' : 'SUCCESS',
        timestamp: new Date().toISOString(),
        read: false,
      },
      {
        id: 'queue-depth',
        message: `Queue depth: ${res.data.queueDepth} pending notifications`,
        severity: res.data.queueDepth > 10 ? 'WARN' : 'INFO',
        timestamp: new Date().toISOString(),
        read: false,
      },
    ];
    return notifications;
  },
};

export default notificationsApi;
