-- Migration 004: Create activity_log_updated_at trigger function (shared)
-- This file is auto-included by the migrations that need it

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';