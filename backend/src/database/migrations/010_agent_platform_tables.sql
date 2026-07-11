CREATE TABLE IF NOT EXISTS agent_status (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  state VARCHAR(50) NOT NULL DEFAULT 'CREATED',
  health_status VARCHAR(50) NOT NULL DEFAULT 'HEALTHY',
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_history (
  id UUID PRIMARY KEY,
  agent_name VARCHAR(100) NOT NULL,
  execution_time_ms INTEGER,
  tokens_used INTEGER,
  cost_usd NUMERIC(10, 6),
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY,
  memory_type VARCHAR(50) NOT NULL,
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (memory_type, key)
);

CREATE TABLE IF NOT EXISTS decision_traces (
  id UUID PRIMARY KEY,
  agent_name VARCHAR(100) NOT NULL,
  decision TEXT NOT NULL,
  confidence NUMERIC(3, 2),
  evidence JSONB,
  telemetry_used JSONB,
  model_used VARCHAR(100),
  prompt_version VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_history_agent_name ON agent_history(agent_name);
CREATE INDEX IF NOT EXISTS idx_decision_traces_agent_name ON decision_traces(agent_name);
