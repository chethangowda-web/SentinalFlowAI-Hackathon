import { dbClient } from '../database/client/DatabaseClient';

async function main() {
  try {
    console.log('Dropping conflicting governance tables for a clean migration...');
    
    // Drop tables if they exist to clean up the collision
    await dbClient.query('DROP TABLE IF EXISTS ai_governance_logs CASCADE;');
    await dbClient.query('DROP TABLE IF EXISTS workflow_governance_logs CASCADE;');
    await dbClient.query('DROP TABLE IF EXISTS ai_governance_summary CASCADE;');
    await dbClient.query('DROP TABLE IF EXISTS self_healing_approvals CASCADE;');
    
    console.log('Tables dropped successfully!');
  } catch (error) {
    console.error('Error dropping tables:', error);
  } finally {
    await dbClient.close();
  }
}

main();
