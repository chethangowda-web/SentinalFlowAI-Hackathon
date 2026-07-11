CREATE TABLE IF NOT EXISTS organizations (
  organization_id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'FREE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(organization_id) ON DELETE CASCADE,
  timezone VARCHAR(100) DEFAULT 'UTC',
  business_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}',
  notification_defaults JSONB DEFAULT '{}',
  retention_policy_days INTEGER DEFAULT 30,
  default_severity VARCHAR(50) DEFAULT 'MEDIUM',
  branding JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING' -- PENDING, ACCEPTED, EXPIRED, REVOKED
);

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(organization_id) ON DELETE SET NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- OWNER, ADMIN, SECURITY_ENGINEER, etc.
  status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, LOCKED
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  backup_codes JSONB DEFAULT '[]',
  login_attempts INTEGER DEFAULT 0,
  lockout_until TIMESTAMP WITH TIME ZONE,
  password_history JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
  team_id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID REFERENCES teams(team_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  device VARCHAR(255),
  browser VARCHAR(255),
  os VARCHAR(255),
  ip VARCHAR(100),
  location VARCHAR(255),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  rotated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS api_keys (
  api_key_id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  hashed_key VARCHAR(255) NOT NULL,
  prefix VARCHAR(50) NOT NULL,
  scopes JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  last_used TIMESTAMP WITH TIME ZONE,
  rotated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'ACTIVE' -- ACTIVE, REVOKED, EXPIRED
);

-- Scoping columns added to existing tables
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(organization_id) ON DELETE SET NULL;
ALTER TABLE runbooks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(organization_id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(organization_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(hashed_key);
