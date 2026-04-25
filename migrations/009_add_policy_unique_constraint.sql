-- Migration: Add unique constraint on policy numbers (agency-scoped)
-- This ensures no duplicate policy numbers within the same agency
-- Based on schema definition in src/db/schema.ts line 187

-- Add unique constraint on policy_number + agency_id combination
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'policies_agency_policy_number_unique'
    ) THEN
        ALTER TABLE policies
        ADD CONSTRAINT policies_agency_policy_number_unique
        UNIQUE (agency_id, policy_number);
    END IF;
END $$;
