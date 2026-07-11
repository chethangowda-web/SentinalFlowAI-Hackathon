CREATE TABLE IF NOT EXISTS decision_reports (
  id UUID PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES incidents(incident_id) ON DELETE CASCADE,
  overall_score NUMERIC(5,2) NOT NULL,
  confidence NUMERIC(5,2) NOT NULL,
  risk_level VARCHAR(50) NOT NULL,
  recommended_action TEXT NOT NULL,
  recommended_runbooks JSONB NOT NULL,
  recommended_engineer JSONB NOT NULL,
  estimated_resolution_time VARCHAR(100),
  estimated_business_impact VARCHAR(255),
  similar_incidents JSONB NOT NULL,
  possible_root_causes JSONB NOT NULL,
  reasoning TEXT NOT NULL,
  evidence JSONB NOT NULL,
  supporting_metrics JSONB NOT NULL,
  supporting_incidents JSONB NOT NULL,
  confidence_breakdown JSONB NOT NULL,
  explanation TEXT NOT NULL,
  approval_recommendation VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'GENERATED',
  outcome TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  decision_model_version VARCHAR(50) NOT NULL,
  prompt_version VARCHAR(50) NOT NULL,
  embedding_version VARCHAR(50) NOT NULL,
  created_by_model VARCHAR(50) NOT NULL,
  model_latency_ms INTEGER NOT NULL,
  token_usage JSONB NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS decision_feedback (
  id UUID PRIMARY KEY,
  decision_id UUID NOT NULL REFERENCES decision_reports(id) ON DELETE CASCADE,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  rejected BOOLEAN NOT NULL DEFAULT FALSE,
  manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  actual_root_cause TEXT,
  actual_resolution_time_ms INTEGER,
  was_recommendation_correct BOOLEAN DEFAULT TRUE,
  feedback TEXT,
  engineer VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_decision_reports_incident_id ON decision_reports(incident_id);
CREATE INDEX IF NOT EXISTS idx_decision_feedback_decision_id ON decision_feedback(decision_id);
