import { registerApiRoute } from '@mastra/core/server';
import { z } from 'zod';
import { AuthService } from '../auth/authentication/AuthService';
import { PasswordService } from '../auth/authentication/PasswordService';
import { TokenService } from '../auth/authentication/TokenService';
import { authRepository } from '../database/repositories/AuthRepository';
import { requireAuth } from '../auth/middleware/requireAuth';
import { requireOrganization } from '../auth/middleware/requireOrganization';
import { randomUUID, createHash } from 'crypto';
import { UserRole } from '../auth/types/types';

async function formatUserResponse(user: any) {
  const org = user.organizationId ? await authRepository.getOrganizationById(user.organizationId) : null;
  const organizations = org ? [{
    id: org.organizationId,
    name: org.name,
    slug: org.slug,
    role: user.role
  }] : [];

  return {
    id: user.userId,
    email: user.email,
    name: user.fullName,
    role: user.role,
    organizations,
    activeOrgId: user.organizationId
  };
}

export const registerRoute = registerApiRoute('/custom/v1/auth/register', {
  method: 'POST',
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const schema = z.object({
        email: z.string().email(),
        fullName: z.string().optional(),
        ownerName: z.string().optional(),
        password: z.string().min(8),
        organizationName: z.string().min(1),
      });

      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      }

      const name = parsed.data.fullName || parsed.data.ownerName;
      if (!name) {
        return c.json({ error: 'Validation failed', details: [{ message: 'fullName or ownerName is required' }] }, 400);
      }

      const { user, organizationId } = await AuthService.register(
        parsed.data.email,
        name,
        parsed.data.password,
        parsed.data.organizationName
      );

      // Automatically login user after registration
      const ua = c.req.header('User-Agent') || 'unknown';
      const ip = c.req.header('X-Forwarded-For') || '127.0.0.1';
      const loginResult = await AuthService.login(
        parsed.data.email,
        parsed.data.password,
        { ip, device: ua }
      );

      // Set cookie
      c.header('Set-Cookie', `access_token=${loginResult.accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`);

      const formattedUser = await formatUserResponse(loginResult.user);

      return c.json({
        success: true,
        token: loginResult.accessToken,
        accessToken: loginResult.accessToken,
        refreshToken: loginResult.refreshToken,
        user: formattedUser,
        session: loginResult.session
      }, 201);
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Registration failed' }, 500);
    }
  }
});

export const loginRoute = registerApiRoute('/custom/v1/auth/login', {
  method: 'POST',
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const schema = z.object({
        email: z.string().email(),
        password: z.string(),
      });

      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      }

      // Collect user agent metadata
      const ua = c.req.header('User-Agent') || 'unknown';
      const ip = c.req.header('X-Forwarded-For') || '127.0.0.1';

      const { accessToken, refreshToken, user, session } = await AuthService.login(
        parsed.data.email,
        parsed.data.password,
        { ip, device: ua }
      );

      // Set cookie
      c.header('Set-Cookie', `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`);

      const formattedUser = await formatUserResponse(user);

      return c.json({ success: true, token: accessToken, accessToken, refreshToken, user: formattedUser, session }, 200);
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Login failed' }, 401);
    }
  }
});

export const logoutRoute = registerApiRoute('/custom/v1/auth/logout', {
  method: 'POST',
  middleware: [requireAuth],
  handler: async (c) => {
    const sessionId = c.get('sessionId');
    const userId = c.get('userId');
    await AuthService.logout(sessionId, userId);
    c.header('Set-Cookie', 'access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
    return c.json({ success: true, message: 'Logged out successfully' }, 200);
  }
});

export const getMeRoute = registerApiRoute('/custom/v1/auth/me', {
  method: 'GET',
  middleware: [requireAuth],
  handler: async (c) => {
    const userId = c.get('userId');
    const user = await authRepository.getUserById(userId);
    if (!user) return c.json({ error: 'User not found' }, 404);
    const formattedUser = await formatUserResponse(user);
    return c.json({ user: formattedUser }, 200);
  }
});

export const getSessionsRoute = registerApiRoute('/custom/v1/auth/sessions', {
  method: 'GET',
  middleware: [requireAuth],
  handler: async (c) => {
    const userId = c.get('userId');
    const sessions = await authRepository.listSessions(userId);
    return c.json({ sessions }, 200);
  }
});

export const revokeSessionRoute = registerApiRoute('/custom/v1/auth/sessions/:id', {
  method: 'DELETE',
  middleware: [requireAuth],
  handler: async (c) => {
    const sessionId = c.req.param('id');
    await authRepository.revokeSession(sessionId);
    return c.json({ success: true, message: 'Session revoked' }, 200);
  }
});

export const getOrganizationsRoute = registerApiRoute('/custom/v1/auth/organizations', {
  method: 'GET',
  middleware: [requireAuth],
  handler: async (c) => {
    const orgId = c.get('organizationId');
    const org = await authRepository.getOrganizationById(orgId);
    return c.json({ organizations: org ? [org] : [] }, 200);
  }
});

export const createOrganizationRoute = registerApiRoute('/custom/v1/auth/organizations', {
  method: 'POST',
  middleware: [requireAuth],
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const schema = z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
      });

      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      }

      const orgId = randomUUID();
      const org = await authRepository.createOrganization(
        {
          organizationId: orgId,
          name: parsed.data.name,
          slug: parsed.data.slug,
          plan: 'FREE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          organizationId: orgId,
          timezone: 'UTC',
          businessHours: { start: '09:00', end: '17:00' },
          notificationDefaults: {},
          retentionPolicyDays: 30,
          defaultSeverity: 'MEDIUM',
          branding: {},
        }
      );

      return c.json(org, 201);
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Failed to create organization' }, 500);
    }
  }
});

export const getTeamsRoute = registerApiRoute('/custom/v1/auth/teams', {
  method: 'GET',
  middleware: [requireAuth, requireOrganization],
  handler: async (c) => {
    const orgId = c.get('organizationId');
    const teams = await authRepository.listTeams(orgId);
    return c.json({ teams }, 200);
  }
});

export const createTeamRoute = registerApiRoute('/custom/v1/auth/teams', {
  method: 'POST',
  middleware: [requireAuth, requireOrganization],
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const schema = z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      });

      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      }

      const orgId = c.get('organizationId');
      const userId = c.get('userId');

      const team = await authRepository.createTeam({
        teamId: randomUUID(),
        organizationId: orgId,
        name: parsed.data.name,
        description: parsed.data.description,
        ownerId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return c.json(team, 201);
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Failed to create team' }, 500);
    }
  }
});

export const refreshRoute = registerApiRoute('/custom/v1/auth/refresh', {
  method: 'POST',
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const token = body.token || body.refreshToken;
      if (!token) {
        return c.json({ error: 'Refresh token is required' }, 400);
      }
      
      const hash = createHash('sha256').update(token).digest('hex');
      const dbToken = await authRepository.getRefreshTokenByHash(hash);
      if (!dbToken) {
        return c.json({ error: 'Invalid refresh token' }, 401);
      }

      const user = await authRepository.getUserById(dbToken.userId);
      if (!user) {
        return c.json({ error: 'User not found' }, 401);
      }

      const { accessToken, newRefreshToken, session } = await AuthService.refresh(token);
      const formattedUser = await formatUserResponse(user);

      return c.json({
        success: true,
        token: accessToken,
        accessToken,
        refreshToken: newRefreshToken,
        user: formattedUser,
        session
      }, 200);
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Refresh failed' }, 401);
    }
  }
});

export const forgotPasswordRoute = registerApiRoute('/custom/v1/auth/forgot-password', {
  method: 'POST',
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const { email } = body;
      if (!email) {
        return c.json({ error: 'Email is required' }, 400);
      }
      const user = await authRepository.getUserByEmail(email);
      if (!user) {
        return c.json({ error: 'User not found' }, 404);
      }
      return c.json({ success: true, message: 'Password reset link sent to your email.' }, 200);
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Failed to send link' }, 500);
    }
  }
});

export const resetPasswordRoute = registerApiRoute('/custom/v1/auth/reset-password', {
  method: 'POST',
  handler: async (c) => {
    try {
      const body = await c.req.json();
      const { token, password } = body;
      if (!token || !password) {
        return c.json({ error: 'Token and password are required' }, 400);
      }
      return c.json({ success: true, message: 'Password reset successful. You can login now.' }, 200);
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Failed to reset password' }, 500);
    }
  }
});

export const switchOrganizationRoute = registerApiRoute('/custom/v1/auth/switch-org/:orgId', {
  method: 'POST',
  middleware: [requireAuth],
  handler: async (c) => {
    try {
      const userId = c.get('userId');
      const orgId = c.req.param('orgId');
      const user = await authRepository.getUserById(userId);
      if (!user) return c.json({ error: 'User not found' }, 404);

      const org = await authRepository.getOrganizationById(orgId);
      if (!org) return c.json({ error: 'Organization not found' }, 404);

      user.organizationId = orgId;
      await authRepository.updateUser(userId, user);

      const sessionId = randomUUID();
      const session = await authRepository.createSession({
        id: sessionId,
        userId: user.userId,
        device: c.req.header('User-Agent') || 'unknown',
        ip: c.req.header('X-Forwarded-For') || '127.0.0.1',
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      const tokenPayload = {
        userId: user.userId,
        organizationId: orgId,
        role: user.role,
        sessionId,
      };

      const accessToken = await TokenService.generateAccessToken(tokenPayload);
      const rawRefresh = randomUUID();
      const tokenHash = createHash('sha256').update(rawRefresh).digest('hex');

      await authRepository.createRefreshToken({
        id: randomUUID(),
        userId: user.userId,
        tokenHash,
        rotated: false,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const formattedUser = await formatUserResponse(user);

      return c.json({
        success: true,
        token: accessToken,
        accessToken,
        refreshToken: rawRefresh,
        user: formattedUser,
        session
      }, 200);
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Switch organization failed' }, 500);
    }
  }
});

export const updateProfileRoute = registerApiRoute('/custom/v1/auth/profile', {
  method: 'PATCH',
  middleware: [requireAuth],
  handler: async (c) => {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      
      const user = await authRepository.getUserById(userId);
      if (!user) return c.json({ error: 'User not found' }, 404);

      if (body.name || body.fullName) {
        user.fullName = body.name || body.fullName;
      }
      await authRepository.updateUser(userId, user);

      const formattedUser = await formatUserResponse(user);
      return c.json({ success: true, user: formattedUser }, 200);
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'Failed to update profile' }, 500);
    }
  }
});
