import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { incidentAnalysisSchema, incidentAnalyzer } from '../agents/incident/incidentAnalyzer';

const AUTO_APPROVAL_THRESHOLD = 0.8;

const logStep = (incidentId: string, step: string) => {
  console.log(
    `[Incident ${incidentId}] ${step} started at ${new Date().toISOString()}`
  );
};

const analyzeLogsStep = createStep({
  id: 'analyze-logs',
  description: 'Call the Incident Analyzer Agent to analyze logs',
  inputSchema: z.object({
    incidentId: z.string(),
    incidentLogs: z.string(),
  }),
  outputSchema: z.object({
    incidentId: z.string(),
    analysis: incidentAnalysisSchema,
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('[IncidentWorkflow] Input data is required.');
    }
    logStep(inputData.incidentId, 'AnalyzeLogsStep');

    const agent = mastra?.getAgent('incidentAnalyzer') || incidentAnalyzer;
    if (!agent) {
      throw new Error('[IncidentWorkflow] Incident Analyzer Agent not found.');
    }

    const response = await agent.generate(inputData.incidentLogs);
    const analysis = response.object;
    if (!analysis) {
      throw new Error('[IncidentWorkflow] Agent response object is empty or failed validation.');
    }

    return {
      incidentId: inputData.incidentId,
      analysis,
    };
  },
});

const validateResponseStep = createStep({
  id: 'validate-response',
  description: 'Validate the structured JSON returned by the agent',
  inputSchema: z.object({
    incidentId: z.string(),
    analysis: incidentAnalysisSchema,
  }),
  outputSchema: z.object({
    incidentId: z.string(),
    analysis: incidentAnalysisSchema,
  }),
  execute: async ({ inputData }) => {
    if (!inputData || !inputData.analysis) {
      throw new Error('[IncidentWorkflow] Input data with analysis is required.');
    }
    logStep(inputData.incidentId, 'ValidateResponseStep');

    const { analysis } = inputData;

    if (analysis.confidence === undefined || typeof analysis.confidence !== 'number') {
      throw new Error('[IncidentWorkflow] Validation failed. Numeric confidence field is missing.');
    }

    if (!analysis.suggestedActions || !Array.isArray(analysis.suggestedActions)) {
      throw new Error('[IncidentWorkflow] Validation failed. SuggestedActions field is missing or invalid.');
    }

    return {
      incidentId: inputData.incidentId,
      analysis,
    };
  },
});

const evaluateConfidenceStep = createStep({
  id: 'evaluate-confidence',
  description: 'Evaluate the confidence score to route the incident',
  inputSchema: z.object({
    incidentId: z.string(),
    analysis: incidentAnalysisSchema,
  }),
  outputSchema: z.object({
    status: z.enum(['AUTO_APPROVED', 'HUMAN_APPROVAL_REQUIRED']),
    incidentId: z.string(),
    analysis: incidentAnalysisSchema,
  }),
  execute : async ({ inputData }) => {
    if (!inputData || !inputData.analysis) {
      throw new Error('[IncidentWorkflow] Input data with analysis is required.');
    }
    logStep(inputData.incidentId, 'EvaluateConfidenceStep');

    const isAutoApproved = inputData.analysis.confidence >= AUTO_APPROVAL_THRESHOLD;
    return {
      status: isAutoApproved ? 'AUTO_APPROVED' : 'HUMAN_APPROVAL_REQUIRED',
      incidentId: inputData.incidentId,
      analysis: inputData.analysis,
    };
  },
});

export const IncidentWorkflow = createWorkflow({
  id: 'IncidentWorkflow',
  inputSchema: z.object({
    incidentId: z.string(),
    incidentLogs: z.string(),
  }),
  outputSchema: z.object({
    status: z.enum(['AUTO_APPROVED', 'HUMAN_APPROVAL_REQUIRED']),
    incidentId: z.string(),
    analysis: incidentAnalysisSchema,
  }),
})
  .then(analyzeLogsStep)
  .then(validateResponseStep)
  .then(evaluateConfidenceStep);

IncidentWorkflow.commit();
