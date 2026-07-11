import { INotificationProvider } from '../channels/NotificationProvider';
import { ProviderResponse } from '../types';
import { LoggerService } from '../../mastra/services/loggerService';

export class ConsoleProvider implements INotificationProvider {
  private log = new LoggerService('ConsoleProvider');

  async send(recipients: string[], message: string, subject?: string): Promise<ProviderResponse> {
    const formatted = `[Console Notification] Subject: ${subject || 'None'} | Recipients: ${recipients.join(', ')} | Message: ${message}`;
    this.log.info(formatted);
    return {
      success: true,
      providerResponse: { loggedAt: new Date().toISOString() },
    };
  }
}
