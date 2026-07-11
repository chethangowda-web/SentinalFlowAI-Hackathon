-- ============================================================
-- 013_ai_governance_logs.sql
-- Enkrypt AI Governance Audit Tables
-- ============================================================

-- Core governance audit log for all Enkrypt AI scanning decisions
CREATE TABLE IF NOT EXISTS ai_governance_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id           UUID NOT NULL,
  agent_name            VARCHAR(255) NOT NULL,
  scan_type             VARCHAR(50) NOT NULL,
  -- scan_type: PROMPT_SCAN | RESPONSE_SCAN | RUNBOOK_EVAL | DECISION_AUDIT | FINAL_APPROVAL
  prompt_hash           VARCHAR(64),
  response_hash         VARCHAR(64),
  risk_score            NUMERIC(5,2) DEFAULT 0,
  trust_score           NUMERIC(5,2) DEFAULT 100,
  compliance_score      NUMERIC(5,2) DEFAULT 100,
  safety_score          NUMERIC(5,2) DEFAULT 100,
  threat_level          VARCHAR(50) DEFAULT 'NONE',
  -- threat_level: NONE | LOW | MEDIUM | HIGH | CRITICAL
  violations            JSONB DEFAULT '[]',
  policy_breakdown      JSONB DEFAULT '{}',
  detector_details      JSONB DEFAULT '{}',
  approved              BOOLEAN DEFAULT TRUE,
  blocked               BOOLEAN DEFAULT FALSE,
  latency_ms            INTEGER DEFAULT 0,
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Summary table for per-incident governance status
CREATE TABLE IF NOT EXISTS ai_governance_summary (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id           UUID NOT NULL UNIQUE,
  total_scans           INTEGER DEFAULT 0,
  blocked_count         INTEGER DEFAULT 0,
  approved_count        INTEGER DEFAULT 0,
  highest_threat        VARCHAR(50) DEFAULT 'NONE',
  lowest_trust_score    NUMERIC(5,2) DEFAULT 100,
  lowest_compliance     NUMERIC(5,2) DEFAULT 100,
  overall_decision      VARCHAR(50) DEFAULT 'PENDING',
  -- overall_decision: PENDING | APPROVED | BLOCKED | REVIEW_REQUIRED
  summary               JSONB DEFAULT '{}',
  last_scan_at          TIMESTAMP WITH TIME ZONE,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Self-healing safe commands whitelist
CREATE TABLE IF NOT EXISTS self_healing_approvals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id           UUID NOT NULL,
  runbook_id            UUID,
  command               TEXT NOT NULL,
  command_type          VARCHAR(50) NOT NULL,
  -- command_type: KUBERNETES | SHELL | DATABASE | TERRAFORM | HELM
  risk_score            NUMERIC(5,2) DEFAULT 0,
  enkrypt_risk_score    NUMERIC(5,2) DEFAULT 0,
  human_approved        BOOLEAN DEFAULT FALSE,
  approved_by           VARCHAR(255),
  approved_at           TIMESTAMP WITH TIME ZONE,
  executed              BOOLEAN DEFAULT FALSE,
  execution_result      TEXT,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_governance_logs_incident   ON ai_governance_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_ai_governance_logs_scan_type  ON ai_governance_logs(scan_type);
CREATE INDEX IF NOT EXISTS idx_ai_governance_logs_threat     ON ai_governance_logs(threat_level);
CREATE INDEX IF NOT EXISTS idx_ai_governance_logs_created    ON ai_governance_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_governance_summary_incident ON ai_governance_summary(incident_id);
CREATE INDEX IF NOT EXISTS idx_self_healing_approvals_incident ON self_healing_approvals(incident_id);
