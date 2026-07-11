import { QdrantClient } from '@qdrant/js-client-rest';
import https from 'https';
import { RetryService, isTransientHttpError } from './retryService';
import { config } from '../../config/config';

const retry = new RetryService({
  maxRetries: 3,
  initialDelayMs: 300,
  maxDelayMs: 8_000,
  timeoutMs: 10_000,
  jitter: true,
  isTransient: isTransientHttpError,
});

export interface StoreIncidentParams {
  incidentId: string;
  service: string;
  severity: string;
  summary: string;
  rootCause: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export interface SearchIncidentsParams {
  embedding: number[];
  limit: number;
}

export interface SimilarIncident {
  incidentId: string;
  score: number;
  payload: Record<string, unknown>;
}

export class QdrantMemoryService {
  private client: QdrantClient | null = null;
  private collectionName: string = '';
  private initPromise: Promise<void> | null = null;
  private degraded = false;

  constructor() {}

public async initialize(): Promise<void> {
  try {
    console.log("========== QDRANT INITIALIZATION ==========");
    console.log("URL:", config.qdrant.url);
    console.log("Collection:", config.qdrant.collection);
    console.log(
      "API Key:",
      config.qdrant.apiKey
        ? `${config.qdrant.apiKey.substring(0, 12)}...`
        : "NOT SET"
    );
    console.log("===========================================");

    this.client = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey,
      checkCompatibility: false,
      httpsAgent: new https.Agent({ keepAlive: true }),
    });

    this.collectionName = config.qdrant.collection;

    const collections = await this.client.getCollections();
    console.log(
      "[Qdrant] Existing collections:",
      collections.collections.map(c => c.name)
    );

    const exists = await this.client.collectionExists(this.collectionName);

    if (!exists.exists) {
      console.log(
        `[Qdrant] Creating collection ${this.collectionName}`
      );

      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: 1024,
          distance: "Cosine",
        },
      });

      console.log("[Qdrant] Collection created");
    } else {
      console.log("[Qdrant] Collection already exists");
    }

    console.log("[Qdrant] Connected successfully");

    this.degraded = false;
  } catch (error) {
    this.degraded = true;

    console.error("========== QDRANT ERROR ==========");
    console.error(error);
    console.error("==================================");

    throw error;
  }
}
  /**
   * Idempotent, concurrency-safe initialisation.
   * Multiple concurrent callers share the same Promise.
   * If initialisation fails, the next call will retry.
   */
  public async ensureInitialized(): Promise<void> {
    if (this.client && !this.degraded) {
      return;
    }
    if (!this.initPromise) {
      this.initPromise = this.initialize()
        .then(() => {
          this.degraded = false;
        })
        .catch((err) => {
          this.degraded = true;
          console.warn(`[QdrantMemory] ensureInitialized failed (falling back to degraded mode): ${err.message}`);
        });
    }
    return this.initPromise;
  }

  public isDegraded(): boolean {
    return this.degraded;
  }

  private getClient(): QdrantClient {
    if (!this.client || this.degraded) {
      throw new Error('[QdrantMemory] Client not initialized or degraded.');
    }
    return this.client;
  }

  public async storeIncident(params: StoreIncidentParams): Promise<void> {
    try {
      if (this.isDegraded()) {
        console.warn("[QdrantMemory] Skipping storeIncident because memory is degraded");
        return;
      }
      const client = this.getClient();
      
      const payload: Record<string, unknown> = {
        incidentId: params.incidentId,
        service: params.service,
        severity: params.severity,
        summary: params.summary,
        rootCause: params.rootCause,
        ...(params.metadata || {})
      };

      await retry.execute(
        () => client.upsert(this.collectionName, {
          wait: true,
          points: [
            {
              id: params.incidentId,
              vector: params.embedding,
              payload
            }
          ]
        }),
        'QdrantMemoryService.storeIncident',
      );

      console.log("[Qdrant] Stored Incident:", params.incidentId);
    } catch (error) {
      console.warn(`[QdrantMemory] Warning: Failed to store incident (AI search degraded). ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async searchSimilarIncidents(params: SearchIncidentsParams): Promise<SimilarIncident[]> {
    try {
      if (this.isDegraded()) {
        console.warn("[QdrantMemory] Skipping searchSimilarIncidents because memory is degraded");
        return [];
      }
      const client = this.getClient();
      
      const results = await retry.execute(
        () => client.search(this.collectionName, {
          vector: params.embedding,
          limit: params.limit,
          with_payload: true,
        }),
        'QdrantMemoryService.searchSimilarIncidents',
      );

      console.log(`[Qdrant] Retrieved ${results.length} similar incidents`);

      return results.map(result => ({
        incidentId: String(result.id),
        score: result.score,
        payload: result.payload as Record<string, unknown> || {}
      }));
    } catch (error) {
      console.warn(`[QdrantMemory] Warning: Failed to search incidents (AI search degraded). Returning empty results. ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      if (this.isDegraded()) return false;
      const client = this.getClient();
      await retry.execute(
        () => client.getCollections(),
        'QdrantMemoryService.healthCheck',
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const qdrantMemory = new QdrantMemoryService();
