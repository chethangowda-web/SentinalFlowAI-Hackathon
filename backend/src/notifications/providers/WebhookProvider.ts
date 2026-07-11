import { INotificationProvider } from '../channels/NotificationProvider';
import { ProviderResponse } from '../types';
import { config } from '../../config/config';

export class WebhookProvider implements INotificationProvider {
  async send(recipients: string[], message: string, subject?: string): Promise<ProviderResponse> {
    const url = recipients[0] || config.notifications.webhookUrl;
    if (!url) {
      return { success: false, error: 'No webhook URL configured' };
    }

    try {
      const payload = {
        event: subject || 'SentinelFlow Alert',
        message: message,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, error: `Webhook returned status ${response.status}: ${text}` };
      }

      return { success: true, providerResponse: { status: response.status } };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown HTTP error';
      return { success: false, error: msg };
    }
  }
}
