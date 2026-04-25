-- Migration: Add billing tables for invoice and payment tracking
-- Created: 2026-04-16

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    paddle_invoice_id TEXT UNIQUE,
    subscription_id TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    billing_period_start TIMESTAMP,
    billing_period_end TIMESTAMP,
    due_date TIMESTAMP,
    paid_at TIMESTAMP,
    invoice_url TEXT,
    line_items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Invoice indexes
CREATE INDEX IF NOT EXISTS invoices_agency_idx ON invoices(agency_id);
CREATE INDEX IF NOT EXISTS invoices_paddle_idx ON invoices(paddle_invoice_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);
CREATE INDEX IF NOT EXISTS invoices_created_at_idx ON invoices(created_at);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    paddle_transaction_id TEXT UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    payment_method TEXT,
    paid_at TIMESTAMP,
    refunded_at TIMESTAMP,
    refund_amount DECIMAL(10, 2),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Payment indexes
CREATE INDEX IF NOT EXISTS payments_agency_idx ON payments(agency_id);
CREATE INDEX IF NOT EXISTS payments_invoice_idx ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS payments_paddle_idx ON payments(paddle_transaction_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);

-- Subscription history table
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    previous_tier TEXT,
    new_tier TEXT,
    previous_status TEXT,
    new_status TEXT,
    reason TEXT,
    performed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Subscription history indexes
CREATE INDEX IF NOT EXISTS subscription_history_agency_idx ON subscription_history(agency_id);
CREATE INDEX IF NOT EXISTS subscription_history_action_idx ON subscription_history(action);
CREATE INDEX IF NOT EXISTS subscription_history_created_at_idx ON subscription_history(created_at);
