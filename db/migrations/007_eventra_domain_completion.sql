-- Eventra Phase 2-5 domain completion. Additive/idempotent.
-- Covers configurable programme rules, criteria judging, score sheets, publishing controls,
-- substitutions, appeals, and festival-level configuration.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS registration_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE programmes
  ADD COLUMN IF NOT EXISTS rules_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS scoring_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS registration_limit integer,
  ADD COLUMN IF NOT EXISTS team_size_min integer,
  ADD COLUMN IF NOT EXISTS team_size_max integer,
  ADD COLUMN IF NOT EXISTS skill_id uuid REFERENCES skills(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS programme_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  max_score numeric(8,2) NOT NULL DEFAULT 10,
  weight numeric(8,4) NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_programme_criteria_programme ON programme_criteria(programme_id,sort_order);

CREATE TABLE IF NOT EXISTS judge_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  result_id uuid REFERENCES results(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  judge_email text NOT NULL,
  criteria_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_score numeric(10,2),
  status text NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_judge_scores_programme ON judge_scores(programme_id,status);
CREATE INDEX IF NOT EXISTS idx_judge_scores_judge ON judge_scores(event_id,judge_email);

ALTER TABLE results
  ADD COLUMN IF NOT EXISTS score_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS judge_scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS published_by text,
  ADD COLUMN IF NOT EXISTS corrected_at timestamptz;

CREATE TABLE IF NOT EXISTS result_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  result_id uuid NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  previous_value jsonb NOT NULL,
  new_value jsonb NOT NULL,
  reason text NOT NULL,
  corrected_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_result_corrections_result ON result_corrections(result_id,created_at DESC);

ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS date_label text,
  ADD COLUMN IF NOT EXISTS judge_email text,
  ADD COLUMN IF NOT EXISTS public_visible boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS venues_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'available',
  notes text
);
CREATE INDEX IF NOT EXISTS idx_venue_availability ON venues_availability(venue_id,starts_at,ends_at);

ALTER TABLE substitutions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE appeals
  ADD COLUMN IF NOT EXISTS response text,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

CREATE TABLE IF NOT EXISTS festival_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  public_slug text,
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  navigation jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact jsonb NOT NULL DEFAULT '{}'::jsonb,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_festival_settings_slug ON festival_settings(public_slug) WHERE public_slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  last_used_at timestamptz,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
