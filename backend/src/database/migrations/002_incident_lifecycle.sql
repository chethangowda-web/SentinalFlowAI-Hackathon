CREATE TABLE IF NOT EXISTS incident_assignments (
  id UUID PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES incidents(incident_id) ON DELETE CASCADE,
  assigned_engineer_id VARCHAR(255) NOT NULL,
  assigned_engineer_name VARCHAR(255) NOT NULL,
  assigned_by VARCHAR(255) NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incident_assignments_incident_id ON incident_assignments(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_assignments_engineer_id ON incident_assignments(assigned_engineer_id);

CREATE TABLE IF NOT EXISTS incident_resolutions (
  id UUID PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES incidents(incident_id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  root_cause TEXT NOT NULL,
  corrective_actions TEXT NOT NULL,
  preventive_actions TEXT NOT NULL,
  resolved_by VARCHAR(255) NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incident_resolutions_incident_id ON incident_resolutions(incident_id);

CREATE TABLE IF NOT EXISTS incident_timeline (
  id UUID PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES incidents(incident_id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  actor VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  notes TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_incident_timeline_incident_id ON incident_timeline(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_timeline_timestamp ON incident_timeline(timestamp DESC);
