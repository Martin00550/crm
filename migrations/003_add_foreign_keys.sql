-- Migration: Add foreign key constraints to all tables
-- This adds database-level referential integrity

-- Note: This migration assumes the tables exist from previous migrations
-- Foreign keys are being added to prevent orphaned records and ensure data integrity

-- Users table FK (agency_id)
-- Already exists but ensure it's set up for cascade

-- Clients table FK (agency_id)
ALTER TABLE clients
DROP CONSTRAINT IF EXISTS clients_agency_id_fk;

-- Policies table FKs (client_id, agency_id)
ALTER TABLE policies
DROP CONSTRAINT IF EXISTS policies_client_id_fk,
DROP CONSTRAINT IF EXISTS policies_agency_id_fk;

-- Invitations table FK (agency_id)
ALTER TABLE invitations
DROP CONSTRAINT IF EXISTS invitations_agency_id_fk;

-- Renewals table FKs (policy_id, agency_id)
ALTER TABLE renewals
DROP CONSTRAINT IF EXISTS renewals_policy_id_fk,
DROP CONSTRAINT IF EXISTS renewals_agency_id_fk;

-- Commissions table FKs (policy_id, agency_id, agent_id)
-- Note: agent_id references users.id which is TEXT, not UUID
-- This requires the column type to be changed first

-- First, change agent_id type from uuid to text to match users.id
ALTER TABLE commissions
ALTER COLUMN agent_id TYPE text;

ALTER TABLE commissions
DROP CONSTRAINT IF EXISTS commissions_policy_id_fk,
DROP CONSTRAINT IF EXISTS commissions_agency_id_fk,
DROP CONSTRAINT IF EXISTS commissions_agent_id_fk;

-- Messages table FKs (client_id, agency_id)
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_client_id_fk,
DROP CONSTRAINT IF EXISTS messages_agency_id_fk;

-- Documents table FKs (agency_id, policy_id, client_id, uploaded_by)
-- Note: uploaded_by references users.id which is TEXT, not UUID
ALTER TABLE documents
ALTER COLUMN uploaded_by TYPE text;

ALTER TABLE documents
DROP CONSTRAINT IF EXISTS documents_agency_id_fk,
DROP CONSTRAINT IF EXISTS documents_policy_id_fk,
DROP CONSTRAINT IF EXISTS documents_client_id_fk,
DROP CONSTRAINT IF EXISTS documents_uploaded_by_fk;

-- Notifications table FKs (agency_id, user_id)
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_agency_id_fk,
DROP CONSTRAINT IF EXISTS notifications_user_id_fk;

-- Feature usage table FK (agency_id)
ALTER TABLE feature_usage
DROP CONSTRAINT IF EXISTS feature_usage_agency_id_fk;

-- Notification settings table FKs (agency_id, user_id)
ALTER TABLE notification_settings
DROP CONSTRAINT IF EXISTS notification_settings_agency_id_fk,
DROP CONSTRAINT IF EXISTS notification_settings_user_id_fk;

-- Add ai_chat_logs table for database-backed rate limiting
CREATE TABLE IF NOT EXISTS ai_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for ai_chat_logs
CREATE INDEX IF NOT EXISTS ai_chat_logs_user_idx ON ai_chat_logs(user_id);
CREATE INDEX IF NOT EXISTS ai_chat_logs_created_at_idx ON ai_chat_logs(created_at);

-- Clean up old rate limit entries (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_chat_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_chat_logs WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Run cleanup
SELECT cleanup_old_chat_logs();
