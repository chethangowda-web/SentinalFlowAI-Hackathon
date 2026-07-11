import { config } from '../../config/config';
import { LoggerService } from '../../mastra/services/loggerService';

export class GrafanaService {
  private log: LoggerService;
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    this.log = new LoggerService('GrafanaService');
    this.baseUrl = config.observability.grafanaUrl;
    this.apiKey = config.observability.grafanaApiKey;
  }

  private async request(path: string): Promise<any> {
    try {
      const url = new URL(path, this.baseUrl);
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };
      
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      
      const response = await fetch(url.toString(), { headers });
      if (!response.ok) {
        throw new Error(`Grafana API failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      this.log.error(`Grafana API error [${path}]:`, error);
      return null;
    }
  }

  public async getDashboards(): Promise<any[]> {
    const data = await this.request('/api/search?type=dash-db');
    return Array.isArray(data) ? data : [];
  }

  public async getDashboardByUid(uid: string): Promise<any> {
    return this.request(`/api/dashboards/uid/${uid}`);
  }

  public getSnapshotLink(panelId: number, dashboardUid: string, from: string, to: string): string {
    return `${this.baseUrl}/d/${dashboardUid}?viewPanel=${panelId}&from=${from}&to=${to}`;
  }
}

export const grafanaService = new GrafanaService();
