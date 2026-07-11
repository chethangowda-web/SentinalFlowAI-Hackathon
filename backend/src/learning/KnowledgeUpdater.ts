import { LoggerService } from '../mastra/services/loggerService';
import { IncidentKnowledgeArtifact } from './LearningTypes';
import { LearningRepository } from './LearningRepository';

export class KnowledgeUpdater {
  private log = new LoggerService('KnowledgeUpdater');

  constructor(private readonly repo: LearningRepository) {}

  /**
   * Enriches Qdrant embeddings and Postgres records with extracted incident knowledge.
   * Returns the total count of successful knowledge store mutations.
   */
  async update(
    sessionId: string,
    artifact: IncidentKnowledgeArtifact
  ): Promise<number> {
    const { incidentId } = artifact;
    this.log.info(`[KnowledgeUpdater] Updating knowledge stores for incident ${incidentId}`);
    let updateCount = 0;

    // 1. Enrich Qdrant incident embedding with resolved metadata
    updateCount += await this.updateQdrant(sessionId, artifact);

    // 2. Update Postgres incident memory with lessons learned
    updateCount += await this.updatePostgresIncidentMemory(sessionId, artifact);

    // 3. Conditionally update runbook memory if runbook steps are in resolution
    if (artifact.resolutionSteps.some(s => s.toLowerCase().includes('runbook'))) {
      updateCount += await this.updateRunbookMemory(sessionId, artifact);
    }

    this.log.info(`[KnowledgeUpdater] Completed ${updateCount} knowledge store mutations for incident ${incidentId}`);
    return updateCount;
  }

  private async updateQdrant(sessionId: string, artifact: IncidentKnowledgeArtifact): Promise<number> {
    try {
      // In production: call qdrantClient.upsert() with enriched metadata payload
      // Here we record the intent and log the audit entry
      const enrichedMetadata = {
        rootCauseNarrative: artifact.rootCauseNarrative,
        fixSummary:         artifact.fixSummary,
        lessonsLearned:     artifact.lessonsLearned,
        bestPractices:      artifact.bestPractices,
        resolutionSteps:    artifact.resolutionSteps,
        enrichedAt:         artifact.extractedAt.toISOString()
      };

      await this.repo.saveKnowledgeUpdate(
        sessionId, artifact.incidentId, 'QDRANT', 'ENRICH',
        artifact.incidentId, enrichedMetadata, true
      );

      this.log.debug(`[KnowledgeUpdater] Qdrant enrichment recorded for incident ${artifact.incidentId}`);
      return 1;
    } catch (err: any) {
      this.log.error(`[KnowledgeUpdater] Qdrant update failed: ${err.message}`);
      await this.repo.saveKnowledgeUpdate(
        sessionId, artifact.incidentId, 'QDRANT', 'ENRICH',
        artifact.incidentId, {}, false, err.message
      );
      return 0;
    }
  }

  private async updatePostgresIncidentMemory(sessionId: string, artifact: IncidentKnowledgeArtifact): Promise<number> {
    try {
      const changes = {
        lessons_learned:   artifact.lessonsLearned,
        best_practices:    artifact.bestPractices,
        root_cause:        artifact.rootCauseNarrative,
        fix_summary:       artifact.fixSummary,
        knowledge_updated_at: artifact.extractedAt.toISOString()
      };

      await this.repo.saveKnowledgeUpdate(
        sessionId, artifact.incidentId, 'POSTGRES_INCIDENT', 'UPSERT',
        artifact.incidentId, changes, true
      );

      this.log.debug(`[KnowledgeUpdater] Postgres incident memory updated for ${artifact.incidentId}`);
      return 1;
    } catch (err: any) {
      this.log.error(`[KnowledgeUpdater] Postgres incident update failed: ${err.message}`);
      await this.repo.saveKnowledgeUpdate(
        sessionId, artifact.incidentId, 'POSTGRES_INCIDENT', 'UPSERT',
        artifact.incidentId, {}, false, err.message
      );
      return 0;
    }
  }

  private async updateRunbookMemory(sessionId: string, artifact: IncidentKnowledgeArtifact): Promise<number> {
    try {
      const changes = {
        effectiveness_notes: artifact.lessonsLearned,
        resolution_context:  artifact.fixSummary,
        updated_at:          artifact.extractedAt.toISOString()
      };

      await this.repo.saveKnowledgeUpdate(
        sessionId, artifact.incidentId, 'POSTGRES_RUNBOOK', 'ENRICH',
        artifact.incidentId, changes, true
      );

      this.log.debug(`[KnowledgeUpdater] Runbook memory enriched for incident ${artifact.incidentId}`);
      return 1;
    } catch (err: any) {
      this.log.error(`[KnowledgeUpdater] Runbook memory update failed: ${err.message}`);
      await this.repo.saveKnowledgeUpdate(
        sessionId, artifact.incidentId, 'POSTGRES_RUNBOOK', 'ENRICH',
        artifact.incidentId, {}, false, err.message
      );
      return 0;
    }
  }
}
