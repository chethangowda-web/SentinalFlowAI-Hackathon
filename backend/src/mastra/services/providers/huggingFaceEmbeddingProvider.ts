import { InferenceClient } from '@huggingface/inference';
import type { EmbeddingProvider } from '../embeddingService';
import { config } from '../../../config/config';

export class HuggingFaceEmbeddingProvider implements EmbeddingProvider {
  private client: InferenceClient;
  private model: string;

  constructor() {
    this.model = config.embedding.model;
    this.client = new InferenceClient(config.embedding.huggingFaceApiKey);

    console.log(`[HuggingFaceEmbeddingProvider] Initialized with model: ${this.model}`);
  }

  public async generate(text: string): Promise<number[]> {
    try {
      const result = await this.client.featureExtraction({
        model: this.model,
        inputs: text,
      });

      // featureExtraction may return a nested array (batch) or a flat array.
      // We always send a single input, so unwrap one level if needed.
      const embedding = Array.isArray(result[0]) ? (result[0] as number[]) : (result as number[]);

      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('[HuggingFaceEmbeddingProvider] Received an empty embedding from the API');
      }

      console.log(`[HuggingFaceEmbeddingProvider] Generated embedding with ${embedding.length} dimensions`);

      return embedding;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.startsWith('[HuggingFaceEmbeddingProvider]')) {
          throw error;
        }
        throw new Error(`[HuggingFaceEmbeddingProvider] API error: ${error.message}`);
      }
      throw new Error('[HuggingFaceEmbeddingProvider] Unknown error during embedding generation');
    }
  }
}
