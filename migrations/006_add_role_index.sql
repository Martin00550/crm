-- Migration: Add index on users.role for frequently queried field
-- Created: 2026-04-16

CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
