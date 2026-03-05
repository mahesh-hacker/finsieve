-- Run this on Supabase (SQL Editor) if you already ran the original schema and get 500 on login/register
-- Fixes: user_tier case, missing email_verification_tokens table, missing revoked_at on refresh_tokens

-- 1. Add revoked_at to refresh_tokens if missing
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP;

-- 2. Create email_verification_tokens table if missing
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);

-- 3. Fix existing users with lowercase user_tier (if any)
UPDATE users SET user_tier = 'FREE' WHERE user_tier = 'free';
