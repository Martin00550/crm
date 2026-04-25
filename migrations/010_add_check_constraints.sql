-- Migration: Add CHECK constraints for enum columns
-- This ensures only valid values are accepted for role, status, and other enum-like fields
-- Based on insurance agency CRM requirements

-- Users role check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_role_check'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('owner', 'admin', 'agent', 'csr', 'producer'));
    END IF;
END $$;

-- Agencies subscription tier check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'agencies_subscription_tier_check'
    ) THEN
        ALTER TABLE agencies
        ADD CONSTRAINT agencies_subscription_tier_check
        CHECK (subscription_tier IN ('solo', 'growth', 'enterprise'));
    END IF;
END $$;

-- Agencies subscription status check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'agencies_subscription_status_check'
    ) THEN
        ALTER TABLE agencies
        ADD CONSTRAINT agencies_subscription_status_check
        CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'cancelled', 'paused'));
    END IF;
END $$;

-- Invitations status check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'invitations_status_check'
    ) THEN
        ALTER TABLE invitations
        ADD CONSTRAINT invitations_status_check
        CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'));
    END IF;
END $$;

-- Invitations role check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'invitations_role_check'
    ) THEN
        ALTER TABLE invitations
        ADD CONSTRAINT invitations_role_check
        CHECK (role IN ('owner', 'admin', 'agent', 'csr', 'producer'));
    END IF;
END $$;

-- Policies status check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'policies_status_check'
    ) THEN
        ALTER TABLE policies
        ADD CONSTRAINT policies_status_check
        CHECK (status IN ('active', 'expired', 'cancelled', 'pending', 'lapsed'));
    END IF;
END $$;

-- Policies health status check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'policies_health_status_check'
    ) THEN
        ALTER TABLE policies
        ADD CONSTRAINT policies_health_status_check
        CHECK (health_status IN ('healthy', 'warning', 'at-risk', 'unknown'));
    END IF;
END $$;

-- Renewals status check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'renewals_status_check'
    ) THEN
        ALTER TABLE renewals
        ADD CONSTRAINT renewals_status_check
        CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'missed'));
    END IF;
END $$;

-- Commissions carrier payout status check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'commissions_carrier_payout_status_check'
    ) THEN
        ALTER TABLE commissions
        ADD CONSTRAINT commissions_carrier_payout_status_check
        CHECK (carrier_payout_status IN ('pending', 'paid', 'failed', 'cancelled'));
    END IF;
END $$;

-- Invoices status check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'invoices_status_check'
    ) THEN
        ALTER TABLE invoices
        ADD CONSTRAINT invoices_status_check
        CHECK (status IN ('pending', 'paid', 'failed', 'refunded'));
    END IF;
END $$;

-- Payments status check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'payments_status_check'
    ) THEN
        ALTER TABLE payments
        ADD CONSTRAINT payments_status_check
        CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));
    END IF;
END $$;

-- Notifications type check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notifications_type_check'
    ) THEN
        ALTER TABLE notifications
        ADD CONSTRAINT notifications_type_check
        CHECK (type IN ('info', 'warning', 'success', 'error'));
    END IF;
END $$;

-- Subscription history action check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscription_history_action_check'
    ) THEN
        ALTER TABLE subscription_history
        ADD CONSTRAINT subscription_history_action_check
        CHECK (action IN ('created', 'upgraded', 'downgraded', 'cancelled', 'reactivated'));
    END IF;
END $$;

-- Subscription history previous tier check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscription_history_previous_tier_check'
    ) THEN
        ALTER TABLE subscription_history
        ADD CONSTRAINT subscription_history_previous_tier_check
        CHECK (previous_tier IS NULL OR previous_tier IN ('solo', 'growth', 'enterprise'));
    END IF;
END $$;

-- Subscription history new tier check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscription_history_new_tier_check'
    ) THEN
        ALTER TABLE subscription_history
        ADD CONSTRAINT subscription_history_new_tier_check
        CHECK (new_tier IS NULL OR new_tier IN ('solo', 'growth', 'enterprise'));
    END IF;
END $$;
