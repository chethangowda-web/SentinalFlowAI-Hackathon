CREATE TABLE IF NOT EXISTS incidents (
  incident_id UUID PRIMARY KEY,
  service VARCHAR(255) NOT NULL,
  application VARCHAR(255) NOT NULL,
  environment VARCHAR(50) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  raw_logs TEXT NOT NULL,
  confidence_score NUMERIC(5,2) DEFAULT 0,
  root_cause TEXT NOT NULL,
  ai_report JSONB,
  recommendations JSONB,
  similar_incidents JSONB,
  metadata JSONB,
  assigned_engineer VARCHAR(255),
  resolution TEXT,
  timeline JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidents_environment ON incidents(environment);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
