-- 1. Alter existing incidents table to support new lifecycle
ALTER TABLE incidents
ADD COLUMN priority VARCHAR(50) DEFAULT 'P4',
ADD COLUMN version INTEGER DEFAULT 1,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deleted_by VARCHAR(255);

-- Map old statuses to new Open status (assuming old ones were DETECTED, ACKNOWLEDGED, ASSIGNED)
UPDATE incidents
SET status = 'OPEN'
WHERE status IN ('DETECTED', 'ACKNOWLEDGED', 'ASSIGNED');

-- Ensure timeline table supports old and new values properly
ALTER TABLE incident_timeline
ADD COLUMN old_value VARCHAR(255),
ADD COLUMN new_value VARCHAR(255);

-- 2. Create Incident Notes table
CREATE TABLE IF NOT EXISTS incident_notes (
  id UUID PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES incidents(incident_id) ON DELETE CASCADE,
  author VARCHAR(255) NOT NULL,
  markdown TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incident_notes_incident_id ON incident_notes(incident_id);

-- 3. Create Incident Audit table for security history
CREATE TABLE IF NOT EXISTS incident_audits (
  id UUID PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES incidents(incident_id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  ip_address VARCHAR(255),
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incident_audits_incident_id ON incident_audits(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_audits_timestamp ON incident_audits(timestamp DESC);
