-- Eventra operations expansion. Additive and backwards compatible.
ALTER TABLE programmes
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS reporting_minutes integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS buffer_minutes integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS judge_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS requirements jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS reporting_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE results
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by text,
  ADD COLUMN IF NOT EXISTS correction_reason text;

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS chest_number integer;

CREATE UNIQUE INDEX IF NOT EXISTS idx_participant_chest_event ON participants(event_id,chest_number) WHERE chest_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS event_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id,email)
);
CREATE INDEX IF NOT EXISTS idx_event_roles_event ON event_roles(event_id);

CREATE TABLE IF NOT EXISTS judge_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  email text NOT NULL,
  criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(programme_id,email)
);

CREATE TABLE IF NOT EXISTS appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  result_id uuid REFERENCES results(id) ON DELETE SET NULL,
  participant_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  submitted_by text NOT NULL,
  reason text NOT NULL,
  evidence_url text,
  status text NOT NULL DEFAULT 'submitted',
  decision text,
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appeals_event ON appeals(event_id);

CREATE TABLE IF NOT EXISTS substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  programme_id uuid REFERENCES programmes(id) ON DELETE SET NULL,
  original_participant_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  replacement_participant_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  reason text NOT NULL,
  approved_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_substitutions_event ON substitutions(event_id);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  recipient_email text,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_event ON notifications(event_id);

CREATE TABLE IF NOT EXISTS certificate_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid NOT NULL UNIQUE REFERENCES certificates(id) ON DELETE CASCADE,
  verification_code text NOT NULL UNIQUE,
  last_verified_at timestamptz,
  verification_count integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(event_id,recipient_email);
