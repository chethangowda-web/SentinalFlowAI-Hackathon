import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { runbookRepository } from '../../database/repositories/RunbookRepository';

export const searchRunbooksTool = createTool({
  id: 'searchRunbooks',
  description: 'Search runbooks database by query (name or description matching) and/or service name',
  inputSchema: z.object({
    query: z.string().optional().describe('Search term to match against runbook name or description'),
    service: z.string().optional().describe('Filter runbooks by service name'),
  }),
  outputSchema: z.any(),
  execute: async ({ query, service }) => {
    try {
      const runbooks = await runbookRepository.listRunbooks();
      const filtered = runbooks.filter(rb => {
        let match = true;
        if (service && rb.service.toLowerCase() !== service.toLowerCase()) {
          match = false;
        }
        if (query) {
          const q = query.toLowerCase();
          const nameMatch = rb.name.toLowerCase().includes(q);
          const descMatch = rb.description ? rb.description.toLowerCase().includes(q) : false;
          if (!nameMatch && !descMatch) {
            match = false;
          }
        }
        return match;
      });
      return { runbooks: filtered };
    } catch (err: any) {
      return { error: `Failed to search runbooks: ${err?.message || String(err)}` };
    }
  },
});
