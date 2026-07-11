import { IAuthRepository } from '../../auth/repositories/IAuthRepository';
import { IOrganizationRepository } from '../../auth/repositories/IOrganizationRepository';
import { ITeamRepository } from '../../auth/repositories/ITeamRepository';
import { ISessionRepository } from '../../auth/repositories/ISessionRepository';
import { User, ApiKey, Organization, OrganizationSettings, OrganizationInvitation, Team, Session, RefreshToken, UserRole } from '../../auth/types/types';
import { dbClient, DatabaseClient } from '../client/DatabaseClient';
import { DatabaseError } from '../../core/errors/DatabaseError';

export class AuthRepository implements IAuthRepository, IOrganizationRepository, ITeamRepository, ISessionRepository {
  private db: DatabaseClient;

  constructor() {
    this.db = dbClient;
  }

  // --- Users ---
  public async createUser(user: User): Promise<User> {
    const text = `
      INSERT INTO users (
        user_id, organization_id, email, full_name, password_hash, role, status, mfa_enabled, mfa_secret, backup_codes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const params = [
      user.userId,
      user.organizationId || null,
      user.email,
      user.fullName,
      user.passwordHash,
      user.role,
      user.status,
      user.mfaEnabled,
      user.mfaSecret || null,
      JSON.stringify(user.backupCodes),
    ];
    const rows = await this.db.query(text, params);
    if (!rows.length) throw new DatabaseError('Failed to create user');
    return this.mapToUser(rows[0]);
  }

  public async getUserById(userId: string): Promise<User | null> {
    const text = `SELECT * FROM users WHERE user_id = $1`;
    const rows = await this.db.query(text, [userId]);
    return rows.length ? this.mapToUser(rows[0]) : null;
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    const text = `SELECT * FROM users WHERE email = $1`;
    const rows = await this.db.query(text, [email]);
    return rows.length ? this.mapToUser(rows[0]) : null;
  }

  public async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const text = `
      UPDATE users
      SET organization_id = COALESCE($1, organization_id),
          email = COALESCE($2, email),
          full_name = COALESCE($3, full_name),
          password_hash = COALESCE($4, password_hash),
          role = COALESCE($5, role),
          status = COALESCE($6, status),
          login_attempts = COALESCE($7, login_attempts),
          lockout_until = COALESCE($8, lockout_until),
          password_history = COALESCE($9, password_history),
          updated_at = NOW()
      WHERE user_id = $10;
    `;
    await this.db.query(text, [
      updates.organizationId || null,
      updates.email || null,
      updates.fullName || null,
      updates.passwordHash || null,
      updates.role || null,
      updates.status || null,
      updates.loginAttempts === undefined ? null : updates.loginAttempts,
      updates.lockoutUntil || null,
      updates.passwordHistory ? JSON.stringify(updates.passwordHistory) : null,
      userId,
    ]);
  }

  // --- Api Keys ---
  public async createApiKey(key: ApiKey): Promise<ApiKey> {
    const text = `
      INSERT INTO api_keys (
        api_key_id, organization_id, name, hashed_key, prefix, scopes, created_by, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const params = [
      key.apiKeyId,
      key.organizationId,
      key.name,
      key.hashedKey,
      key.prefix,
      JSON.stringify(key.scopes),
      key.createdBy || null,
      key.expiresAt || null,
    ];
    const rows = await this.db.query(text, params);
    return this.mapToApiKey(rows[0]);
  }

  public async getApiKeyByHash(hashedKey: string): Promise<ApiKey | null> {
    const text = `SELECT * FROM api_keys WHERE hashed_key = $1 AND status = 'ACTIVE'`;
    const rows = await this.db.query(text, [hashedKey]);
    return rows.length ? this.mapToApiKey(rows[0]) : null;
  }

  public async listApiKeys(orgId: string): Promise<ApiKey[]> {
    const text = `SELECT * FROM api_keys WHERE organization_id = $1`;
    const rows = await this.db.query(text, [orgId]);
    return rows.map(r => this.mapToApiKey(r));
  }

  public async revokeApiKey(apiKeyId: string): Promise<void> {
    const text = `UPDATE api_keys SET status = 'REVOKED' WHERE api_key_id = $1`;
    await this.db.query(text, [apiKeyId]);
  }

  // --- Organizations ---
  public async createOrganizationWithUser(org: Organization, settings: OrganizationSettings, user: User): Promise<{ organization: Organization; user: User }> {
    return this.db.transaction(async (client) => {
      const orgText = `
        INSERT INTO organizations (organization_id, name, slug, plan)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const orgRes = await client.query(orgText, [org.organizationId, org.name, org.slug, org.plan]);

      const setVal = `
        INSERT INTO organization_settings (
          organization_id, timezone, business_hours, notification_defaults, retention_policy_days, default_severity, branding
        ) VALUES ($1, $2, $3, $4, $5, $6, $7);
      `;
      await client.query(setVal, [
        org.organizationId,
        settings.timezone,
        JSON.stringify(settings.businessHours),
        JSON.stringify(settings.notificationDefaults),
        settings.retentionPolicyDays,
        settings.defaultSeverity,
        JSON.stringify(settings.branding),
      ]);

      const userText = `
        INSERT INTO users (
          user_id, organization_id, email, full_name, password_hash, role, status, mfa_enabled, mfa_secret, backup_codes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;
      const userParams = [
        user.userId,
        org.organizationId,
        user.email,
        user.fullName,
        user.passwordHash,
        user.role,
        user.status,
        user.mfaEnabled,
        user.mfaSecret || null,
        JSON.stringify(user.backupCodes),
      ];
      const userRes = await client.query(userText, userParams);
      if (!userRes.rows.length) throw new DatabaseError('Failed to create user');

      return { organization: this.mapToOrg(orgRes.rows[0]), user: this.mapToUser(userRes.rows[0]) };
    });
  }

  public async createOrganization(org: Organization, settings: OrganizationSettings): Promise<Organization> {
    return this.db.transaction(async (client) => {
      const orgText = `
        INSERT INTO organizations (organization_id, name, slug, plan)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const orgRes = await client.query(orgText, [org.organizationId, org.name, org.slug, org.plan]);

      const setVal = `
        INSERT INTO organization_settings (
          organization_id, timezone, business_hours, notification_defaults, retention_policy_days, default_severity, branding
        ) VALUES ($1, $2, $3, $4, $5, $6, $7);
      `;
      await client.query(setVal, [
        org.organizationId,
        settings.timezone,
        JSON.stringify(settings.businessHours),
        JSON.stringify(settings.notificationDefaults),
        settings.retentionPolicyDays,
        settings.defaultSeverity,
        JSON.stringify(settings.branding),
      ]);

      return this.mapToOrg(orgRes.rows[0]);
    });
  }

  public async getOrganizationById(id: string): Promise<Organization | null> {
    const text = `SELECT * FROM organizations WHERE organization_id = $1`;
    const rows = await this.db.query(text, [id]);
    return rows.length ? this.mapToOrg(rows[0]) : null;
  }

  public async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    const text = `SELECT * FROM organizations WHERE slug = $1`;
    const rows = await this.db.query(text, [slug]);
    return rows.length ? this.mapToOrg(rows[0]) : null;
  }

  public async listOrganizations(): Promise<Organization[]> {
    const text = `SELECT * FROM organizations`;
    const rows = await this.db.query(text);
    return rows.map(r => this.mapToOrg(r));
  }

  public async updateOrganization(id: string, updates: Partial<Organization>): Promise<void> {
    const text = `UPDATE organizations SET name = COALESCE($1, name), plan = COALESCE($2, plan), updated_at = NOW() WHERE organization_id = $3`;
    await this.db.query(text, [updates.name || null, updates.plan || null, id]);
  }

  // --- Invitations ---
  public async createInvitation(invite: OrganizationInvitation): Promise<OrganizationInvitation> {
    const text = `
      INSERT INTO organization_invitations (id, organization_id, email, role, token, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const rows = await this.db.query(text, [
      invite.id, invite.organizationId, invite.email, invite.role, invite.token, invite.expiresAt
    ]);
    return this.mapToInvite(rows[0]);
  }

  public async getInvitationByToken(token: string): Promise<OrganizationInvitation | null> {
    const text = `SELECT * FROM organization_invitations WHERE token = $1 AND status = 'PENDING' AND expires_at > NOW()`;
    const rows = await this.db.query(text, [token]);
    return rows.length ? this.mapToInvite(rows[0]) : null;
  }

  public async updateInvitationStatus(id: string, status: string): Promise<void> {
    const text = `UPDATE organization_invitations SET status = $1 WHERE id = $2`;
    await this.db.query(text, [status, id]);
  }

  // --- Teams ---
  public async createTeam(team: Team): Promise<Team> {
    const text = `
      INSERT INTO teams (team_id, organization_id, name, description, owner_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const rows = await this.db.query(text, [
      team.teamId, team.organizationId, team.name, team.description || null, team.ownerId || null
    ]);
    return this.mapToTeam(rows[0]);
  }

  public async getTeamById(teamId: string): Promise<Team | null> {
    const text = `SELECT * FROM teams WHERE team_id = $1`;
    const rows = await this.db.query(text, [teamId]);
    return rows.length ? this.mapToTeam(rows[0]) : null;
  }

  public async listTeams(orgId: string): Promise<Team[]> {
    const text = `SELECT * FROM teams WHERE organization_id = $1`;
    const rows = await this.db.query(text, [orgId]);
    return rows.map(r => this.mapToTeam(r));
  }

  public async updateTeam(teamId: string, updates: Partial<Team>): Promise<void> {
    const text = `UPDATE teams SET name = COALESCE($1, name), description = COALESCE($2, description), updated_at = NOW() WHERE team_id = $3`;
    await this.db.query(text, [updates.name || null, updates.description || null, teamId]);
  }

  public async deleteTeam(teamId: string): Promise<void> {
    const text = `DELETE FROM teams WHERE team_id = $1`;
    await this.db.query(text, [teamId]);
  }

  public async addTeamMember(teamId: string, userId: string): Promise<void> {
    const text = `INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`;
    await this.db.query(text, [teamId, userId]);
  }

  public async removeTeamMember(teamId: string, userId: string): Promise<void> {
    const text = `DELETE FROM team_members WHERE team_id = $1 AND user_id = $2`;
    await this.db.query(text, [teamId, userId]);
  }

  public async listTeamMembers(teamId: string): Promise<User[]> {
    const text = `
      SELECT u.* FROM users u
      JOIN team_members tm ON tm.user_id = u.user_id
      WHERE tm.team_id = $1
    `;
    const rows = await this.db.query(text, [teamId]);
    return rows.map(r => this.mapToUser(r));
  }

  // --- Sessions ---
  public async createSession(session: Session): Promise<Session> {
    const text = `
      INSERT INTO sessions (id, user_id, device, browser, os, ip, location)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const rows = await this.db.query(text, [
      session.id, session.userId, session.device || null, session.browser || null, session.os || null, session.ip || null, session.location || null
    ]);
    return this.mapToSession(rows[0]);
  }

  public async getSessionById(id: string): Promise<Session | null> {
    const text = `SELECT * FROM sessions WHERE id = $1`;
    const rows = await this.db.query(text, [id]);
    return rows.length ? this.mapToSession(rows[0]) : null;
  }

  public async listSessions(userId: string): Promise<Session[]> {
    const text = `SELECT * FROM sessions WHERE user_id = $1 ORDER BY last_seen DESC`;
    const rows = await this.db.query(text, [userId]);
    return rows.map(r => this.mapToSession(r));
  }

  public async revokeSession(id: string): Promise<void> {
    const text = `DELETE FROM sessions WHERE id = $1`;
    await this.db.query(text, [id]);
  }

  public async revokeAllSessions(userId: string): Promise<void> {
    const text = `DELETE FROM sessions WHERE user_id = $1`;
    await this.db.query(text, [userId]);
  }

  public async revokeOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    const text = `DELETE FROM sessions WHERE user_id = $1 AND id != $2`;
    await this.db.query(text, [userId, currentSessionId]);
  }

  // --- Refresh Tokens ---
  public async createRefreshToken(token: RefreshToken): Promise<RefreshToken> {
    const text = `
      INSERT INTO refresh_tokens (id, user_id, token_hash, rotated, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const rows = await this.db.query(text, [
      token.id, token.userId, token.tokenHash, token.rotated, token.expiresAt
    ]);
    return this.mapToRefreshToken(rows[0]);
  }

  public async getRefreshTokenByHash(hash: string): Promise<RefreshToken | null> {
    const text = `SELECT * FROM refresh_tokens WHERE token_hash = $1 AND rotated = FALSE AND expires_at > NOW()`;
    const rows = await this.db.query(text, [hash]);
    return rows.length ? this.mapToRefreshToken(rows[0]) : null;
  }

  public async rotateRefreshToken(id: string): Promise<void> {
    const text = `UPDATE refresh_tokens SET rotated = TRUE WHERE id = $1`;
    await this.db.query(text, [id]);
  }

  public async revokeAllRefreshTokens(userId: string): Promise<void> {
    const text = `DELETE FROM refresh_tokens WHERE user_id = $1`;
    await this.db.query(text, [userId]);
  }

  // --- Mappers ---
  private mapToUser(r: any): User {
    return {
      userId: r.user_id,
      organizationId: r.organization_id,
      email: r.email,
      fullName: r.full_name,
      passwordHash: r.password_hash,
      role: r.role as UserRole,
      status: r.status,
      mfaEnabled: r.mfa_enabled,
      mfaSecret: r.mfa_secret,
      backupCodes: r.backup_codes || [],
      loginAttempts: r.login_attempts,
      lockoutUntil: r.lockout_until,
      passwordHistory: r.password_history || [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  private mapToApiKey(r: any): ApiKey {
    return {
      apiKeyId: r.api_key_id,
      organizationId: r.organization_id,
      name: r.name,
      hashedKey: r.hashed_key,
      prefix: r.prefix,
      scopes: r.scopes || [],
      createdBy: r.created_by,
      lastUsed: r.last_used,
      rotatedAt: r.rotated_at,
      expiresAt: r.expires_at,
      status: r.status,
    };
  }

  private mapToOrg(r: any): Organization {
    return {
      organizationId: r.organization_id,
      name: r.name,
      slug: r.slug,
      plan: r.plan,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  private mapToInvite(r: any): OrganizationInvitation {
    return {
      id: r.id,
      organizationId: r.organization_id,
      email: r.email,
      role: r.role as UserRole,
      token: r.token,
      expiresAt: r.expires_at,
      status: r.status,
    };
  }

  private mapToTeam(r: any): Team {
    return {
      teamId: r.team_id,
      organizationId: r.organization_id,
      name: r.name,
      description: r.description,
      ownerId: r.owner_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  private mapToSession(r: any): Session {
    return {
      id: r.id,
      userId: r.user_id,
      device: r.device,
      browser: r.browser,
      os: r.os,
      ip: r.ip,
      location: r.location,
      lastSeen: r.last_seen,
      createdAt: r.created_at,
    };
  }

  private mapToRefreshToken(r: any): RefreshToken {
    return {
      id: r.id,
      userId: r.user_id,
      tokenHash: r.token_hash,
      rotated: r.rotated,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
    };
  }
}

export const authRepository = new AuthRepository();
export const organizationRepository = authRepository;
export const teamRepository = authRepository;
export const sessionRepository = authRepository;
