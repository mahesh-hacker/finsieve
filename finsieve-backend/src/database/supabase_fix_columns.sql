-- Run this on Supabase only if you already ran an older schema that had email_verified instead of is_email_verified
-- (No harm if columns already exist or don't exist - use IF EXISTS / IF NOT EXISTS where supported)

-- Rename email_verified to is_email_verified (skip if already is_email_verified)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users RENAME COLUMN email_verified TO is_email_verified;
  END IF;
END $$;

-- Add is_active if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
