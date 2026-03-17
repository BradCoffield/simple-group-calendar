-- TRAILS Simple Group Calendar Schema
-- Run this against your Neon database to create the events table

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  description TEXT,
  location TEXT,
  submitted_by_user_id TEXT NOT NULL,
  submitted_by_name TEXT NOT NULL,
  submitted_by_org TEXT,
  color TEXT DEFAULT '#1a73e8',
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_events_approved ON events(approved);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_submitted_by_user_id ON events(submitted_by_user_id);
CREATE INDEX idx_events_approved_start_time ON events(approved, start_time);
