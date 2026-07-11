import { Session, RefreshToken } from '../types/types';

export interface ISessionRepository {
  createSession(session: Session): Promise<Session>;
  getSessionById(id: string): Promise<Session | null>;
  listSessions(userId: string): Promise<Session[]>;
  revokeSession(id: string): Promise<void>;
  revokeAllSessions(userId: string): Promise<void>;
  revokeOtherSessions(userId: string, currentSessionId: string): Promise<void>;

  createRefreshToken(token: RefreshToken): Promise<RefreshToken>;
  getRefreshTokenByHash(hash: string): Promise<RefreshToken | null>;
  rotateRefreshToken(id: string): Promise<void>;
  revokeAllRefreshTokens(userId: string): Promise<void>;
}
