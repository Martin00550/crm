-- Add trial_end column to agencies table
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP;

-- Set default trial period for existing agencies (14 days from now)
UPDATE agencies 
SET trial_end = NOW() + INTERVAL '14 days'
WHERE trial_end IS NULL AND subscription_status = 'trialing';

-- Update existing active subscriptions to have trial_end in the past (they're already active)
UPDATE agencies 
SET trial_end = NOW() - INTERVAL '1 day'
WHERE trial_end IS NULL AND subscription_status = 'active';
