export interface ISecretProvider {
  getSecret(key: string): Promise<string | null>;
}

export class EnvironmentProvider implements ISecretProvider {
  public async getSecret(key: string): Promise<string | null> {
    return process.env[key] || null;
  }
}

export class VaultProvider implements ISecretProvider {
  public async getSecret(key: string): Promise<string | null> {
    return process.env[`VAULT_${key}`] || null;
  }
}

export class AWSSecretsProvider implements ISecretProvider {
  public async getSecret(key: string): Promise<string | null> {
    return process.env[`AWS_${key}`] || null;
  }
}

export class SecretsService {
  private providers: Map<string, ISecretProvider> = new Map();
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();
  private cacheTtlMs = 300000; // 5 minutes cache

  constructor() {
    this.registerProvider('env', new EnvironmentProvider());
    this.registerProvider('vault', new VaultProvider());
    this.registerProvider('aws', new AWSSecretsProvider());
  }

  public registerProvider(name: string, provider: ISecretProvider): void {
    this.providers.set(name.toLowerCase(), provider);
  }

  public async getSecret(key: string, providerName: string = 'env'): Promise<string | null> {
    const cacheKey = `${providerName}:${key}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const provider = this.providers.get(providerName.toLowerCase());
    if (!provider) {
      throw new Error(`Secrets provider not found: ${providerName}`);
    }

    const secret = await provider.getSecret(key);
    if (secret !== null) {
      this.cache.set(cacheKey, {
        value: secret,
        expiresAt: Date.now() + this.cacheTtlMs,
      });
    }

    return secret;
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const secretsService = new SecretsService();
export default secretsService;
