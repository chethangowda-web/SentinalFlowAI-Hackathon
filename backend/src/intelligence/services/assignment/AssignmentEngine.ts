import { DecisionContext, EngineerRecommendation } from '../../types';

export class AssignmentEngine {
  private engineers = [
    { id: 'eng-1', name: 'Alice Smith', ownership: ['payment-service', 'kubernetes'], specialization: 'Kubernetes' },
    { id: 'eng-2', name: 'Bob Jones', ownership: ['incident-service', 'auth'], specialization: 'Authentication' },
    { id: 'eng-3', name: 'Charlie Miller', ownership: ['notification-service', 'postgres'], specialization: 'Databases' },
  ];

  public recommend(context: DecisionContext): EngineerRecommendation {
    const service = context.incident.service;
    const workloads = context.currentEngineers || [];

    const scoredEngineers = this.engineers.map((eng) => {
      let score = 50; // baseline
      const isOwner = eng.ownership.includes(service.toLowerCase());

      if (isOwner) {
        score += 35;
      }

      // Check workload
      const wLoad = workloads.find((w) => w.name === eng.name) || { workloadCount: 0 };
      score -= wLoad.workloadCount * 8; // Deduct score for higher workload

      let reasoning = `General on-call SRE engineer. Specializes in ${eng.specialization}.`;
      if (isOwner) {
        reasoning = `Recommended owner: ${eng.name} owns service ${service} and has ${wLoad.workloadCount} active tasks.`;
      }

      return {
        engineerId: eng.id,
        name: eng.name,
        score: Math.min(100, Math.max(0, score)),
        reasoning,
        workloadCount: wLoad.workloadCount,
        isOwner,
      };
    });

    // Sort descending
    scoredEngineers.sort((a, b) => b.score - a.score);
    return (
      scoredEngineers[0] || {
        engineerId: 'eng-default',
        name: 'Default On-Call',
        score: 50,
        reasoning: 'Fallback default SRE engineer',
        workloadCount: 0,
        isOwner: false,
      }
    );
  }
}

export const assignmentEngine = new AssignmentEngine();
export default assignmentEngine;
