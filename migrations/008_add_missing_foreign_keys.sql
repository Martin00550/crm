-- Migration: Add missing foreign key constraints
-- This ensures database-level referential integrity
-- Based on the schema definitions in src/db/schema.ts

-- Clients table FK (agency_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clients_agency_id_fkey'
    ) THEN
        ALTER TABLE clients
        ADD CONSTRAINT clients_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Policies table FKs (client_id, agency_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'policies_client_id_fkey'
    ) THEN
        ALTER TABLE policies
        ADD CONSTRAINT policies_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'policies_agency_id_fkey'
    ) THEN
        ALTER TABLE policies
        ADD CONSTRAINT policies_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Invitations table FK (agency_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'invitations_agency_id_fkey'
    ) THEN
        ALTER TABLE invitations
        ADD CONSTRAINT invitations_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Renewals table FKs (policy_id, agency_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'renewals_policy_id_fkey'
    ) THEN
        ALTER TABLE renewals
        ADD CONSTRAINT renewals_policy_id_fkey
        FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'renewals_agency_id_fkey'
    ) THEN
        ALTER TABLE renewals
        ADD CONSTRAINT renewals_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Commissions table FKs (policy_id, agency_id, agent_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'commissions_policy_id_fkey'
    ) THEN
        ALTER TABLE commissions
        ADD CONSTRAINT commissions_policy_id_fkey
        FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'commissions_agency_id_fkey'
    ) THEN
        ALTER TABLE commissions
        ADD CONSTRAINT commissions_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'commissions_agent_id_fkey'
    ) THEN
        ALTER TABLE commissions
        ADD CONSTRAINT commissions_agent_id_fkey
        FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Messages table FKs (client_id, agency_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'messages_client_id_fkey'
    ) THEN
        ALTER TABLE messages
        ADD CONSTRAINT messages_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'messages_agency_id_fkey'
    ) THEN
        ALTER TABLE messages
        ADD CONSTRAINT messages_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Documents table FKs (agency_id, policy_id, client_id, uploaded_by)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'documents_agency_id_fkey'
    ) THEN
        ALTER TABLE documents
        ADD CONSTRAINT documents_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'documents_policy_id_fkey'
    ) THEN
        ALTER TABLE documents
        ADD CONSTRAINT documents_policy_id_fkey
        FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'documents_client_id_fkey'
    ) THEN
        ALTER TABLE documents
        ADD CONSTRAINT documents_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'documents_uploaded_by_fkey'
    ) THEN
        ALTER TABLE documents
        ADD CONSTRAINT documents_uploaded_by_fkey
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Notifications table FKs (agency_id, user_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notifications_agency_id_fkey'
    ) THEN
        ALTER TABLE notifications
        ADD CONSTRAINT notifications_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notifications_user_id_fkey'
    ) THEN
        ALTER TABLE notifications
        ADD CONSTRAINT notifications_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Feature usage table FK (agency_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'feature_usage_agency_id_fkey'
    ) THEN
        ALTER TABLE feature_usage
        ADD CONSTRAINT feature_usage_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Notification settings table FKs (agency_id, user_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notification_settings_agency_id_fkey'
    ) THEN
        ALTER TABLE notification_settings
        ADD CONSTRAINT notification_settings_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notification_settings_user_id_fkey'
    ) THEN
        ALTER TABLE notification_settings
        ADD CONSTRAINT notification_settings_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Invoices table FK (agency_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'invoices_agency_id_fkey'
    ) THEN
        ALTER TABLE invoices
        ADD CONSTRAINT invoices_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Payments table FKs (agency_id, invoice_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'payments_agency_id_fkey'
    ) THEN
        ALTER TABLE payments
        ADD CONSTRAINT payments_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'payments_invoice_id_fkey'
    ) THEN
        ALTER TABLE payments
        ADD CONSTRAINT payments_invoice_id_fkey
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Subscription history table FK (agency_id, performed_by)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscription_history_agency_id_fkey'
    ) THEN
        ALTER TABLE subscription_history
        ADD CONSTRAINT subscription_history_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscription_history_performed_by_fkey'
    ) THEN
        ALTER TABLE subscription_history
        ADD CONSTRAINT subscription_history_performed_by_fkey
        FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Users table FK (agency_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_agency_id_fkey'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_agency_id_fkey
        FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL;
    END IF;
END $$;
