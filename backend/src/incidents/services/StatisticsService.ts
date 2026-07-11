import { dbClient, DatabaseClient } from '../../database/client/DatabaseClient';
import { IncidentStatus, Priority } from '../types/status';

export interface DashboardStats {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  averageResolutionTimeMs: number;
  averageAiConfidence: number;
  incidentsToday: number;
  incidentsThisWeek: number;
  incidentsThisMonth: number;
}

export class StatisticsService {
  private db: DatabaseClient;

  constructor() {
    this.db = dbClient;
  }

  public async getDashboardStats(): Promise<DashboardStats> {
    const text = `
      SELECT 
        COUNT(*) as total_incidents,
        COUNT(*) FILTER (WHERE status = 'OPEN') as open_incidents,
        COUNT(*) FILTER (WHERE status = 'RESOLVED' OR status = 'CLOSED') as resolved_incidents,
        COUNT(*) FILTER (WHERE priority = 'P1' OR severity = 'critical') as critical_incidents,
        AVG(confidence_score) as avg_confidence,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as incidents_today,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('week', CURRENT_DATE)) as incidents_this_week,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as incidents_this_month
      FROM incidents
      WHERE deleted_at IS NULL;
    `;

    const resRows = await this.db.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (r.resolved_at - i.created_at))) * 1000 as avg_resolution_time
      FROM incidents i
      JOIN incident_resolutions r ON i.incident_id = r.incident_id
      WHERE i.deleted_at IS NULL;
    `);

    const rows = await this.db.query(text);
    const row = rows[0] || {};
    const resRow = resRows[0] || {};

    return {
      totalIncidents: parseInt(row.total_incidents || '0', 10),
      openIncidents: parseInt(row.open_incidents || '0', 10),
      resolvedIncidents: parseInt(row.resolved_incidents || '0', 10),
      criticalIncidents: parseInt(row.critical_incidents || '0', 10),
      averageResolutionTimeMs: parseFloat(resRow.avg_resolution_time || '0'),
      averageAiConfidence: parseFloat(row.avg_confidence || '0'),
      incidentsToday: parseInt(row.incidents_today || '0', 10),
      incidentsThisWeek: parseInt(row.incidents_this_week || '0', 10),
      incidentsThisMonth: parseInt(row.incidents_this_month || '0', 10),
    };
  }

  public async getTrendStats(): Promise<any[]> {
    const text = `
      SELECT date_trunc('day', created_at) as day, COUNT(*) as count
      FROM incidents
      WHERE deleted_at IS NULL AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 ASC;
    `;
    return this.db.query(text);
  }

  public async getSeverityStats(): Promise<any[]> {
    const text = `
      SELECT severity, priority, COUNT(*) as count
      FROM incidents
      WHERE deleted_at IS NULL
      GROUP BY severity, priority;
    `;
    return this.db.query(text);
  }

  public async getServiceStats(): Promise<any[]> {
    const text = `
      SELECT service, COUNT(*) as count
      FROM incidents
      WHERE deleted_at IS NULL
      GROUP BY service
      ORDER BY count DESC
      LIMIT 10;
    `;
    return this.db.query(text);
  }
}

export const statisticsService = new StatisticsService();
