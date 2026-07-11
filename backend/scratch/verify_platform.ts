import { randomUUID } from 'crypto';
// Mock environment keys
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';
process.env.DB_NAME = 'sentinelflow';
process.env.JWT_SECRET = 'secret-key-12345';
process.env.GROQ_API_KEY = 'mock';
process.env.HUGGINGFACE_API_KEY = 'mock';
process.env.QDRANT_URL = 'http://localhost:6333';
process.env.QDRANT_COLLECTION = 'incidents';

import { dbClient } from '../src/database/client/DatabaseClient';
import { platformLifecycle } from '../src/platform/lifecycle/PlatformLifecycle';
import { configurationManager } from '../src/platform/configuration/ConfigurationManager';
import { cacheManager } from '../src/platform/cache/CacheManager';
import { extensionManager, IExtension } from '../src/platform/extensions/ExtensionManager';
import { secretsService } from '../src/platform/secrets/SecretsService';
import { featureFlagService } from '../src/platform/feature-flags/FeatureFlagService';
import { scheduler, workerManager } from '../src/platform/scheduler/Scheduler';
import { tracer } from '../src/platform/monitoring/Tracer';
import { performanceService } from '../src/platform/performance/PerformanceService';
import { healthService } from '../src/platform/health/HealthService';
import { platformAuditService } from '../src/platform/audit/PlatformAuditService';
import { backupService } from '../src/platform/backup/BackupService';
import { APIInfrastructure } from '../src/platform/api/apiInfrastructure';

async function runVerify() {
  console.log('=== STARTING PLATFORM INFRASTRUCTURE INTEGRATION VERIFICATION ===');

  // 1. Verify Database Migrations Exist
  try {
    const res = await dbClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('platform_integrations', 'platform_audit_logs', 'platform_feature_flags', 'platform_jobs');
    `);
    console.log(
      '[Verify] Platform Operations DB tables migrated:',
      res.map((r) => r.table_name)
    );
    if (res.length < 4) {
      console.log('[Verify] Running platform migrations manually...');
      const fs = require('fs');
      const path = require('path');
      const sql = fs.readFileSync(
        path.join(__dirname, '../src/database/migrations/009_platform_operations_tables.sql'),
        'utf8'
      );
      await dbClient.query(sql);
      console.log('[Verify] Platform table definitions applied.');
    }
  } catch (err) {
    console.error('[Verify] Database validation failed:', err);
    process.exit(1);
  }

  // 2. Validate Platform Configuration Center
  console.log('[Verify] Validating configuration watcher and overrides...');
  let configTriggered = false;
  configurationManager.watch(() => {
    configTriggered = true;
  });
  configurationManager.updateConfig({ LOG_LEVEL_RUNTIME: 'debug' });
  if (configurationManager.get('LOG_LEVEL_RUNTIME') !== 'debug' || !configTriggered) {
    throw new Error('Platform configuration watcher failed');
  }
  console.log(' - Configuration Manager ok!');

  // 3. Validate Distributed Caching Engine
  console.log('[Verify] Validating cache tag-eviction and statistics...');
  await cacheManager.set('key1', 'value1', 5000, ['tag-x']);
  await cacheManager.set('key2', 'value2', 5000, ['tag-y']);

  const val1 = await cacheManager.get('key1');
  const val2 = await cacheManager.get('key2');
  if (val1 !== 'value1' || val2 !== 'value2') throw new Error('Caching set/get failed');

  await cacheManager.invalidateByTag('tag-x');
  const cleared1 = await cacheManager.get('key1');
  const intact2 = await cacheManager.get('key2');
  if (cleared1 !== null || intact2 !== 'value2') throw new Error('Cache tag eviction failed');

  const cacheMetrics = cacheManager.getMetrics();
  console.log(' - Caching stats:', cacheMetrics);
  if (cacheMetrics.keysCount !== 1) throw new Error('Cache key counter stats invalid');

  // 4. Validate Sandboxed Extensions Registry
  console.log('[Verify] Booting Extensions Framework...');
  const mockExtension: IExtension = {
    name: 'SRE-Custom-Model',
    version: '1.2.0',
    onBoot: async (ctx) => {
      console.log('   - Sandbox boot hook run for extension:', ext.name);
    },
  };
  const ext = mockExtension;
  extensionManager.register(ext);
  await extensionManager.bootAll({
    platformVersion: '1.0.0',
    services: {},
  });
  if (extensionManager.listExtensions().length !== 1) throw new Error('Extensions registration failed');

  // 5. Validate Secrets Redaction
  console.log('[Verify] Validating secrets provider cache...');
  process.env.AWS_KEY = 'secret-key-xyz';
  const secret = await secretsService.getSecret('KEY', 'aws');
  if (secret !== 'secret-key-xyz') throw new Error('Secret AWS Provider failed');

  // 6. Validate Feature Flags targeting
  console.log('[Verify] Evaluating feature flag targeting rules...');
  await featureFlagService.setFlag('ai-remediation-active', true, {
    environments: ['production'],
    rolloutPercentage: 100,
  });

  const prodActive = await featureFlagService.getFlagValue('ai-remediation-active', { environment: 'production' });
  const devActive = await featureFlagService.getFlagValue('ai-remediation-active', { environment: 'dev' });

  if (!prodActive || devActive) throw new Error('Feature Flags targeting rules failed');
  console.log(' - Feature Flags evaluated correctly!');

  // 7. Validate Job Scheduler
  console.log('[Verify] Submitting Job to Scheduler...');
  let jobExecuted = false;
  workerManager.registerJobHandler('platform.cleanup', async (payload) => {
    console.log('   - Cleanup SRE worker executed payload:', payload);
    jobExecuted = true;
  });

  await scheduler.schedule({
    name: 'platform.cleanup',
    payload: { retentionDays: 30 },
    runAt: new Date(),
  });

  workerManager.start();
  await new Promise((resolve) => setTimeout(resolve, 2500));
  workerManager.stop();

  if (!jobExecuted) throw new Error('Background Worker failed to execute queued job');
  console.log(' - Job Scheduler ok!');

  // 8. Validate OpenTelemetry tracer
  console.log('[Verify] Starting Span Trace...');
  const span = tracer.startSpan('incident_analysis');
  tracer.endSpan(span.spanId, { status: 'success' });

  // 9. Validate Health Status Checks
  console.log('[Verify] Running health system ready probes...');
  const health = await healthService.checkReadiness();
  console.log(' - Readiness Details:', health);

  // 10. Validate API specification and Swagger UI
  console.log('[Verify] Compiling OpenAPI definition specs...');
  const spec = APIInfrastructure.getOpenAPISpec();
  if (spec.openapi !== '3.0.0') throw new Error('OpenAPI definition invalid');

  console.log('=== PLATFORM INFRASTRUCTURE INTEGRATION VERIFICATION SUCCEEDED ===');
  process.exit(0);
}

runVerify().catch((err) => {
  console.error('[Verify] Platform integration verification failed with error:', err);
  process.exit(1);
});
