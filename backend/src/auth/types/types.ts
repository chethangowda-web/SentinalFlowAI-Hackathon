export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  SECURITY_ENGINEER = 'SECURITY_ENGINEER',
  DEVOPS_ENGINEER = 'DEVOPS_ENGINEER',
  SRE = 'SRE',
  DEVELOPER = 'DEVELOPER',
  VIEWER = 'VIEWER',
}

export interface Organization {
  organizationId: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  organizationId: string;
  timezone: string;
  businessHours: Record<string, string>;
  notificationDefaults: Record<string, any>;
  retentionPolicyDays: number;
  defaultSeverity: string;
  branding: Record<string, any>;
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: UserRole;
  token: string;
  expiresAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
}

export interface User {
  userId: string;
  organizationId?: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: UserRole;
  status: 'ACTIVE' | 'LOCKED';
  mfaEnabled: boolean;
  mfaSecret?: string;
  backupCodes: string[];
  loginAttempts: number;
  lockoutUntil?: string;
  passwordHistory: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  teamId: string;
  organizationId: string;
  name: string;
  description?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  device?: string;
  browser?: string;
  os?: string;
  ip?: string;
  location?: string;
  lastSeen: string;
  createdAt: string;
}

export interface ApiKey {
  apiKeyId: string;
  organizationId: string;
  name: string;
  hashedKey: string;
  prefix: string;
  scopes: string[];
  createdBy?: string;
  lastUsed?: string;
  rotatedAt?: string;
  expiresAt?: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  rotated: boolean;
  createdAt: string;
  expiresAt: string;
}
