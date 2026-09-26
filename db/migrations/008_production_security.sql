-- Eventra production security hardening. Additive/idempotent.
CREATE TABLE IF NOT EXISTS eventra_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES eventra_accounts(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eventra_sessions_active ON eventra_sessions(token_hash,expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_eventra_sessions_account ON eventra_sessions(account_id,created_at DESC);
CREATE TABLE IF NOT EXISTS eventra_rate_limits (
  bucket_key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eventra_rate_limits_updated ON eventra_rate_limits(updated_at);
ALTER TABLE eventra_accounts ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_eventra_accounts_active ON eventra_accounts(id) WHERE active=true;
