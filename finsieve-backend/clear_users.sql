-- Clear all user-related data from the database
-- This will cascade delete all related records

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Delete from all user-related tables
TRUNCATE TABLE email_verification_tokens CASCADE;
TRUNCATE TABLE password_reset_tokens CASCADE;
TRUNCATE TABLE refresh_tokens CASCADE;
TRUNCATE TABLE watchlist_items CASCADE;
TRUNCATE TABLE watchlists CASCADE;
TRUNCATE TABLE user_preferences CASCADE;
TRUNCATE TABLE users CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Verify the tables are empty
SELECT 'Users count:' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'User preferences count:', COUNT(*) FROM user_preferences
UNION ALL
SELECT 'Watchlists count:', COUNT(*) FROM watchlists
UNION ALL
SELECT 'Watchlist items count:', COUNT(*) FROM watchlist_items
UNION ALL
SELECT 'Refresh tokens count:', COUNT(*) FROM refresh_tokens
UNION ALL
SELECT 'Email verification tokens count:', COUNT(*) FROM email_verification_tokens
UNION ALL
SELECT 'Password reset tokens count:', COUNT(*) FROM password_reset_tokens;
