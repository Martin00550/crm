-- Migration: Fix id column type issues
-- This drops old tables that may have incompatible id types

-- Drop old backup tables if they exist
DROP TABLE IF EXISTS users_backup CASCADE;
DROP TABLE IF EXISTS cross_sell_opportunities CASCADE;
