import { createClient, RedisClientType } from 'redis';
import { config } from '../../config/config';
import { LoggerService } from '../../mastra/services/loggerService';

export class RedisClient {
  private static instance: RedisClient;
  private client: RedisClientType | null = null;
  private log = new LoggerService('RedisClient');
  private connected = false;

  private constructor() {}

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async connect(): Promise<void> {
    if (this.client && this.connected) return;

    this.client = createClient({
      url: config.redis.url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            this.log.error('Redis max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    this.client.on('error', (err) => {
      this.log.error(`Redis Client Error: ${err.message}`);
      this.connected = false;
    });

    this.client.on('connect', () => {
      this.log.info('Redis Client Connected');
      this.connected = true;
    });

    this.client.on('ready', () => {
      this.log.info('Redis Client Ready');
      this.connected = true;
    });

    this.client.on('reconnecting', () => {
      this.log.warn('Redis Client Reconnecting...');
    });

    this.client.on('end', () => {
      this.log.warn('Redis Client Disconnected');
      this.connected = false;
    });

    await this.client.connect();
  }

  public getClient(): RedisClientType | null {
    return this.client;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.client || !this.connected) {
        return false;
      }
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.connected = false;
    }
  }

  public isConnected(): boolean {
    return this.connected && this.client !== null;
  }
}

export const redisClient = RedisClient.getInstance();