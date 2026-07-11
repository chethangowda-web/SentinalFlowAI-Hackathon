import { WebSocketClient } from './WebSocketClient';
import { config } from '@/config';

export class RealtimeService {
  private client: WebSocketClient;

  constructor() {
    this.client = WebSocketClient.getInstance(config.api.wsUrl);
  }

  public connect() {
    this.client.connect();
  }

  public subscribeToIncidents(callback: (incident: any) => void) {
    return this.client.subscribe('incidents', callback);
  }

  public subscribeToAgentStatus(callback: (status: any) => void) {
    return this.client.subscribe('agents', callback);
  }

  public subscribeToConnectionStatus(callback: (status: any) => void) {
    return this.client.subscribe('status', callback);
  }

  public subscribeToDashboardUpdate(callback: (stats: any) => void) {
    return this.client.subscribe('dashboard:update', callback, 'dashboard');
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;
