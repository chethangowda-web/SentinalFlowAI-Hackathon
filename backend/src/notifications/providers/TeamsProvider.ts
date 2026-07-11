import { INotificationProvider } from '../channels/NotificationProvider';
import { ProviderResponse } from '../types';
import { config } from '../../config/config';

export class TeamsProvider implements INotificationProvider {
  async send(recipients: string[], message: string, subject?: string): Promise<ProviderResponse> {
    const webhookUrl = recipients[0] || config.notifications.teamsWebhookUrl;
    if (!webhookUrl) {
      return { success: false, error: 'No MS Teams Webhook URL configured' };
    }

    try {
      const payload = {
        title: subject || 'SentinelFlow Alert',
        text: message,
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, error: `Teams returned status ${response.status}: ${text}` };
      }

      return { success: true, providerResponse: { status: response.status } };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown HTTP error';
      return { success: false, error: msg };
    }
  }
}
