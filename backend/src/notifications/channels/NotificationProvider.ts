import { ProviderResponse } from '../types';

export interface INotificationProvider {
  send(recipients: string[], message: string, subject?: string): Promise<ProviderResponse>;
}
