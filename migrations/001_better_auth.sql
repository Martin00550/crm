-- ===========================================
-- Better Auth Migration
-- Creates tables required by Better Auth
-- ===========================================

-- User table (required by Better Auth)
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    image TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Session table (required by Better Auth)
CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    expires_at TIMESTAMP NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- Account table (for OAuth providers)
CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at TIMESTAMP,
    refresh_token_expires_at TIMESTAMP,
    scope TEXT,
    password TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Verification table (for email verification, password reset)
CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===========================================
-- Application-specific user extension table
-- This extends Better Auth user with app-specific fields
-- ===========================================

-- First, check if old users table exists with clerk_id
DO $$
BEGIN
    -- If the old users table exists with clerk_id, we need to migrate data
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'clerk_id'
    ) THEN
        -- Create backup of old users table
        CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;
        
        -- Drop the old users table
        DROP TABLE users CASCADE;
    END IF;
END $$;

-- Create new users table that references Better Auth user
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'agent',
    agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on agency_id for faster lookups
CREATE INDEX IF NOT EXISTS agency_id_idx ON users(agency_id);

-- ===========================================
-- Migration helper: Transfer data from backup if exists
-- ===========================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_backup') THEN
        -- Note: This is a placeholder. In production, you'd need to:
        -- 1. Create user records in "user" table from Clerk data
        -- 2. Link users.id to the new "user" table records
        -- 3. This requires manual migration or webhook handling
        
        -- For now, we'll just log that migration is needed
        RAISE NOTICE 'Users backup table exists. Manual migration of user data from Clerk to Better Auth is required.';
    END IF;
END $$;
