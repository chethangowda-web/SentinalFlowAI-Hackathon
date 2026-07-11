import * as jose from 'jose';
import { config } from '../../config/config';

export interface TokenPayload {
  userId: string;
  organizationId: string;
  role: string;
  sessionId: string;
}

export class TokenService {
  private static secret = new TextEncoder().encode(config.auth.jwtSecret);

  public static async generateAccessToken(payload: TokenPayload): Promise<string> {
    return new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(config.auth.accessExpiry)
      .sign(this.secret);
  }

  public static async generateRefreshToken(payload: Omit<TokenPayload, 'role'>): Promise<string> {
    return new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(config.auth.refreshExpiry)
      .sign(this.secret);
  }

  public static async verifyToken(token: string): Promise<jose.JWTVerifyResult & { payload: TokenPayload }> {
    const result = await jose.jwtVerify(token, this.secret);
    return result as any;
  }
}
