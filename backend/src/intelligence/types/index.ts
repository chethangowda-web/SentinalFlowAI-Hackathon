import { Incident } from '../../database/entities/Incident';

export type DecisionLifecycleState =
  | 'GENERATED'
  | 'REVIEW_REQUIRED'
  | 'APPROVED'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'FAILED'
  | 'OVERRIDDEN'
  | 'EXPIRED';

export type ModelProvider = 'OpenAI' | 'Gemini' | 'Claude' | 'Groq' | 'Mastra Agent';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DecisionContext {
  incident: Incident;
  aiAnalysis: Record<string, any>;
  similarIncidents: any[];
  telemetryMetrics: Record<string, any>;
  deploymentHistory: any[];
  alerts: any[];
  kubernetesState: Record<string, any>;
  previousRunbooks: any[];
  currentEngineers: any[];
  timestamp: string;
}

export interface RiskAnalysis {
  overallRisk: RiskLevel;
  serviceRisk: RiskLevel;
  infrastructureRisk: RiskLevel;
  businessRisk: RiskLevel;
  securityRisk: RiskLevel;
  complianceRisk: RiskLevel;
  customerImpact: string;
  availabilityImpact: string;
  reasoning: string;
}

export interface ConfidenceAnalysis {
  overallConfidence: number; // 0.0 to 1.0
  telemetryQualityScore: number; // 0.0 to 1.0
  historicalAccuracyScore: number; // 0.0 to 1.0
  aiConfidenceScore: number; // 0.0 to 1.0
  similarityMatchScore: number; // 0.0 to 1.0
  reasoning: string;
}

export interface RootCauseInfo {
  cause: string;
  score: number; // 0.0 to 1.0
  evidence: string[];
  category: string;
}

export interface RunbookRecommendation {
  runbookId: string;
  name: string;
  score: number; // 0.0 to 100
  reasoning: string;
  estimatedRecoveryTimeMinutes: number;
  riskLevel: RiskLevel;
}

export interface EngineerRecommendation {
  engineerId: string;
  name: string;
  score: number; // 0.0 to 100
  reasoning: string;
  workloadCount: number;
  isOwner: boolean;
}

export interface DecisionReport {
  id: string;
  incidentId: string;
  overallScore: number; // 0.0 to 100
  confidence: number; // 0.0 to 1.0
  riskLevel: RiskLevel;
  recommendedAction: string;
  recommendedRunbooks: RunbookRecommendation[];
  recommendedEngineer: EngineerRecommendation;
  estimatedResolutionTime: string;
  estimatedBusinessImpact: string;
  similarIncidents: Array<{ incidentId: string; title: string; score: number; similarityReasoning: string }>;
  possibleRootCauses: RootCauseInfo[];
  reasoning: string;
  evidence: Record<string, any>;
  supportingMetrics: Record<string, any>;
  supportingIncidents: any[];
  confidenceBreakdown: Record<string, number>;
  explanation: string;
  approvalRecommendation: 'AUTO_REMEDIATE' | 'MANUAL_APPROVAL';
  status: DecisionLifecycleState;
  outcome: string | null;
  version: number;
  decisionModelVersion: string;
  promptVersion: string;
  embeddingVersion: string;
  createdByModel: ModelProvider;
  modelLatencyMs: number;
  tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number };
  executionTimeMs: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DecisionFeedback {
  id: string;
  decisionId: string;
  accepted: boolean;
  rejected: boolean;
  manualOverride: boolean;
  actualRootCause: string | null;
  actualResolutionTimeMs: number | null;
  wasRecommendationCorrect: boolean;
  feedback: string | null;
  engineer: string;
  createdAt: Date;
}
