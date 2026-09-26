-- Canonical authentication alignment: users + user_roles + sessions.
-- Additive/idempotent. Legacy eventra_accounts/eventra_sessions are intentionally left untouched.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_users_active ON users(id) WHERE active=true;
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(token_hash,expires_at) WHERE revoked_at IS NULL;
