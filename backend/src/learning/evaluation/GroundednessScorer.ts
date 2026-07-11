import { LoggerService } from '../../mastra/services/loggerService';

export interface GroundednessResult {
  score: number;  // 0 (ungrounded) → 1 (fully grounded)
  coveredFacts: string[];
  missingFacts: string[];
}

export class GroundednessScorer {
  private log = new LoggerService('GroundednessScorer');

  /**
   * Score how well an LLM response is anchored to a set of context facts.
   * Measures fact coverage: what percentage of source facts appear in the response.
   */
  score(response: string, contextFacts: string[]): GroundednessResult {
    if (contextFacts.length === 0) {
      return { score: 1.0, coveredFacts: [], missingFacts: [] };
    }

    const responseLower = response.toLowerCase();
    const covered: string[] = [];
    const missing: string[]  = [];

    for (const fact of contextFacts) {
      // A fact is "covered" if at least 40% of its significant tokens appear in the response
      const factTokens = this.tokenize(fact);
      const coveredTokens = factTokens.filter(t => responseLower.includes(t));
      const coverage = coveredTokens.length / Math.max(factTokens.length, 1);

      if (coverage >= 0.40) {
        covered.push(fact);
      } else {
        missing.push(fact);
      }
    }

    const groundednessScore = covered.length / contextFacts.length;
    this.log.debug(`[GroundednessScorer] score=${groundednessScore.toFixed(3)}, covered=${covered.length}/${contextFacts.length}`);

    return {
      score:        groundednessScore,
      coveredFacts: covered,
      missingFacts: missing
    };
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
  }
}
