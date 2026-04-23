-- Add allowed_email_domain to institutions
ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS allowed_email_domain TEXT;

-- Allow super admin users with no institution
ALTER TABLE users ALTER COLUMN institution_id DROP NOT NULL;

-- Add email verification fields to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_token TEXT,
  ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMPTZ;

-- Unique constraint: one institution per domain
CREATE UNIQUE INDEX IF NOT EXISTS institutions_allowed_email_domain_unique
  ON institutions (allowed_email_domain)
  WHERE allowed_email_domain IS NOT NULL;
