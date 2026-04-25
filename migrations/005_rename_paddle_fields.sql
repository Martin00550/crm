-- Migration: Rename Paddle-specific fields for clarity
-- This renames stripeCustomerId/stripeSubscriptionId to paddleCustomerId/paddleSubscriptionId
-- These fields have always stored Paddle data, but had confusing names

-- Rename stripe_customer_id to paddle_customer_id
ALTER TABLE agencies RENAME COLUMN stripe_customer_id TO paddle_customer_id;

-- Rename stripe_subscription_id to paddle_subscription_id
ALTER TABLE agencies RENAME COLUMN stripe_subscription_id TO paddle_subscription_id;

-- Add comments to clarify these are Paddle fields
COMMENT ON COLUMN agencies.paddle_customer_id IS 'Paddle customer ID for payment processing';
COMMENT ON COLUMN agencies.paddle_subscription_id IS 'Paddle subscription ID for recurring billing';
