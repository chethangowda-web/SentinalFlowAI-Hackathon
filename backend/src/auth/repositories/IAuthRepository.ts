import { User, ApiKey } from '../types/types';

export interface IAuthRepository {
  createUser(user: User): Promise<User>;
  getUserById(userId: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(userId: string, updates: Partial<User>): Promise<void>;
  createApiKey(key: ApiKey): Promise<ApiKey>;
  getApiKeyByHash(hashedKey: string): Promise<ApiKey | null>;
  listApiKeys(orgId: string): Promise<ApiKey[]>;
  revokeApiKey(apiKeyId: string): Promise<void>;
}
