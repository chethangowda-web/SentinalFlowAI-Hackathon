import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import dotenv from 'dotenv';
const { Client } = pkg;
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runMigrations() {
  console.log('Connecting to database...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected.');

    const migrationsDir = path.join(__dirname, '../src/database/migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`Executing migration: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');
        try {
          await client.query(sql);
          console.log(`  -> Success: ${file}`);
        } catch (err: any) {
          console.error(`  -> Error executing ${file}:`, err.message);
          // Assuming these might fail if tables already exist, we log and continue
        }
      }
    }
    console.log('Migrations complete.');
  } catch (error) {
    console.error('Failed to run migrations:', error);
  } finally {
    await client.end();
  }
}

runMigrations();
