-- Eventra production security hardening. Additive/idempotent.
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(token_hash,expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS eventra_rate_limits (
  bucket_key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eventra_rate_limits_updated ON eventra_rate_limits(updated_at);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_users_active ON users(id) WHERE active=true;
CREATE UNIQUE INDEX IF NOT EXISTS uq_judge_scores_entry ON judge_scores(
  event_id,programme_id,lower(judge_email),
  COALESCE(participant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(team_id,'00000000-0000-0000-0000-000000000000'::uuid)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_results_entry ON results(
  programme_id,
  COALESCE(participant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(team_id,'00000000-0000-0000-0000-000000000000'::uuid)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_certificate_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_results_programme_score ON results(programme_id,total_score DESC,published);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_created ON audit_logs(event_id,created_at DESC);
