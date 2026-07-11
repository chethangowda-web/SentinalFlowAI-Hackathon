CREATE TABLE IF NOT EXISTS dead_letter_events (
  id UUID PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  error TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  failed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  stack_trace TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  replayed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_dead_letter_events_type ON dead_letter_events(event_type);
CREATE INDEX idx_dead_letter_events_resolved ON dead_letter_events(resolved);
