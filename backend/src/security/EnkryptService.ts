import { config } from '../config/config';
import { LoggerService } from '../mastra/services/loggerService';
import { randomUUID, createHash } from 'crypto';
import { dbClient } from '../database/client/DatabaseClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EnkryptScanResult {
  id: string;
  incidentId: string;
  agentName: string;
  scanType: 'PROMPT_SCAN' | 'RESPONSE_SCAN' | 'RUNBOOK_EVAL' | 'DECISION_AUDIT' | 'FINAL_APPROVAL';
  promptHash?: string;
  responseHash?: string;
  riskScore: number;
  trustScore: number;
  complianceScore: number;
  safetyScore: number;
  threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  violations: EnkryptViolation[];
  policyBreakdown: Record<string, any>;
  detectorDetails: Record<string, any>;
  approved: boolean;
  blocked: boolean;
  latencyMs: number;
  rawResponse: Record<string, any>;
}

export interface EnkryptViolation {
  type: string;
  severity: string;
  detail: string;
  detector: string;
  complianceMapping?: Record<string, string[]>;
}

export interface EnkryptRiskEvaluation {
  riskScore: number;
  trustScore: number;
  threatLevel: string;
  policyViolations: EnkryptViolation[];
  recommendedAction: 'approve' | 'block' | 'review';
  requiresHumanApproval: boolean;
}

export interface EnkryptRunbookEvaluation {
  safe: boolean;
  riskScore: number;
  dangerousCommands: string[];
  requiresHumanApproval: boolean;
  recommendedAction: 'approve' | 'block' | 'review';
}

export interface EnkryptGuardrailConfig {
  injectionAttack: boolean;
  toxicity: boolean;
  nsfw: boolean;
  pii: boolean;
  bias: boolean;
  policyViolation: boolean;
  keywordDetector: boolean;
  spongeAttack: boolean;
}

// ---------------------------------------------------------------------------
// Dangerous command patterns for self-healing safeguard
// ---------------------------------------------------------------------------

const DESTRUCTIVE_PATTERNS: RegExp[] = [
  /\bkubectl\s+delete\b/i,
  /\bterraform\s+destroy\b/i,
  /\bhelm\s+uninstall\b/i,
  /\brm\s+-rf\b/i,
  /\bdrop\s+database\b/i,
  /\bdrop\s+table\b/i,
  /\bdelete\s+namespace\b/i,
  /\bdelete\s+cluster\b/i,
  /\bformat\s+disk\b/i,
  /\breboot\b/i,
  /\bshutdown\b/i,
  /\bTRUNCATE\s+TABLE\b/i,
  /\bALTER\s+TABLE.*DROP\b/i,
  /\bDELETE\s+FROM\b.*\bWHERE\s+1=1\b/i,
];

// ---------------------------------------------------------------------------
// Enkrypt Service — Official API Integration
// ---------------------------------------------------------------------------

export class EnkryptService {
  private log: LoggerService;
  private baseUrl: string;
  private apiKey: string;
  private guardrailName: string;
  private timeout: number;

  constructor() {
    this.log = new LoggerService('EnkryptService');
    this.baseUrl = config.security.enkryptBaseUrl;
    this.apiKey = config.security.enkryptApiKey;
    this.guardrailName = config.security.enkryptGuardrailName;
    this.timeout = config.security.enkryptTimeoutMs;
  }

  public isEnabled(): boolean {
    return this.apiKey !== 'sk-placeholder' && this.apiKey.length > 0;
  }

  // -----------------------------------------------------------------------
  // scanPrompt — Scan LLM input for prompt injection, jailbreak, PII, etc.
  // -----------------------------------------------------------------------

  public async scanPrompt(
    text: string,
    incidentId: string,
    agentName: string
  ): Promise<EnkryptScanResult> {
    const startTime = Date.now();
    const id = randomUUID();
    const promptHash = this.hashText(text);

    try {
      if (!this.isEnabled()) {
        return this.createFallbackResult(id, incidentId, agentName, 'PROMPT_SCAN', startTime, promptHash);
      }

      const result = await this.callGuardrailsApi(text, 'prompt');

      const scanResult = this.buildScanResult(
        id, incidentId, agentName, 'PROMPT_SCAN',
        result, startTime, promptHash, undefined
      );

      await this.persistGovernanceLog(scanResult);
      return scanResult;
    } catch (error) {
      this.log.error(`Enkrypt prompt scan failed: ${error}`);
      const result = this.createFallbackResult(id, incidentId, agentName, 'PROMPT_SCAN', startTime, promptHash);
      await this.persistGovernanceLog(result);
      return result;
    }
  }

  // -----------------------------------------------------------------------
  // scanResponse — Scan LLM output for toxicity, PII, secrets, unsafe commands
  // -----------------------------------------------------------------------

  public async scanResponse(
    text: string,
    incidentId: string,
    agentName: string,
    originalPrompt?: string
  ): Promise<EnkryptScanResult> {
    const startTime = Date.now();
    const id = randomUUID();
    const responseHash = this.hashText(text);
    const promptHash = originalPrompt ? this.hashText(originalPrompt) : undefined;

    try {
      if (!this.isEnabled()) {
        return this.createFallbackResult(id, incidentId, agentName, 'RESPONSE_SCAN', startTime, undefined, responseHash);
      }

      const result = await this.callGuardrailsApi(text, 'response');

      const scanResult = this.buildScanResult(
        id, incidentId, agentName, 'RESPONSE_SCAN',
        result, startTime, promptHash, responseHash
      );

      // Additional static checks for dangerous commands in responses
      this.enrichWithStaticChecks(scanResult, text);

      await this.persistGovernanceLog(scanResult);
      return scanResult;
    } catch (error) {
      this.log.error(`Enkrypt response scan failed: ${error}`);
      const result = this.createFallbackResult(id, incidentId, agentName, 'RESPONSE_SCAN', startTime, promptHash, responseHash);
      this.enrichWithStaticChecks(result, text);
      await this.persistGovernanceLog(result);
      return result;
    }
  }

  // -----------------------------------------------------------------------
  // evaluateRisk — Compute overall risk score for a decision
  // -----------------------------------------------------------------------

  public async evaluateRisk(
    context: string,
    incidentId: string,
    agentName: string
  ): Promise<EnkryptRiskEvaluation> {
    const scan = await this.scanResponse(context, incidentId, agentName);

    const riskScore = scan.riskScore;
    const trustScore = scan.trustScore;
    const threatLevel = scan.threatLevel;

    let recommendedAction: 'approve' | 'block' | 'review';
    let requiresHumanApproval = false;

    if (scan.blocked || riskScore >= 80) {
      recommendedAction = 'block';
      requiresHumanApproval = false;
    } else if (riskScore >= 50 || threatLevel === 'HIGH' || threatLevel === 'CRITICAL') {
      recommendedAction = 'review';
      requiresHumanApproval = true;
    } else {
      recommendedAction = 'approve';
      requiresHumanApproval = riskScore >= 30;
    }

    return {
      riskScore,
      trustScore,
      threatLevel,
      policyViolations: scan.violations,
      recommendedAction,
      requiresHumanApproval,
    };
  }

  // -----------------------------------------------------------------------
  // evaluateRunbook — Scan runbook commands for destructive operations
  // -----------------------------------------------------------------------

  public async evaluateRunbook(
    commands: string[],
    incidentId: string
  ): Promise<EnkryptRunbookEvaluation> {
    const allCommands = commands.join('\n');
    const scanResult = await this.scanResponse(allCommands, incidentId, 'runbook-evaluator');

    const dangerousCommands: string[] = [];
    for (const cmd of commands) {
      for (const pattern of DESTRUCTIVE_PATTERNS) {
        if (pattern.test(cmd)) {
          dangerousCommands.push(cmd);
          break;
        }
      }
    }

    const riskScore = Math.max(scanResult.riskScore, dangerousCommands.length > 0 ? 70 : 0);
    const safe = riskScore < 50 && dangerousCommands.length === 0;
    const requiresHumanApproval = dangerousCommands.length > 0 || riskScore >= 50;

    let recommendedAction: 'approve' | 'block' | 'review';
    if (dangerousCommands.length > 0 || riskScore >= 80) {
      recommendedAction = 'block';
    } else if (riskScore >= 50) {
      recommendedAction = 'review';
    } else {
      recommendedAction = 'approve';
    }

    return {
      safe,
      riskScore,
      dangerousCommands,
      requiresHumanApproval,
      recommendedAction,
    };
  }

  // -----------------------------------------------------------------------
  // auditDecision — Log final governance decision
  // -----------------------------------------------------------------------

  public async auditDecision(params: {
    incidentId: string;
    agentName: string;
    decision: string;
    riskScore: number;
    trustScore: number;
    complianceScore: number;
    threatLevel: string;
    violations: EnkryptViolation[];
    approved: boolean;
    blocked: boolean;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const id = randomUUID();
    const latencyMs = 0;

    const scanResult: EnkryptScanResult = {
      id,
      incidentId: params.incidentId,
      agentName: params.agentName,
      scanType: 'DECISION_AUDIT',
      riskScore: params.riskScore,
      trustScore: params.trustScore,
      complianceScore: params.complianceScore,
      safetyScore: 100 - params.riskScore,
      threatLevel: params.threatLevel as any,
      violations: params.violations,
      policyBreakdown: {},
      detectorDetails: {},
      approved: params.approved,
      blocked: params.blocked,
      latencyMs,
      rawResponse: params.metadata || {},
    };

    await this.persistGovernanceLog(scanResult);
  }

  // -----------------------------------------------------------------------
  // Private: Call Enkrypt AI Guardrails API
  // -----------------------------------------------------------------------

  private async callGuardrailsApi(
    text: string,
    mode: 'prompt' | 'response'
  ): Promise<Record<string, any>> {
    const url = `${this.baseUrl}/guardrails/detect`;

    const payload = {
      text,
      detectors: {
        injection_attack: { enabled: true },
        toxicity: { enabled: true },
        nsfw: { enabled: true },
        pii: {
          enabled: true,
          entities: ['pii', 'secrets', 'ip_address', 'url'],
        },
        keyword_detector: {
          enabled: true,
          banned_keywords: [
            'confidential', 'internal-only', 'top-secret',
            'rm -rf', 'kubectl delete', 'terraform destroy',
            'helm uninstall', 'drop database',
          ],
        },
        policy_violation: { enabled: true },
        bias: { enabled: true },
        sponge_attack: { enabled: true },
      },
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: this.apiKey,
    };

    // If a guardrail name is configured, use the guardrail endpoint instead
    if (this.guardrailName) {
      const response = await this.executeApiCall(
        `${this.baseUrl}/guardrails/guardrail/detect`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'X-Enkrypt-Guardrail': this.guardrailName,
            'X-Enkrypt-Mode': mode,
          },
          body: JSON.stringify({ text }),
        }
      );
      return response;
    }

    const response = await this.executeApiCall(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return response;
  }

  private async executeApiCall(
    url: string,
    requestInit: RequestInit
  ): Promise<Record<string, any>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...requestInit,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Enkrypt API returned ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // -----------------------------------------------------------------------
  // Private: Build scan result from API response
  // -----------------------------------------------------------------------

  private buildScanResult(
    id: string,
    incidentId: string,
    agentName: string,
    scanType: EnkryptScanResult['scanType'],
    apiResponse: Record<string, any>,
    startTime: number,
    promptHash?: string,
    responseHash?: string
  ): EnkryptScanResult {
    const latencyMs = Date.now() - startTime;
    const summary = apiResponse.summary || {};
    const details = apiResponse.details || {};

    const violations = this.extractViolations(summary, details);

    const injectionAttack = summary.injection_attack || 0;
    const toxicityDetected = Array.isArray(summary.toxicity) ? summary.toxicity.length > 0 : (summary.toxicity || 0);
    const piiDetected = summary.pii || 0;
    const nsfwDetected = summary.nsfw || 0;
    const policyViolation = summary.policy_violation || 0;
    const biasDetected = summary.bias || 0;
    const keywordDetected = summary.keyword_detected || 0;
    const spongeAttack = summary.sponge_attack || 0;

    const totalViolations = (
      (injectionAttack ? 1 : 0) +
      (toxicityDetected ? 1 : 0) +
      (piiDetected ? 1 : 0) +
      (nsfwDetected ? 1 : 0) +
      (policyViolation ? 1 : 0) +
      (biasDetected ? 1 : 0) +
      (keywordDetected ? 1 : 0) +
      (spongeAttack ? 1 : 0)
    );

    const riskScore = Math.round(Math.min(100, totalViolations * 12.5));
    const trustScore = Math.round(Math.max(0, 100 - riskScore));
    const complianceScore = Math.round(Math.max(0, 100 - (policyViolation ? 40 : 0) - (piiDetected ? 30 : 0)));
    const safetyScore = Math.round(Math.max(0, 100 - riskScore));

    let threatLevel: EnkryptScanResult['threatLevel'] = 'NONE';
    if (riskScore >= 75) threatLevel = 'CRITICAL';
    else if (riskScore >= 55) threatLevel = 'HIGH';
    else if (riskScore >= 35) threatLevel = 'MEDIUM';
    else if (riskScore >= 15) threatLevel = 'LOW';

    const blocked = injectionAttack >= 0.9 || policyViolation || nsfwDetected || riskScore >= 80;
    const approved = !blocked && riskScore < 60;

    return {
      id,
      incidentId,
      agentName,
      scanType,
      promptHash,
      responseHash,
      riskScore,
      trustScore,
      complianceScore,
      safetyScore,
      threatLevel,
      violations,
      policyBreakdown: summary,
      detectorDetails: details,
      approved,
      blocked,
      latencyMs,
      rawResponse: apiResponse,
    };
  }

  // -----------------------------------------------------------------------
  // Private: Extract structured violations from API response
  // -----------------------------------------------------------------------

  private extractViolations(
    summary: Record<string, any>,
    details: Record<string, any>
  ): EnkryptViolation[] {
    const violations: EnkryptViolation[] = [];

    if (summary.injection_attack) {
      const injectionDetail = details.injection_attack || {};
      violations.push({
        type: 'prompt_injection',
        severity: summary.injection_attack > 0.8 ? 'CRITICAL' : 'HIGH',
        detail: injectionDetail.most_unsafe_content || 'Prompt injection attack detected',
        detector: 'injection_attack',
        complianceMapping: injectionDetail.compliance_mapping,
      });
    }

    if (summary.nsfw) {
      violations.push({
        type: 'nsfw_content',
        severity: 'HIGH',
        detail: 'NSFW content detected in text',
        detector: 'nsfw',
      });
    }

    const toxicityArray = Array.isArray(summary.toxicity) ? summary.toxicity : [];
    if (toxicityArray.length > 0) {
      violations.push({
        type: 'toxic_content',
        severity: toxicityArray.includes('severe_toxicity') ? 'CRITICAL' : 'MEDIUM',
        detail: `Toxic content detected: ${toxicityArray.join(', ')}`,
        detector: 'toxicity',
      });
    }

    if (summary.pii) {
      const piiDetail = details.pii || {};
      violations.push({
        type: 'pii_leakage',
        severity: 'HIGH',
        detail: `PII/Secrets detected: ${JSON.stringify(piiDetail)}`,
        detector: 'pii',
      });
    }

    if (summary.policy_violation) {
      const policyDetail = details.policy_violation?.policy_violation || {};
      violations.push({
        type: 'policy_violation',
        severity: 'HIGH',
        detail: policyDetail.explanation || 'Policy violation detected',
        detector: 'policy_violation',
      });
    }

    if (summary.bias) {
      violations.push({
        type: 'bias_detected',
        severity: 'MEDIUM',
        detail: 'Bias detected in content',
        detector: 'bias',
      });
    }

    if (summary.keyword_detected) {
      const keywordDetail = details.keyword_detector || {};
      violations.push({
        type: 'banned_keyword',
        severity: 'MEDIUM',
        detail: `Banned keywords detected: ${(keywordDetail.detected_keywords || []).join(', ')}`,
        detector: 'keyword_detector',
      });
    }

    if (summary.sponge_attack) {
      violations.push({
        type: 'sponge_attack',
        severity: 'MEDIUM',
        detail: 'Sponge/economic denial of service attack detected',
        detector: 'sponge_attack',
      });
    }

    return violations;
  }

  // -----------------------------------------------------------------------
  // Private: Enrich scan with static checks (dangerous commands)
  // -----------------------------------------------------------------------

  private enrichWithStaticChecks(scanResult: EnkryptScanResult, text: string): void {
    for (const pattern of DESTRUCTIVE_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        scanResult.violations.push({
          type: 'destructive_command',
          severity: 'CRITICAL',
          detail: `Dangerous command detected: "${match[0]}"`,
          detector: 'static_analysis',
        });
        scanResult.riskScore = Math.min(100, scanResult.riskScore + 30);
        scanResult.threatLevel = 'CRITICAL';
        scanResult.blocked = true;
        scanResult.approved = false;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Private: Create fallback result when API is unavailable
  // -----------------------------------------------------------------------

  private createFallbackResult(
    id: string,
    incidentId: string,
    agentName: string,
    scanType: EnkryptScanResult['scanType'],
    startTime: number,
    promptHash?: string,
    responseHash?: string
  ): EnkryptScanResult {
    const latencyMs = Date.now() - startTime;
    return {
      id,
      incidentId,
      agentName,
      scanType,
      promptHash,
      responseHash,
      riskScore: 0,
      trustScore: 100,
      complianceScore: 100,
      safetyScore: 100,
      threatLevel: 'NONE',
      violations: [],
      policyBreakdown: {},
      detectorDetails: {},
      approved: true,
      blocked: false,
      latencyMs,
      rawResponse: {},
    };
  }

  // -----------------------------------------------------------------------
  // Private: Hash text for audit trails
  // -----------------------------------------------------------------------

  private hashText(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  // -----------------------------------------------------------------------
  // Private: Persist governance decision to PostgreSQL
  // -----------------------------------------------------------------------

  private async persistGovernanceLog(scanResult: EnkryptScanResult): Promise<void> {
    try {
      await dbClient.query(
        `INSERT INTO ai_governance_logs
          (id, incident_id, agent_name, scan_type, prompt_hash, response_hash,
           risk_score, trust_score, compliance_score, safety_score,
           threat_level, violations, policy_breakdown, detector_details,
           approved, blocked, latency_ms, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())`,
        [
          scanResult.id,
          scanResult.incidentId,
          scanResult.agentName,
          scanResult.scanType,
          scanResult.promptHash || null,
          scanResult.responseHash || null,
          scanResult.riskScore,
          scanResult.trustScore,
          scanResult.complianceScore,
          scanResult.safetyScore,
          scanResult.threatLevel,
          JSON.stringify(scanResult.violations),
          JSON.stringify(scanResult.policyBreakdown),
          JSON.stringify(scanResult.detectorDetails),
          scanResult.approved,
          scanResult.blocked,
          scanResult.latencyMs,
          JSON.stringify({}),
        ]
      );

      // Upsert governance summary
      await dbClient.query(
        `INSERT INTO ai_governance_summary
          (incident_id, total_scans, blocked_count, approved_count,
           highest_threat, lowest_trust_score, lowest_compliance,
           overall_decision, last_scan_at, updated_at)
         VALUES ($1, 1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (incident_id) DO UPDATE SET
           total_scans = ai_governance_summary.total_scans + 1,
           blocked_count = ai_governance_summary.blocked_count + $2,
           approved_count = ai_governance_summary.approved_count + $3,
           highest_threat = GREATEST(ai_governance_summary.highest_threat::text, $4)::text::VARCHAR,
           lowest_trust_score = LEAST(ai_governance_summary.lowest_trust_score, $5),
           lowest_compliance = LEAST(ai_governance_summary.lowest_compliance, $6),
           last_scan_at = NOW(),
           updated_at = NOW()`,
        [
          scanResult.incidentId,
          scanResult.blocked ? 1 : 0,
          scanResult.approved ? 1 : 0,
          scanResult.threatLevel,
          scanResult.trustScore,
          scanResult.complianceScore,
          scanResult.blocked ? 'BLOCKED' : scanResult.riskScore >= 50 ? 'REVIEW_REQUIRED' : 'APPROVED',
        ]
      );
    } catch (dbErr) {
      this.log.error(`Failed to persist governance log: ${dbErr}`);
    }
  }
}

export const enkryptService = new EnkryptService();
export default enkryptService;
