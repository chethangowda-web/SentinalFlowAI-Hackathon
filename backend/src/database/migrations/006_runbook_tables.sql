CREATE TABLE IF NOT EXISTS runbooks (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  service VARCHAR(100) NOT NULL,
  trigger_event VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  approval_required BOOLEAN DEFAULT FALSE,
  timeout_seconds INTEGER DEFAULT 600,
  retry_limit INTEGER DEFAULT 3,
  execution_steps JSONB NOT NULL,
  rollback_steps JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS runbook_executions (
  id UUID PRIMARY KEY,
  incident_id VARCHAR(255) NOT NULL,
  runbook_id UUID NOT NULL REFERENCES runbooks(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- PENDING, WAITING_APPROVAL, RUNNING, ROLLING_BACK, COMPLETED, FAILED, CANCELLED
  start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  trace_id VARCHAR(255),
  request_id VARCHAR(255),
  triggered_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS runbook_execution_steps (
  id UUID PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES runbook_executions(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL, -- PENDING, RUNNING, SUCCESS, FAILED, SKIPPED, ROLLBACK
  start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  output TEXT,
  error TEXT,
  retry_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_runbooks_trigger_event ON runbooks(trigger_event);
CREATE INDEX IF NOT EXISTS idx_runbook_executions_incident_id ON runbook_executions(incident_id);
CREATE INDEX IF NOT EXISTS idx_runbook_execution_steps_exec_id ON runbook_execution_steps(execution_id);
