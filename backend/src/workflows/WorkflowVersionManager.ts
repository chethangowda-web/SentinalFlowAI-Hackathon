import { WorkflowDefinition } from './WorkflowDefinition';
import { dbClient } from '../database/client/DatabaseClient';

export class WorkflowVersionManager {
  /**
   * Saves a workflow definition as a DRAFT. Drafts can be freely edited.
   */
  public static async saveDraft(name: string, definition: WorkflowDefinition): Promise<WorkflowDefinition> {
    definition.name = name;
    definition.status = 'DRAFT';
    definition.updatedAt = new Date();
    
    await dbClient.query(`
      INSERT INTO workflow_definitions (id, name, version, status, definition, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, 0, 'DRAFT', $2, NOW(), NOW())
      ON CONFLICT (name, version) DO UPDATE SET definition = $2, updated_at = NOW()
    `, [name, JSON.stringify(definition)]);

    return definition;
  }

  /**
   * Publishes a workflow. This freezes the current graph and increments the version number.
   * Published workflows are immutable to ensure execution history is retained accurately.
   */
  public static async publish(definition: WorkflowDefinition): Promise<WorkflowDefinition> {
    definition.status = 'ACTIVE';
    definition.version = (definition.version || 0) + 1;
    definition.updatedAt = new Date();
    
    await dbClient.query(`
      INSERT INTO workflow_definitions (id, name, version, status, definition, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, 'ACTIVE', $3, NOW(), NOW())
    `, [definition.name, definition.version, JSON.stringify(definition)]);

    return definition;
  }

  public static async getLatestActive(name: string): Promise<WorkflowDefinition | null> {
    const rows = await dbClient.query(`
      SELECT definition FROM workflow_definitions 
      WHERE name = $1 AND status = 'ACTIVE' 
      ORDER BY version DESC LIMIT 1
    `, [name]);
    
    if (!rows.length) return null;
    return rows[0].definition as WorkflowDefinition;
  }
}
