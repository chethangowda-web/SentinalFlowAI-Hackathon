import { Context, Next } from 'hono';
import { TokenService } from '../authentication/TokenService';
import { sessionRepository } from '../../database/repositories/AuthRepository';

export async function requireAuth(c: Context, next: Next) {
  let token = '';

  // 1. Try Authorization header
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Try cookie
  if (!token) {
    const cookies = c.req.header('Cookie');
    if (cookies) {
      const match = cookies.match(/access_token=([^;]+)/);
      if (match) token = match[1];
    }
  }

  if (!token) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401);
  }

  try {
    const { payload } = await TokenService.verifyToken(token);

    // Validate active session in DB
    const session = await sessionRepository.getSessionById(payload.sessionId);
    if (!session) {
      return c.json({ error: 'Unauthorized: Session has been revoked' }, 401);
    }

    // Set variables on Hono Context
    c.set('userId', payload.userId);
    c.set('organizationId', payload.organizationId);
    c.set('userRole', payload.role);
    c.set('sessionId', payload.sessionId);

    await next();
  } catch (err) {
    return c.json({ error: 'Unauthorized: Invalid token signature or expired' }, 401);
  }
}
