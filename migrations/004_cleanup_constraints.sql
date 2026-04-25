-- Migration: Add check constraints, remove stale columns, add soft delete
-- This adds database-level constraints for data integrity

-- Add check constraint: documents must have either policy_id or client_id
ALTER TABLE documents
ADD CONSTRAINT documents_association_check 
CHECK (policy_id IS NOT NULL OR client_id IS NOT NULL);

-- Remove stale daysOut column from renewals (computed on the fly now)
ALTER TABLE renewals DROP COLUMN IF EXISTS days_out;

-- Add index for documents association (already in schema, ensuring it exists)
CREATE INDEX IF NOT EXISTS documents_association_check 
ON documents(policy_id, client_id);

-- Add comment to explain the check constraint
COMMENT ON CONSTRAINT documents_association_check ON documents 
IS 'Ensures each document is associated with either a policy or a client';

-- Add soft delete columns to critical tables
ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add indexes for soft delete queries
CREATE INDEX IF NOT EXISTS clients_deleted_at_idx ON clients(deleted_at);
CREATE INDEX IF NOT EXISTS policies_deleted_at_idx ON policies(deleted_at);
CREATE INDEX IF NOT EXISTS documents_deleted_at_idx ON documents(deleted_at);
