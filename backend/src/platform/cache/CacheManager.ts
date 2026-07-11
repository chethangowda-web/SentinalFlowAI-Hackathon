export interface ICacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs?: number, tags?: string[]): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  invalidateByTag(tag: string): Promise<void>;
  getMetrics(): { hits: number; misses: number; keysCount: number; hitRatio: number };
}

export class MemoryCacheAdapter implements ICacheAdapter {
  private store: Map<string, { value: any; expiresAt: number; tags: string[] }> = new Map();
  private hits = 0;
  private misses = 0;

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.value as T;
  }

  public async set<T>(key: string, value: T, ttlMs = 60000, tags: string[] = []): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      tags,
    });
  }

  public async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  public async clear(): Promise<void> {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public async invalidateByTag(tag: string): Promise<void> {
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key);
      }
    }
  }

  public getMetrics() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      keysCount: this.store.size,
      hitRatio: total === 0 ? 0.0 : parseFloat((this.hits / total).toFixed(2)),
    };
  }
}

export class RedisCacheAdapter implements ICacheAdapter {
  private memoryFallback = new MemoryCacheAdapter();
  private isConnected = false;

  constructor() {
    this.isConnected = false;
  }

  public async get<T>(key: string): Promise<T | null> {
    return this.memoryFallback.get<T>(key);
  }

  public async set<T>(key: string, value: T, ttlMs = 60000, tags: string[] = []): Promise<void> {
    await this.memoryFallback.set(key, value, ttlMs, tags);
  }

  public async delete(key: string): Promise<void> {
    await this.memoryFallback.delete(key);
  }

  public async clear(): Promise<void> {
    await this.memoryFallback.clear();
  }

  public async invalidateByTag(tag: string): Promise<void> {
    await this.memoryFallback.invalidateByTag(tag);
  }

  public getMetrics() {
    return this.memoryFallback.getMetrics();
  }
}

export class CacheManager {
  private adapter: ICacheAdapter;

  constructor() {
    const useRedis = process.env.CACHE_PROVIDER === 'redis';
    this.adapter = useRedis ? new RedisCacheAdapter() : new MemoryCacheAdapter();
  }

  public getAdapter(): ICacheAdapter {
    return this.adapter;
  }

  public async get<T>(key: string): Promise<T | null> {
    return this.adapter.get<T>(key);
  }

  public async set<T>(key: string, value: T, ttlMs?: number, tags?: string[]): Promise<void> {
    return this.adapter.set(key, value, ttlMs, tags);
  }

  public async delete(key: string): Promise<void> {
    return this.adapter.delete(key);
  }

  public async invalidateByTag(tag: string): Promise<void> {
    return this.adapter.invalidateByTag(tag);
  }

  public getMetrics() {
    return this.adapter.getMetrics();
  }
}

export const cacheManager = new CacheManager();
export default cacheManager;
