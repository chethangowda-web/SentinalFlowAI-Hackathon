import { z } from 'zod';

export const agentResponseSchema = z.object({
  agent: z.string().describe('The name or identifier of the agent'),
  status: z.string().describe('The execution or compliance status, e.g. success, failure, warning, approved, needs_review, blocked'),
  confidence: z.number().min(0).max(1).describe('The confidence score of the agent\'s findings'),
  summary: z.string().describe('A high-level summary of the findings'),
  reasoning: z.string().describe('The step-by-step reasoning behind the findings'),
  evidence: z.array(z.string()).describe('The list of logs, metrics, or traces that substantiate the findings'),
  recommendations: z.array(z.string()).describe('Suggested remediation or mitigation actions'),
  nextActions: z.array(z.string()).describe('Recommended next steps for the operator or system'),
  sources: z.array(z.string()).optional().describe('List of tools, data sources or APIs queried by the agent'),
});

export type AgentResponse = z.infer<typeof agentResponseSchema>;
