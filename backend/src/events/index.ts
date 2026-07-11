import { eventBus } from './EventBus';
import { eventRegistry } from './EventRegistry';
import { LoggingMiddleware, MetricsMiddleware, TracingMiddleware, ValidationMiddleware } from './Middleware';

// Importing handlers triggers the @EventHandler decorators to register them automatically
import './handlers/TimelineEventHandler';
import './handlers/AuditLogEventHandler';
import './handlers/StatisticsEventHandler';
import './handlers/NotificationEventHandler';
import '../notifications/NotificationEventSubscriber';
import '../runbooks/RunbookEventSubscriber';
import '../auth/AuthEventSubscriber';
import '../intelligence/events/DecisionEventSubscriber';
import '../learning/events/LearningEventSubscriber';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbClient } from '../database/client/DatabaseClient';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, '../database/migrations');

export function initializeEventBus() {
  // Force discovery of decorated handlers now that all imports are complete
  eventRegistry.discoverDecoratedHandlers();

  // Register global middlewares
  eventBus.use(ValidationMiddleware.create());
  eventBus.use(TracingMiddleware.create());
  eventBus.use(LoggingMiddleware.create());
  eventBus.use(MetricsMiddleware.create());

  // Wait 10 seconds before attempting to replay DLQ to ensure DB is fully connected
  setTimeout(() => {
    if (process.env.SKIP_MIGRATIONS === 'true') {
      console.log('[EventBus] Skipping dynamic database migrations on startup (SKIP_MIGRATIONS=true)');
    } else {
      // Dynamically run the notification tables migration to guarantee PostgreSQL tables exist
      try {
        const sqlPath = path.join(migrationsDir, '005_notification_tables.sql');
        if (fs.existsSync(sqlPath)) {
          const sql = fs.readFileSync(sqlPath, 'utf8');
          dbClient.query(sql).then(() => {
            console.log('[EventBus] Notification tables migration completed successfully');
          }).catch(err => {
            console.error(`[EventBus] Migration failed: ${err.message}`);
          });
        }

        const runbookSqlPath = path.join(migrationsDir, '006_runbook_tables.sql');
        if (fs.existsSync(runbookSqlPath)) {
          const sql = fs.readFileSync(runbookSqlPath, 'utf8');
          dbClient.query(sql).then(() => {
            console.log('[EventBus] Runbook tables migration completed successfully');
          }).catch(err => {
            console.error(`[EventBus] Runbook migration failed: ${err.message}`);
          });
        }

        const authSqlPath = path.join(migrationsDir, '007_auth_and_tenancy.sql');
        if (fs.existsSync(authSqlPath)) {
          const sql = fs.readFileSync(authSqlPath, 'utf8');
          dbClient.query(sql).then(() => {
            console.log('[EventBus] Auth and Multi-Tenancy tables migration completed successfully');
          }).catch(err => {
            console.error(`[EventBus] Auth migration failed: ${err.message}`);
          });
        }

        const intelligenceSqlPath = path.join(migrationsDir, '008_decision_intelligence_tables.sql');
        if (fs.existsSync(intelligenceSqlPath)) {
          const sql = fs.readFileSync(intelligenceSqlPath, 'utf8');
          dbClient.query(sql).then(() => {
            console.log('[EventBus] Decision Intelligence tables migration completed successfully');
          }).catch(err => {
            console.error(`[EventBus] Decision Intelligence migration failed: ${err.message}`);
          });
        }

        const platformSqlPath = path.join(migrationsDir, '009_platform_operations_tables.sql');
        if (fs.existsSync(platformSqlPath)) {
          const sql = fs.readFileSync(platformSqlPath, 'utf8');
          dbClient.query(sql).then(() => {
            console.log('[EventBus] Platform Operations tables migration completed successfully');
          }).catch(err => {
            console.error(`[EventBus] Platform Operations migration failed: ${err.message}`);
          });
        }

        const agentPlatformSqlPath = path.join(migrationsDir, '010_agent_platform_tables.sql');
        if (fs.existsSync(agentPlatformSqlPath)) {
          const sql = fs.readFileSync(agentPlatformSqlPath, 'utf8');
          dbClient.query(sql).then(() => {
            console.log('[EventBus] Agent Platform tables migration completed successfully');
          }).catch(err => {
            console.error(`[EventBus] Agent Platform migration failed: ${err.message}`);
          });
        }

        const aiosWorkflowSqlPath = path.join(migrationsDir, '011_aios_workflow_tables.sql');
        if (fs.existsSync(aiosWorkflowSqlPath)) {
          const sql = fs.readFileSync(aiosWorkflowSqlPath, 'utf8');
          dbClient.query(sql).then(() => {
            console.log('[EventBus] AIOS Workflow tables migration completed successfully');
          }).catch(err => {
            console.error(`[EventBus] AIOS Workflow migration failed: ${err.message}`);
          });
        }

        const learningTablesSqlPath = path.join(migrationsDir, '012_learning_tables.sql');
        if (fs.existsSync(learningTablesSqlPath)) {
          const sql = fs.readFileSync(learningTablesSqlPath, 'utf8');
          dbClient.query(sql).then(() => {
            console.log('[EventBus] AI Learning tables migration completed successfully');
          }).catch(err => {
            console.error(`[EventBus] AI Learning migration failed: ${err.message}`);
          });
        }
      } catch (err) {
        console.error(`[EventBus] Migration setup failed: ${err}`);
      }
    }

    eventBus.replayAll().catch(err => {
      console.error(`[EventBus] Failed to replay DLQ events on startup: ${err}`);
    });
  }, 10000);
}
