import { ChaosTestingHook } from '../src/platform/testing/ChaosTestingHook';

async function runChaosScenario() {
  console.log('=== STARTING CHAOS ENGINEERING TESTING SCENARIOS ===');

  // 1. Latency injection test
  console.log('[Chaos] Injecting 500ms API latency...');
  ChaosTestingHook.setLatencyInjection(500);

  const start = Date.now();
  await ChaosTestingHook.injectLatency();
  const elapsed = Date.now() - start;

  console.log(` - Delay injected successfully. Delay duration: ${elapsed}ms`);
  if (elapsed < 500) throw new Error('Latency injection failed');

  // 2. Database connection failure injection
  console.log('[Chaos] Injecting database error with 100% probability...');
  ChaosTestingHook.setDatabaseErrorProbability(1.0);

  try {
    ChaosTestingHook.injectDatabaseError();
    throw new Error('Database error was not thrown');
  } catch (err: any) {
    if (err.message.includes('Database connection pool closed')) {
      console.log(' - Database error successfully intercepted and handled.');
    } else {
      throw err;
    }
  }

  ChaosTestingHook.clear();
  console.log('=== CHAOS ENGINEERING TESTING COMPLETED SUCCESSFULLY ===');
  process.exit(0);
}

runChaosScenario().catch((err) => {
  console.error('[Chaos] Scenario failed with error:', err);
  process.exit(1);
});
