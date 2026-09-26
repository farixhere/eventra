import { createHash, randomBytes } from "crypto";
import { getDb } from "./db";

function hashToken(token) { return createHash("sha256").update(token).digest("hex"); }

export async function ensureSessionTable(sql = getDb()) {
  await sql.unsafe(`CREATE TABLE IF NOT EXISTS sessions(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )`);
  await sql.unsafe("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)");
  await sql.unsafe("CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(token_hash,expires_at) WHERE revoked_at IS NULL");
}

export async function createSession(userId) {
  const sql = getDb(); await ensureSessionTable(sql);
  const token = randomBytes(32).toString("base64url");
  const hash = hashToken(token);
  const rows = await sql`INSERT INTO sessions(user_id,token_hash,expires_at)
    VALUES(${userId},${hash},now()+interval '8 hours') RETURNING id,expires_at`;
  return { token, sessionId: rows[0].id, expiresAt: rows[0].expires_at };
}

export async function getSessionUser(token) {
  if (!token) return null;
  const sql = getDb(); await ensureSessionTable(sql);
  const hash = hashToken(token);
  const rows = await sql`SELECT u.id,u.email,u.display_name,u.active,s.id AS session_id,s.expires_at,
      COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::text[]) AS roles
    FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id
    WHERE s.token_hash=${hash} AND s.revoked_at IS NULL AND s.expires_at>now() AND u.active=true
    GROUP BY s.id,u.id LIMIT 1`;
  if (!rows[0]) return null;
  return { id:rows[0].id,email:rows[0].email,name:rows[0].display_name,
    globalRole:rows[0].roles?.includes("admin")?"admin":(rows[0].roles?.[0]||null),
    roles:rows[0].roles||[],sessionId:rows[0].session_id };
}

export async function revokeSession(token) {
  if (!token) return;
  const sql = getDb(); await ensureSessionTable(sql);
  await sql`UPDATE sessions SET revoked_at=now() WHERE token_hash=${hashToken(token)} AND revoked_at IS NULL`;
}

export async function revokeAccountSessions(userId) {
  const sql = getDb(); await ensureSessionTable(sql);
  await sql`UPDATE sessions SET revoked_at=now() WHERE user_id=${userId} AND revoked_at IS NULL`;
}
