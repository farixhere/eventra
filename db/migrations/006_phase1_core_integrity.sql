-- Eventra Phase 1 core integrity. Additive/idempotent migration.
CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE, display_name text NOT NULL,
 password_hash text NOT NULL, active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, description text);
CREATE TABLE IF NOT EXISTS permissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, description text);
CREATE TABLE IF NOT EXISTS role_permissions (role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE, permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE, PRIMARY KEY(role_id,permission_id));
CREATE TABLE IF NOT EXISTS user_roles (user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE, PRIMARY KEY(user_id,role_id));
CREATE TABLE IF NOT EXISTS sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(token_hash,expires_at) WHERE revoked_at IS NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_owner_user ON events(owner_user_id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL, ADD COLUMN IF NOT EXISTS reason text, ADD COLUMN IF NOT EXISTS request_id text, ADD COLUMN IF NOT EXISTS ip_address text;
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type,entity_id,created_at DESC);
INSERT INTO roles(name,description) VALUES ('admin','Full system administration'),('organizer','Owns and manages festivals'),('judge','Scores assigned programmes'),('participant','Manages own registration'),('team-mgr','Manages assigned team') ON CONFLICT(name) DO NOTHING;
INSERT INTO permissions(name,description) VALUES ('system.manage','Manage system'),('festival.create','Create festivals'),('festival.read','Read festivals'),('festival.update','Update festivals'),('festival.delete','Delete festivals'),('participants.manage','Manage participants'),('schedule.manage','Manage schedules'),('results.manage','Manage results'),('results.verify','Verify results'),('results.publish','Publish results'),('public.read','Read public data'),('audit.read','Read audit history') ON CONFLICT(name) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.name='admin' ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN ('festival.create','festival.read','festival.update','festival.delete','participants.manage','schedule.manage','results.manage','results.verify','results.publish','public.read','audit.read') WHERE r.name='organizer' ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN ('festival.read','results.manage','public.read') WHERE r.name='judge' ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN ('festival.read','public.read') WHERE r.name IN ('participant','team-mgr') ON CONFLICT DO NOTHING;
