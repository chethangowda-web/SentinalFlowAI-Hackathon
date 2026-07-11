import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { prometheusService } from '../../observability/services/PrometheusService';
import { grafanaService } from '../../observability/services/GrafanaService';

export const queryPrometheusTool = createTool({
  id: 'queryPrometheus',
  description: 'Query Prometheus with a PromQL expression',
  inputSchema: z.object({
    query: z.string().describe('The PromQL expression to query'),
  }),
  outputSchema: z.any(),
  execute: async ({ query }) => {
    try {
      const results = await prometheusService.runQuery(query);
      return { results };
    } catch (err: any) {
      return { error: `Failed to query Prometheus: ${err?.message || String(err)}` };
    }
  },
});

export const queryGrafanaTool = createTool({
  id: 'queryGrafana',
  description: 'Get details or search dashboards in Grafana',
  inputSchema: z.object({
    query: z.string().optional().describe('Search query for Grafana dashboards'),
    dashboardUid: z.string().optional().describe('The UID of the dashboard to retrieve'),
  }),
  outputSchema: z.any(),
  execute: async ({ query, dashboardUid }) => {
    try {
      if (dashboardUid) {
        const dashboard = await grafanaService.getDashboardByUid(dashboardUid);
        return { dashboard };
      }
      const dashboards = await grafanaService.getDashboards();
      if (query) {
        const filtered = dashboards.filter((d: any) =>
          (d.title && d.title.toLowerCase().includes(query.toLowerCase())) ||
          (d.uri && d.uri.toLowerCase().includes(query.toLowerCase()))
        );
        return { dashboards: filtered };
      }
      return { dashboards };
    } catch (err: any) {
      return { error: `Failed to query Grafana: ${err?.message || String(err)}` };
    }
  },
});
