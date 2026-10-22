-- Migration 014: Add password_changed_at and 2FA credentials to users table

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;
