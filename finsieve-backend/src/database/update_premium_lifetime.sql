-- Set maheshmishra1691@gmail.com to Premium (lifetime)
-- Note: user_tier is an enum: 'free' | 'basic' | 'premium' | 'enterprise'
-- If subscription_expires column exists, set it to a far-future date for lifetime.
-- Run with: psql -U <user> -d <database> -f src/database/update_premium_lifetime.sql

UPDATE users
SET user_tier = 'premium', updated_at = CURRENT_TIMESTAMP
WHERE email = 'maheshmishra1691@gmail.com';

-- Verify (optional)
SELECT id, email, user_tier, updated_at FROM users WHERE email = 'maheshmishra1691@gmail.com';
