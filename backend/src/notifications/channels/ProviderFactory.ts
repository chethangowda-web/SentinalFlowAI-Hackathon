import { INotificationProvider } from './NotificationProvider';
import { ConsoleProvider } from '../providers/ConsoleProvider';
import { SlackProvider } from '../providers/SlackProvider';
import { TeamsProvider } from '../providers/TeamsProvider';
import { DiscordProvider } from '../providers/DiscordProvider';
import { EmailProvider } from '../providers/EmailProvider';
import { WebhookProvider } from '../providers/WebhookProvider';

export class ProviderFactory {
  private static providers: Record<string, INotificationProvider> = {
    console: new ConsoleProvider(),
    slack: new SlackProvider(),
    teams: new TeamsProvider(),
    discord: new DiscordProvider(),
    email: new EmailProvider(),
    webhook: new WebhookProvider(),
  };

  public static getProvider(channel: string): INotificationProvider {
    const provider = this.providers[channel.toLowerCase()];
    if (!provider) {
      // Fallback to console provider rather than throwing, to maintain stability
      return this.providers.console;
    }
    return provider;
  }
}
