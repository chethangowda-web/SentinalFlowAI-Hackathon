import { DecisionContext, ConfidenceAnalysis } from '../types';

export class ConfidenceEngine {
  public calculate(context: DecisionContext): ConfidenceAnalysis {
    const aiConfidenceScore = context.incident.confidenceScore || 0.8;

    // Check telemetry logs length
    const rawLogs = context.incident.rawLogs || '';
    const telemetryQualityScore = Math.min(1.0, Math.max(0.2, rawLogs.length / 5000));

    // Similarity match score based on Qdrant results
    let similarityMatchScore = 0.0;
    if (context.similarIncidents && context.similarIncidents.length > 0) {
      // average of top 3 similarities
      const topScores = context.similarIncidents.slice(0, 3).map((s) => s.score || 0);
      similarityMatchScore = topScores.reduce((a, b) => a + b, 0) / topScores.length;
    }

    // Historical accuracy score (can default to 0.85 in base version)
    const historicalAccuracyScore = 0.85;

    // Calculate weighted average
    const overallConfidence = parseFloat(
      (
        aiConfidenceScore * 0.4 +
        telemetryQualityScore * 0.2 +
        similarityMatchScore * 0.2 +
        historicalAccuracyScore * 0.2
      ).toFixed(2)
    );

    const reasoning = `Overall confidence is ${Math.round(overallConfidence * 100)}%, derived from AI confidence (${Math.round(
      aiConfidenceScore * 100
    )}%), telemetry richness (${Math.round(telemetryQualityScore * 100)}%), historical SRE accuracy (${Math.round(
      historicalAccuracyScore * 100
    )}%), and semantic similarities matched (${Math.round(similarityMatchScore * 100)}%).`;

    return {
      overallConfidence,
      telemetryQualityScore,
      historicalAccuracyScore,
      aiConfidenceScore,
      similarityMatchScore,
      reasoning,
    };
  }
}

export const confidenceEngine = new ConfidenceEngine();
export default confidenceEngine;
