import { RetryService, isTransientHttpError } from './retryService';

export interface EmbeddingProvider {
  generate(text: string): Promise<number[]>;
}

const retry = new RetryService({
  maxRetries: 3,
  initialDelayMs: 300,
  maxDelayMs: 8_000,
  timeoutMs: 15_000,
  jitter: true,
  isTransient: isTransientHttpError,
});

export class EmbeddingService {
  private provider: EmbeddingProvider | null = null;

  constructor() {}

  public setProvider(provider: EmbeddingProvider): void {
    this.provider = provider;
    console.log('[EmbeddingService] Provider registered');
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    const trimmed = text.trim();

    if (!trimmed) {
      throw new Error('[EmbeddingService] Input text must not be empty');
    }

    if (!this.provider) {
      throw new Error('[EmbeddingService] No embedding provider registered. Call setProvider() first.');
    }

    console.log(`[EmbeddingService] Generating embedding for text of length ${trimmed.length}`);

    const provider = this.provider;

    try {
      const embedding = await retry.execute(
        () => provider.generate(trimmed),
        'EmbeddingService.generateEmbedding',
      );

      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('[EmbeddingService] Provider returned an invalid embedding');
      }

      console.log(`[EmbeddingService] Embedding generated successfully (dimensions: ${embedding.length})`);

      return embedding;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.startsWith('[EmbeddingService]')) {
          throw error;
        }
        throw new Error(`[EmbeddingService] Provider error: ${error.message}`);
      }
      throw new Error('[EmbeddingService] Unknown error during embedding generation');
    }
  }
}

export const embeddingService = new EmbeddingService();
