import { config as coreConfig } from '../../config/config';
import { z } from 'zod';

export const platformConfigSchema = z.object({
  FEATURE_FLAG_POLL_INTERVAL_MS: z.coerce.number().default(5000),
  CACHE_DEFAULT_TTL_MS: z.coerce.number().default(600000),
  SCHEDULER_POLL_INTERVAL_MS: z.coerce.number().default(2000),
  MAX_RETRIES_LIMIT: z.coerce.number().default(5),
  LOG_LEVEL_RUNTIME: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DOCKER_IMAGE_VERSION: z.string().default('latest'),
});

export type PlatformConfig = z.infer<typeof platformConfigSchema>;

export class ConfigurationManager {
  private currentConfig: PlatformConfig;
  private watchers: Array<(config: PlatformConfig) => void> = [];

  constructor() {
    this.currentConfig = this.loadConfig();
  }

  private loadConfig(): PlatformConfig {
    const raw = {
      FEATURE_FLAG_POLL_INTERVAL_MS: process.env.FEATURE_FLAG_POLL_INTERVAL_MS,
      CACHE_DEFAULT_TTL_MS: process.env.CACHE_DEFAULT_TTL_MS,
      SCHEDULER_POLL_INTERVAL_MS: process.env.SCHEDULER_POLL_INTERVAL_MS,
      MAX_RETRIES_LIMIT: process.env.MAX_RETRIES_LIMIT,
      LOG_LEVEL_RUNTIME: process.env.LOG_LEVEL_RUNTIME || coreConfig.logging.level,
      DOCKER_IMAGE_VERSION: process.env.DOCKER_IMAGE_VERSION,
    };
    return platformConfigSchema.parse(raw);
  }

  public get<K extends keyof PlatformConfig>(key: K): PlatformConfig[K] {
    return this.currentConfig[key];
  }

  public getFullConfig(): PlatformConfig {
    return { ...this.currentConfig };
  }

  public updateConfig(updates: Partial<PlatformConfig>): void {
    const merged = { ...this.currentConfig, ...updates };
    const validated = platformConfigSchema.parse(merged);
    this.currentConfig = validated;
    this.notifyWatchers();
  }

  public watch(callback: (config: PlatformConfig) => void): () => void {
    this.watchers.push(callback);
    return () => {
      this.watchers = this.watchers.filter((w) => w !== callback);
    };
  }

  private notifyWatchers(): void {
    for (const watcher of this.watchers) {
      try {
        watcher(this.currentConfig);
      } catch (err) {
        console.error('[ConfigurationManager] Watcher error:', err);
      }
    }
  }

  public reload(): void {
    this.currentConfig = this.loadConfig();
    this.notifyWatchers();
  }
}

export const configurationManager = new ConfigurationManager();
export default configurationManager;
