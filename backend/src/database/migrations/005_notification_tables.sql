CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id VARCHAR(255) PRIMARY KEY,
  slack_webhook VARCHAR(255),
  teams_webhook VARCHAR(255),
  discord_webhook VARCHAR(255),
  email VARCHAR(255),
  webhook_url VARCHAR(255),
  preferences JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL,
  correlation_id VARCHAR(255),
  channel VARCHAR(50) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'QUEUED', 'DELIVERED', 'FAILED', 'RETRIED'
  attempt_count INTEGER DEFAULT 0,
  provider_name VARCHAR(100),
  provider_response JSONB,
  error_message TEXT,
  template_version VARCHAR(50),
  rendered_payload TEXT,
  retry_history JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS escalation_policies (
  id UUID PRIMARY KEY,
  incident_id VARCHAR(255) NOT NULL,
  current_level INTEGER DEFAULT 0,
  max_level INTEGER DEFAULT 3,
  status VARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'
  last_escalated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  next_escalation_at TIMESTAMP WITH TIME ZONE,
  policy_data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS notification_deduplication (
  key VARCHAR(255) PRIMARY KEY,
  incident_id VARCHAR(255),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  occurrences INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_escalation_policies_status ON escalation_policies(status);
