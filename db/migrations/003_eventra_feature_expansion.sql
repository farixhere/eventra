-- Eventra feature expansion (non-competition features)
-- Safe additive migration for the existing Eventra schema.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS website_theme text NOT NULL DEFAULT 'eventra',
  ADD COLUMN IF NOT EXISTS primary_color text NOT NULL DEFAULT '#d7ff3f',
  ADD COLUMN IF NOT EXISTS secondary_color text NOT NULL DEFAULT '#111111',
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_open boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_deadline timestamptz;

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS school_college text,
  ADD COLUMN IF NOT EXISTS class_year text,
  ADD COLUMN IF NOT EXISTS profile_picture_url text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'registered',
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE programmes
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS rules text,
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'scheduled';

ALTER TABLE results
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE TABLE IF NOT EXISTS downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_downloads_event ON downloads(event_id);

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_announcements_event ON announcements(event_id);

CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'image',
  file_size integer,
  category text NOT NULL DEFAULT 'gallery',
  caption text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_assets_event ON media_assets(event_id);

CREATE TABLE IF NOT EXISTS event_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  total_registrations integer NOT NULL DEFAULT 0,
  total_participants integer NOT NULL DEFAULT 0,
  total_programmes integer NOT NULL DEFAULT 0,
  programmes_completed integer NOT NULL DEFAULT 0,
  results_published integer NOT NULL DEFAULT 0,
  page_views integer NOT NULL DEFAULT 0,
  certificate_downloads integer NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'unread',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contact_messages_event ON contact_messages(event_id);

CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  result_id uuid REFERENCES results(id) ON DELETE SET NULL,
  participant_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  title text NOT NULL,
  certificate_type text NOT NULL DEFAULT 'participation',
  certificate_number text NOT NULL UNIQUE,
  file_url text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_certificates_event ON certificates(event_id);

CREATE TABLE IF NOT EXISTS id_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  card_number text NOT NULL UNIQUE,
  file_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_id_cards_event ON id_cards(event_id);

CREATE TABLE IF NOT EXISTS live_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  update_type text NOT NULL DEFAULT 'announcement',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_live_updates_event ON live_updates(event_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  changes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_id);
