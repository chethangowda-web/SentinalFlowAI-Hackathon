// ============================================================
// LearningTypes.ts — Shared types for the learning pipeline
// ============================================================

export type FeedbackSignalType =
  | 'ACCEPTED_RECOMMENDATION'
  | 'REJECTED_RECOMMENDATION'
  | 'MANUAL_OVERRIDE'
  | 'CORRECT_ROOT_CAUSE'
  | 'WRONG_ROOT_CAUSE'
  | 'CORRECT_RUNBOOK'
  | 'FAILED_RUNBOOK';

export type LearningSessionStatus =
  | 'STARTED'
  | 'EXTRACTING'
  | 'SCORING'
  | 'OPTIMIZING'
  | 'UPDATING'
  | 'COMPLETED'
  | 'FAILED';

export interface LearningFeedback {
  id?: string;
  incidentId: string;
  decisionId?: string;
  sessionId?: string;
  engineer?: string;
  signalType: FeedbackSignalType;
  wasCorrect?: boolean;
  actualRootCause?: string;
  actualResolution?: string;
  comments?: string;
  satisfactionScore?: number; // 1–5
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

export interface LearningSession {
  id?: string;
  incidentId: string;
  status: LearningSessionStatus;
  phasesCompleted: string[];
  outcomeScore?: number;
  feedbackCount: number;
  knowledgeUpdates: number;
  promptVersionBump: boolean;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface IncidentKnowledgeArtifact {
  incidentId: string;
  timeline: string[];
  logSummary: string;
  metricAnomalies: string[];
  resolutionSteps: string[];
  lessonsLearned: string[];
  bestPractices: string[];
  rootCauseNarrative: string;
  fixSummary: string;
  extractedAt: Date;
}

export interface IncidentOutcomeScore {
  incidentId: string;
  resolutionTimeScore: number;
  customerImpactScore: number;
  businessImpactScore: number;
  rollbackSuccessScore: number;
  automationSuccessScore: number;
  engineerSatisfactionScore: number;
  compositeScore: number; // 0–100
  scoredAt: Date;
}

export interface ProcessedFeedbackSignal {
  incidentId: string;
  signalType: FeedbackSignalType;
  positiveReinforcement: boolean;
  weight: number; // 0.0–1.0 importance weight
  details: Record<string, unknown>;
}

export interface PromptVersionRecord {
  id?: string;
  promptName: string;
  version: number;
  content: string;
  variables: Record<string, string>;
  status: 'CANDIDATE' | 'ACTIVE' | 'DEPRECATED' | 'ROLLED_BACK';
  accuracyRate?: number;
  hallucinationRate?: number;
  avgLatencyMs?: number;
  sampleCount?: number;
  promotedFromVersion?: number;
  createdAt?: Date;
}

export interface RecommendationEvalReport {
  decisionId: string;
  incidentId: string;
  precisionScore: number;
  recallScore: number;
  accuracyScore: number;
  f1Score: number;
  confidenceAtCreation: number;
  confidenceDrift: number;
  recommendationSuccess: boolean;
  evaluationNotes: string;
}

export interface LearningStatistics {
  totalSessions: number;
  completedSessions: number;
  failedSessions: number;
  avgOutcomeScore: number;
  totalFeedbackSignals: number;
  totalKnowledgeUpdates: number;
  activePromptVersions: number;
  avgRecommendationAccuracy: number;
  avgHallucinationRate: number;
  mttrImprovementPct: number;
}
