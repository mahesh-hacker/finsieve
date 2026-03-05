-- Run this on Supabase SQL Editor for existing deployments.
-- Fixes: missing password_reset_tokens table, phone NOT NULL constraint.

-- 1. Make phone nullable (registration works without phone)
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

-- 2. Add password_reset_tokens table (required for forgot-password flow)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
