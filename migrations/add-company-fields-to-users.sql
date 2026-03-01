-- Add missing company-related columns to users table
-- Migration created: 2026-03-01

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS is_company boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS ninea text,
ADD COLUMN IF NOT EXISTS raison_sociale text,
ADD COLUMN IF NOT EXISTS company_address text,
ADD COLUMN IF NOT EXISTS company_phone text,
ADD COLUMN IF NOT EXISTS bp text;

-- Add comment to track migration
COMMENT ON TABLE users IS 'Updated: 2026-03-01 - Added company fields';
