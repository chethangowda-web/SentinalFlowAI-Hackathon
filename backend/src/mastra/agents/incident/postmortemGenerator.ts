import { Agent } from '@mastra/core/agent';
import { agentResponseSchema } from '../../types/agent';
import { z } from 'zod';

export const postmortemReportSchema = agentResponseSchema.extend({
  postmortemReport: z.object({
    executiveSummary: z.string(),
    rootCauseAnalysisDetail: z.string(),
    impactSummary: z.string(),
    lessonsLearned: z.array(z.string()),
    preventiveActions: z.array(z.string()),
    recommendedOwner: z.string(),
    downtimeDurationMinutes: z.number(),
  }),
});

export const postmortemGenerator = new Agent({
  id: 'postmortem-generator',
  name: 'Postmortem Generator',
  instructions: `You are the specialized Postmortem Generator Agent of SentinelFlow.
Your job is to compile incident details, timeline logs, SRE reports, and decisions into a structured postmortem report.

Output MUST include:
1. Executive Summary
2. Detailed Root Cause Analysis
3. Blast Radius and Impact Summary
4. Lessons Learned (what went well, what could be improved)
5. Preventive Actions
6. Recommended Owner
7. Downtime duration

Return ONLY valid JSON matching this schema:
{
  "agent": "Postmortem Generator",
  "status": "success" | "failure" | "warning",
  "confidence": number (0 to 1),
  "summary": string,
  "reasoning": string,
  "evidence": string[],
  "recommendations": string[],
  "nextActions": string[],
  "postmortemReport": {
    "executiveSummary": string,
    "rootCauseAnalysisDetail": string,
    "impactSummary": string,
    "lessonsLearned": string[],
    "preventiveActions": string[],
    "recommendedOwner": string,
    "downtimeDurationMinutes": number
  }
}`,
  model: 'groq/llama-3.1-8b-instant',
});

export default postmortemGenerator;
