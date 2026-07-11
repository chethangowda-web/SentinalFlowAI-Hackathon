import { LoggerService } from '../../mastra/services/loggerService';

export interface HallucinationResult {
  score: number;          // 0 (no hallucinations) → 1 (fully hallucinated)
  flaggedClaims: string[];
  groundedClaims: string[];
}

export class HallucinationDetector {
  private log = new LoggerService('HallucinationDetector');

  /**
   * Detect potentially ungrounded claims in LLM output by comparing against source evidence.
   * Production implementation would use an LLM-as-judge or NLI model.
   * This implementation uses keyword/semantic overlap heuristics as a fast baseline.
   */
  detect(llmOutput: string, sourceEvidence: string[]): HallucinationResult {
    const claims = this.splitIntoClaims(llmOutput);
    const flagged: string[] = [];
    const grounded: string[] = [];

    for (const claim of claims) {
      const claimWords = new Set(this.tokenize(claim));
      const isGrounded = sourceEvidence.some(evidence => {
        const evidenceWords = new Set(this.tokenize(evidence));
        const intersection = [...claimWords].filter(w => evidenceWords.has(w));
        const overlap = intersection.length / Math.max(claimWords.size, 1);
        return overlap >= 0.25; // 25% keyword overlap threshold
      });

      if (isGrounded) {
        grounded.push(claim);
      } else {
        flagged.push(claim);
      }
    }

    const score = claims.length > 0 ? flagged.length / claims.length : 0;
    this.log.debug(`[HallucinationDetector] score=${score.toFixed(3)}, flagged=${flagged.length}/${claims.length}`);

    return { score, flaggedClaims: flagged, groundedClaims: grounded };
  }

  private splitIntoClaims(text: string): string[] {
    return text
      .split(/[.!?]\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3); // ignore very short words
  }
}
