import { cacheManager } from '../src/platform/cache/CacheManager';
import { secretsService } from '../src/platform/secrets/SecretsService';

describe('Integration Tests - Caching and secrets managers', () => {
  beforeEach(async () => {
    await cacheManager.getAdapter().clear();
    secretsService.clearCache();
  });

  it('should store and evict values in distributed cache using TTL', async () => {
    await cacheManager.set('key-cache', 'data-val', 60000);
    const val = await cacheManager.get('key-cache');
    expect(val).toBe('data-val');
  });

  it('should fetch variables through secret providers', async () => {
    process.env.AWS_KEY = 'secret-aws-token';
    const secret = await secretsService.getSecret('KEY', 'aws');
    expect(secret).toBe('secret-aws-token');
  });
});
