import { INotificationProvider } from '../channels/NotificationProvider';
import { ProviderResponse } from '../types';
import { config } from '../../config/config';

export class SlackProvider implements INotificationProvider {
  async send(recipients: string[], message: string, subject?: string): Promise<ProviderResponse> {
    const webhookUrl = recipients[0] || config.notifications.slackWebhookUrl;
    if (!webhookUrl) {
      return { success: false, error: 'No Slack Webhook URL configured' };
    }

    try {
      const payload = {
        text: subject ? `*${subject}*\n${message}` : message,
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, error: `Slack returned status ${response.status}: ${text}` };
      }

      return { success: true, providerResponse: { status: response.status } };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown HTTP error';
      return { success: false, error: msg };
    }
  }
}
