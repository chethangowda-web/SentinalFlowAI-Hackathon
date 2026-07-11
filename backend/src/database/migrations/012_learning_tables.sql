-- ============================================================
-- 012_learning_tables.sql
-- AI Learning & Continuous Improvement Platform
-- ============================================================

-- Operator feedback on AI recommendations
CREATE TABLE IF NOT EXISTS learning_feedback (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id           UUID NOT NULL,
  decision_id           UUID,
  session_id            UUID,
  engineer              VARCHAR(255),
  signal_type           VARCHAR(100) NOT NULL,
  -- signal_type: ACCEPTED_RECOMMENDATION | REJECTED_RECOMMENDATION |
  --              MANUAL_OVERRIDE | CORRECT_ROOT_CAUSE | WRONG_ROOT_CAUSE |
  --              CORRECT_RUNBOOK | FAILED_RUNBOOK
  was_correct           BOOLEAN,
  actual_root_cause     TEXT,
  actual_resolution     TEXT,
  comments              TEXT,
  satisfaction_score    INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- One learning session per resolved incident
CREATE TABLE IF NOT EXISTS learning_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id           UUID NOT NULL UNIQUE,
  status                VARCHAR(50) NOT NULL DEFAULT 'STARTED',
  -- status: STARTED | EXTRACTING | SCORING | OPTIMIZING | UPDATING | COMPLETED | FAILED
  phases_completed      TEXT[] DEFAULT '{}',
  outcome_score         NUMERIC(5,2),
  feedback_count        INTEGER DEFAULT 0,
  knowledge_updates     INTEGER DEFAULT 0,
  prompt_version_bump   BOOLEAN DEFAULT FALSE,
  error_message         TEXT,
  started_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at          TIMESTAMP WITH TIME ZONE
);

-- Versioned prompt history with performance metrics
CREATE TABLE IF NOT EXISTS prompt_versions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_name           VARCHAR(255) NOT NULL,
  version               INTEGER NOT NULL,
  content               TEXT NOT NULL,
  variables             JSONB DEFAULT '{}',
  status                VARCHAR(50) NOT NULL DEFAULT 'CANDIDATE',
  -- status: CANDIDATE | ACTIVE | DEPRECATED | ROLLED_BACK
  accuracy_rate         NUMERIC(5,4),
  hallucination_rate    NUMERIC(5,4),
  avg_latency_ms        INTEGER,
  sample_count          INTEGER DEFAULT 0,
  promoted_from_version INTEGER,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  promoted_at           TIMESTAMP WITH TIME ZONE,
  UNIQUE(prompt_name, version)
);

-- Audit log of all knowledge mutations (Qdrant + Postgres)
CREATE TABLE IF NOT EXISTS knowledge_updates (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID REFERENCES learning_sessions(id),
  incident_id           UUID NOT NULL,
  store_type            VARCHAR(50) NOT NULL,
  -- store_type: QDRANT | POSTGRES_INCIDENT | POSTGRES_RUNBOOK | POSTGRES_AGENT
  operation             VARCHAR(50) NOT NULL,
  -- operation: UPSERT | ENRICH | INDEX | DELETE
  entity_id             VARCHAR(255),
  changes               JSONB DEFAULT '{}',
  success               BOOLEAN NOT NULL DEFAULT TRUE,
  error_message         TEXT,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Per-decision precision/recall/F1/confidence-drift aggregates
CREATE TABLE IF NOT EXISTS recommendation_accuracy (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id           UUID NOT NULL,
  incident_id           UUID NOT NULL,
  precision_score       NUMERIC(5,4),
  recall_score          NUMERIC(5,4),
  accuracy_score        NUMERIC(5,4),
  f1_score              NUMERIC(5,4),
  confidence_at_creation NUMERIC(5,4),
  confidence_drift      NUMERIC(5,4),
  recommendation_success BOOLEAN,
  evaluation_notes      TEXT,
  evaluated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LLM evaluation runs per session
CREATE TABLE IF NOT EXISTS model_evaluations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID REFERENCES learning_sessions(id),
  model_name            VARCHAR(255) NOT NULL,
  prompt_version        VARCHAR(100),
  latency_ms            INTEGER,
  groundedness_score    NUMERIC(5,4),
  hallucination_score   NUMERIC(5,4),
  consistency_score     NUMERIC(5,4),
  reasoning_quality     NUMERIC(5,4),
  citation_coverage     NUMERIC(5,4),
  cost_usd              NUMERIC(10,6),
  token_count           INTEGER,
  evaluated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Per-agent learning metrics aggregated over time
CREATE TABLE IF NOT EXISTS agent_learning_metrics (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name            VARCHAR(255) NOT NULL,
  period_start          TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end            TIMESTAMP WITH TIME ZONE NOT NULL,
  total_decisions       INTEGER DEFAULT 0,
  correct_decisions     INTEGER DEFAULT 0,
  success_rate          NUMERIC(5,4),
  avg_token_cost        NUMERIC(10,6),
  mttr_improvement_pct  NUMERIC(5,2),
  feedback_incorporated INTEGER DEFAULT 0,
  hallucination_count   INTEGER DEFAULT 0,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_feedback_incident   ON learning_feedback(incident_id);
CREATE INDEX IF NOT EXISTS idx_learning_feedback_session    ON learning_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_incident   ON learning_sessions(incident_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_status     ON learning_sessions(status);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_name_status  ON prompt_versions(prompt_name, status);
CREATE INDEX IF NOT EXISTS idx_knowledge_updates_session    ON knowledge_updates(session_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_accuracy_inc  ON recommendation_accuracy(incident_id);
CREATE INDEX IF NOT EXISTS idx_model_evaluations_session    ON model_evaluations(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_learning_name          ON agent_learning_metrics(agent_name);
