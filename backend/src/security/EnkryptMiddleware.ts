import { enkryptService, EnkryptScanResult } from './EnkryptService';
import { LoggerService } from '../mastra/services/loggerService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EnkryptContext {
  incidentId: string;
  agentName: string;
  blocked: boolean;
  blockedReason?: string;
  scanResults: EnkryptScanResult[];
}

export type EnkryptGuardResult = {
  blocked: boolean;
  blockedReason?: string;
  scanResult: EnkryptScanResult;
  context: EnkryptContext;
};

// ---------------------------------------------------------------------------
// Enkrypt Middleware — Automatic Governance for all LLM calls
// ---------------------------------------------------------------------------

export class EnkryptMiddleware {
  private log: LoggerService;
  private contextMap: Map<string, EnkryptContext>;

  constructor() {
    this.log = new LoggerService('EnkryptMiddleware');
    this.contextMap = new Map();
  }

  /**
   * Initialize a governance context for an incident.
   * Must be called before any agent execution.
   */
  public initializeContext(incidentId: string, agentName: string): EnkryptContext {
    const context: EnkryptContext = {
      incidentId,
      agentName: agentName || 'unknown',
      blocked: false,
      scanResults: [],
    };
    this.contextMap.set(incidentId, context);
    return context;
  }

  /**
   * Get existing governance context for an incident.
   */
  public getContext(incidentId: string): EnkryptContext | undefined {
    return this.contextMap.get(incidentId);
  }

  /**
   * Guard a prompt before sending to LLM.
   * If blocked, the LLM call should be aborted.
   */
  public async guardPrompt(
    prompt: string,
    incidentId: string,
    agentName: string
  ): Promise<EnkryptGuardResult> {
    const context = this.getOrCreateContext(incidentId, agentName);

    if (context.blocked) {
      return {
        blocked: true,
        blockedReason: context.blockedReason || 'Pipeline blocked by previous Enkrypt scan',
        scanResult: context.scanResults[context.scanResults.length - 1],
        context,
      };
    }

    this.log.info(`[${agentName}] Scanning prompt via Enkrypt AI...`);
    const scanResult = await enkryptService.scanPrompt(prompt, incidentId, agentName);

    context.scanResults.push(scanResult);

    if (scanResult.blocked) {
      context.blocked = true;
      context.blockedReason = `Enkrypt blocked prompt: ${scanResult.violations.map(v => v.type).join(', ')}`;
      this.log.warn(`[${agentName}] Prompt BLOCKED by Enkrypt: ${context.blockedReason}`);
    }

    return { blocked: scanResult.blocked, blockedReason: context.blockedReason, scanResult, context };
  }

  /**
   * Guard a response after LLM returns.
   * If blocked, the response should not be used.
   */
  public async guardResponse(
    response: string,
    incidentId: string,
    agentName: string,
    originalPrompt?: string
  ): Promise<EnkryptGuardResult> {
    const context = this.getOrCreateContext(incidentId, agentName);

    if (context.blocked) {
      return {
        blocked: true,
        blockedReason: context.blockedReason || 'Pipeline blocked by previous Enkrypt scan',
        scanResult: context.scanResults[context.scanResults.length - 1],
        context,
      };
    }

    this.log.info(`[${agentName}] Scanning response via Enkrypt AI...`);
    const scanResult = await enkryptService.scanResponse(response, incidentId, agentName, originalPrompt);

    context.scanResults.push(scanResult);

    if (scanResult.blocked) {
      context.blocked = true;
      context.blockedReason = `Enkrypt blocked response: ${scanResult.violations.map(v => v.type).join(', ')}`;
      this.log.warn(`[${agentName}] Response BLOCKED by Enkrypt: ${context.blockedReason}`);
    }

    return { blocked: scanResult.blocked, blockedReason: context.blockedReason, scanResult, context };
  }

  /**
   * Wrap an LLM agent call with automatic Enkrypt scanning.
   * This is the main entry point for all agents.
   */
  public async wrapAgentCall<T>(
    incidentId: string,
    agentName: string,
    prompt: string,
    llmCall: () => Promise<T>,
    responseExtractor: (response: T) => string
  ): Promise<{
    result: T | null;
    promptScan: EnkryptScanResult;
    responseScan: EnkryptScanResult;
    blocked: boolean;
    blockedReason?: string;
  }> {
    // 1. Scan the prompt
    const promptGuard = await this.guardPrompt(prompt, incidentId, agentName);

    if (promptGuard.blocked) {
      return {
        result: null,
        promptScan: promptGuard.scanResult,
        responseScan: promptGuard.scanResult,
        blocked: true,
        blockedReason: promptGuard.blockedReason,
      };
    }

    // 2. Execute the LLM call
    let llmResponse: T;
    try {
      llmResponse = await llmCall();
    } catch (err) {
      this.log.error(`[${agentName}] LLM call failed after Enkrypt prompt approval: ${err}`);
      throw err;
    }

    // 3. Scan the response
    const responseText = responseExtractor(llmResponse);
    const responseGuard = await this.guardResponse(responseText, incidentId, agentName, prompt);

    if (responseGuard.blocked) {
      return {
        result: null,
        promptScan: promptGuard.scanResult,
        responseScan: responseGuard.scanResult,
        blocked: true,
        blockedReason: responseGuard.blockedReason,
      };
    }

    return {
      result: llmResponse,
      promptScan: promptGuard.scanResult,
      responseScan: responseGuard.scanResult,
      blocked: false,
    };
  }

  /**
   * Reset context for an incident (e.g., on pipeline completion).
   */
  public resetContext(incidentId: string): void {
    this.contextMap.delete(incidentId);
  }

  private getOrCreateContext(incidentId: string, agentName: string): EnkryptContext {
    let context = this.contextMap.get(incidentId);
    if (!context) {
      context = this.initializeContext(incidentId, agentName);
    }
    return context;
  }
}

export const enkryptMiddleware = new EnkryptMiddleware();
export default enkryptMiddleware;
