-- ==============================================================================
-- Migration V4: Customer Registration and Email Activation
-- Database: PostgreSQL 16+
-- ==============================================================================

-- 1. Extend app_users table for customer registration & email verification
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMPTZ;

-- 2. Ensure existing admin users are verified
UPDATE app_users SET is_email_verified = TRUE WHERE role = 'ROLE_ADMIN';

-- 3. Index for fast verification token lookups
CREATE INDEX idx_users_verification_token ON app_users (verification_token) WHERE verification_token IS NOT NULL;
