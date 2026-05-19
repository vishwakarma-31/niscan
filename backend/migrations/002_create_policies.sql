-- Migration 002: Create policies table
-- Run: psql -d nicsan_crm -f backend/migrations/002_create_policies.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_number VARCHAR(100),
    customer_name VARCHAR(200),
    customer_email VARCHAR(255),
    vehicle_number VARCHAR(50),
    insurer VARCHAR(200),
    premium NUMERIC(12,2),
    s3_file_url TEXT,
    s3_file_key TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
    extraction_confidence JSONB,
    uploaded_by UUID REFERENCES users(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_customer_name ON policies(customer_name);
CREATE INDEX IF NOT EXISTS idx_policies_policy_number ON policies(policy_number);
CREATE INDEX IF NOT EXISTS idx_policies_uploaded_by ON policies(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_policies_is_deleted ON policies(is_deleted);
CREATE INDEX IF NOT EXISTS idx_policies_created_at ON policies(created_at DESC);

-- Trigger uses update_updated_at_column() from 001_create_users.sql
DROP TRIGGER IF EXISTS update_policies_updated_at ON policies;
CREATE TRIGGER update_policies_updated_at
    BEFORE UPDATE ON policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();