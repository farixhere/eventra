import { createHash, randomBytes } from "crypto";
import { getDb } from "./db";

function hashToken(token){ return createHash("sha256").update(token).digest("hex"); }

export async function ensureSessionTable(sql=getDb()){
  await sql.unsafe(`CREATE TABLE IF NOT EXISTS eventra_sessions(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES eventra_accounts(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now()
  )`);
  await sql.unsafe("CREATE INDEX IF NOT EXISTS idx_eventra_sessions_active ON eventra_sessions(token_hash,expires_at) WHERE revoked_at IS NULL");
}

export async function createSession(accountId){
  const sql=getDb(); await ensureSessionTable(sql);
  const token=randomBytes(32).toString("base64url");
  const hash=hashToken(token);
  const rows=await sql`INSERT INTO eventra_sessions(account_id,token_hash,expires_at) VALUES(${accountId},${hash},now()+interval '8 hours') RETURNING id,expires_at`;
  return {token,sessionId:rows[0].id,expiresAt:rows[0].expires_at};
}

export async function getSessionUser(token){
  if(!token)return null;
  const sql=getDb(); await ensureSessionTable(sql);
  const hash=hashToken(token);
  const rows=await sql`SELECT a.id,a.email,a.name,a.global_role,a.active,s.id AS session_id,s.expires_at
    FROM eventra_sessions s JOIN eventra_accounts a ON a.id=s.account_id
    WHERE s.token_hash=${hash} AND s.revoked_at IS NULL AND s.expires_at>now() LIMIT 1`;
  if(!rows[0])return null;
  if(!rows[0].active){
    await sql`UPDATE eventra_sessions SET revoked_at=now() WHERE id=${rows[0].session_id}`;
    return null;
  }
  await sql`UPDATE eventra_sessions SET last_seen_at=now() WHERE id=${rows[0].session_id}`;
  return {id:rows[0].id,email:rows[0].email,name:rows[0].name,globalRole:rows[0].global_role,sessionId:rows[0].session_id};
}

export async function revokeSession(token){
  if(!token)return;
  const sql=getDb(); await ensureSessionTable(sql);
  await sql`UPDATE eventra_sessions SET revoked_at=now() WHERE token_hash=${hashToken(token)} AND revoked_at IS NULL`;
}

export async function revokeAccountSessions(accountId){
  const sql=getDb(); await ensureSessionTable(sql);
  await sql`UPDATE eventra_sessions SET revoked_at=now() WHERE account_id=${accountId} AND revoked_at IS NULL`;
}
