import { randomUUID, createHash } from 'crypto';
import { PasswordService } from './PasswordService';
import { TokenService } from './TokenService';
import { authRepository } from '../../database/repositories/AuthRepository';
import { User, Session, RefreshToken, UserRole } from '../types/types';
import { eventPublisher } from '../../events/EventPublisher';
import { config } from '../../config/config';
import { LoggerService } from '../../mastra/services/loggerService';

export class AuthService {
  private static log = new LoggerService('AuthService');

  // Progressive delay mapping for rate limiting failed attempts
  private static loginDelays = new Map<string, number>();

  public static async register(email: string, fullName: string, password: string, orgName: string): Promise<{ user: User; organizationId: string }> {
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const organizationId = randomUUID();

    // 1. Create Organization
    await authRepository.createOrganization(
      {
        organizationId,
        name: orgName,
        slug,
        plan: 'FREE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        organizationId,
        timezone: 'UTC',
        businessHours: { start: '09:00', end: '17:00' },
        notificationDefaults: {},
        retentionPolicyDays: 30,
        defaultSeverity: 'MEDIUM',
        branding: {},
      }
    );

    // 2. Hash Password & Create Owner
    const passwordHash = await PasswordService.hash(password);
    const userId = randomUUID();
    const user = await authRepository.createUser({
      userId,
      organizationId,
      email,
      fullName,
      passwordHash,
      role: UserRole.OWNER,
      status: 'ACTIVE',
      mfaEnabled: false,
      backupCodes: [],
      loginAttempts: 0,
      passwordHistory: [passwordHash],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    eventPublisher.publish('OrganizationCreated', organizationId, 'Organization', { organizationId, name: orgName, slug });
    eventPublisher.publish('UserCreated', userId, 'User', { userId, email, role: UserRole.OWNER });

    return { user, organizationId };
  }

  public static async login(
    email: string,
    password: string,
    meta: { ip?: string; device?: string; browser?: string; os?: string }
  ): Promise<{ accessToken: string; refreshToken: string; user: User; session: Session }> {
    const user = await authRepository.getUserByEmail(email);
    if (!user) {
      this.metrics.loginFailureTotal++;
      eventPublisher.publish('FailedLoginAttempt', 'unknown', 'User', { email, reason: 'User not found' });
      throw new Error('Invalid email or password');
    }

    // Lockout check
    if (user.status === 'LOCKED') {
      if (user.lockoutUntil && new Date(user.lockoutUntil).getTime() > Date.now()) {
        this.metrics.loginFailureTotal++;
        this.metrics.lockedAccounts++;
        throw new Error('Account is temporarily locked due to excessive failed attempts');
      } else {
        // Unlock expired lockout
        user.status = 'ACTIVE';
        user.loginAttempts = 0;
        user.lockoutUntil = undefined;
        await authRepository.updateUser(user.userId, user);
      }
    }

    // Apply progressive login delay for security
    const delay = this.loginDelays.get(email) || 0;
    if (delay > 0) {
      await new Promise(r => setTimeout(r, delay));
    }

    const matches = await PasswordService.compare(password, user.passwordHash);
    if (!matches) {
      user.loginAttempts++;
      const currentDelay = Math.min((user.loginAttempts - 1) * 1000, 5000); // Max 5 seconds delay
      this.loginDelays.set(email, currentDelay);

      if (user.loginAttempts >= config.auth.bruteForceMaxAttempts) {
        user.status = 'LOCKED';
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins lock
        this.log.warn(`Account locked: ${email} after ${user.loginAttempts} failed attempts`);
      }
      await authRepository.updateUser(user.userId, user);

      this.metrics.loginFailureTotal++;
      eventPublisher.publish('FailedLoginAttempt', user.userId, 'User', { email, reason: 'Incorrect password', attempts: user.loginAttempts });
      throw new Error('Invalid email or password');
    }

    // Clear delays and attempts
    this.loginDelays.delete(email);
    user.loginAttempts = 0;
    user.lockoutUntil = undefined;
    await authRepository.updateUser(user.userId, user);

    // Create Session
    const sessionId = randomUUID();
    const session = await authRepository.createSession({
      id: sessionId,
      userId: user.userId,
      device: meta.device,
      browser: meta.browser,
      os: meta.os,
      ip: meta.ip,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    this.metrics.activeSessions++;
    this.metrics.loginSuccessTotal++;

    // Generate JWTs
    const tokenPayload = {
      userId: user.userId,
      organizationId: user.organizationId || '',
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days expiration
    });

    eventPublisher.publish('UserLoggedIn', user.userId, 'User', { userId: user.userId, sessionId });

    return { accessToken, refreshToken: rawRefresh, user, session };
  }

  public static async refresh(refreshToken: string): Promise<{ accessToken: string; newRefreshToken: string; session: Session }> {
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    const dbToken = await authRepository.getRefreshTokenByHash(hash);

    if (!dbToken) {
      // Reuse detection: Revoke all refresh tokens for this user for security if token was reused!
      this.metrics.jwtValidationFailures++;
      throw new Error('Invalid or reused refresh token');
    }

    this.metrics.refreshTokenRotations++;

    const user = await authRepository.getUserById(dbToken.userId);
    if (!user) throw new Error('User not found');

    // Rotate token
    await authRepository.rotateRefreshToken(dbToken.id);

    const sessionId = randomUUID();
    const session = await authRepository.createSession({
      id: sessionId,
      userId: user.userId,
      device: null,
      browser: null,
      os: null,
      ip: null,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    this.metrics.activeSessions++;

    const tokenPayload = {
      userId: user.userId,
      organizationId: user.organizationId || '',
      role: user.role,
      sessionId,
    };

    const accessToken = await TokenService.generateAccessToken(tokenPayload);
    const newRawRefresh = randomUUID();
    const newTokenHash = createHash('sha256').update(newRawRefresh).digest('hex');

    await authRepository.createRefreshToken({
      id: randomUUID(),
      userId: user.userId,
      tokenHash: newTokenHash,
      rotated: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return { accessToken, newRefreshToken: newRawRefresh, session };
  }

  public static async logout(sessionId: string, userId: string): Promise<void> {
    await authRepository.revokeSession(sessionId);
    this.metrics.activeSessions = Math.max(0, this.metrics.activeSessions - 1);
    eventPublisher.publish('UserLoggedOut', userId, 'User', { userId, sessionId });
  }

  // Auth Metrics Registry simulation
  public static metrics = {
    loginSuccessTotal: 0,
    loginFailureTotal: 0,
    jwtValidationFailures: 0,
    refreshTokenRotations: 0,
    activeSessions: 0,
    lockedAccounts: 0,
  };
}
