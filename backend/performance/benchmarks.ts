import { cacheManager } from '../src/platform/cache/CacheManager';
import { tracer } from '../src/platform/monitoring/Tracer';

async function runBenchmark() {
  console.log('=== STARTING SENTINELFLOW BENCHMARK STRESS TESTS ===');

  // 1. Caching performance benchmark
  const cacheStart = Date.now();
  for (let i = 0; i < 1000; i++) {
    await cacheManager.set(`benchmark-key-${i}`, `val-${i}`, 10000);
    await cacheManager.get(`benchmark-key-${i}`);
  }
  const cacheDuration = Date.now() - cacheStart;
  console.log(
    ` - Cache Set/Get 1000 cycles completed in: ${cacheDuration}ms (${(1000 / (cacheDuration / 1000)).toFixed(
      0
    )} requests/sec)`
  );

  // 2. OpenTelemetry Span generation performance
  const spanStart = Date.now();
  for (let i = 0; i < 1000; i++) {
    const span = tracer.startSpan(`span-${i}`);
    tracer.endSpan(span.spanId, { iteration: i });
  }
  const spanDuration = Date.now() - spanStart;
  console.log(` - Telemetry Span tracing 1000 cycles completed in: ${spanDuration}ms`);

  console.log('=== BENCHMARK STRESS TESTS COMPLETED SUCCESSFULLY ===');
  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error('[Benchmark] Failed with error:', err);
  process.exit(1);
});
