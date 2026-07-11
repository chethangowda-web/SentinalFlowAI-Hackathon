import { config } from './src/config/config.js';
import pkg from 'pg';
const { Client } = pkg;
(async () => {
  const client = new Client({ connectionString: config.db.url, ssl: config.db.ssl ? { rejectUnauthorized: false } : undefined });
  await client.connect();
  const res1 = await client.query('SELECT current_database() AS db, current_schema() AS schema, current_setting(\'search_path\') AS search_path');
  console.log('DB Info:', res1.rows[0]);
  const res2 = await client.query("SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'organizations'");
  console.log('Organizations tables:', res2.rows);
  await client.end();
})();
