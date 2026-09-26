import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { getDb } from "./db";

const scrypt = promisify(scryptCb);

export async function ensureAccountsTable(sql = getDb()) {
  await sql.unsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at timestamptz`);
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return "scrypt$" + salt.toString("base64url") + "$" + Buffer.from(derived).toString("base64url");
}

export async function verifyPassword(password, encoded) {
  try {
    const [, saltText, hashText] = String(encoded).split("$");
    if (!saltText || !hashText) return false;
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(hashText, "base64url");
    const actual = Buffer.from(await scrypt(password, salt, expected.length, { N: 16384, r: 8, p: 1 }));
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function getOrBootstrapAdmin(email, password) {
  const sql = getDb();
  await ensureAccountsTable(sql);
  const found = await sql.unsafe(
    `SELECT u.id,u.email,u.display_name,u.active,u.password_hash,
            COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::text[]) AS roles
       FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id
      WHERE lower(u.email)=lower($1) GROUP BY u.id LIMIT 1`,
    [email]
  );
  if (found[0]) return found[0];
  const countRows = await sql.unsafe("SELECT COUNT(*)::int AS count FROM users");
  if (Number(countRows[0]?.count || 0) !== 0) return null;
  const configured = process.env.EVENTRA_ADMIN_PASSWORD;
  if (!configured || password !== configured) return null;
  const roleRows = await sql.unsafe("SELECT id FROM roles WHERE name='admin' LIMIT 1");
  if (!roleRows[0]) return null;
  const hash = await hashPassword(password);
  const rows = await sql.unsafe(
    `INSERT INTO users(email,display_name,password_hash,active)
     VALUES(lower($1),$2,$3,true) RETURNING id,email,display_name,active,password_hash`,
    [email, email.split("@")[0] || "Eventra Admin", hash]
  );
  await sql.unsafe("INSERT INTO user_roles(user_id,role_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [rows[0].id, roleRows[0].id]);
  return { ...rows[0], roles: ["admin"] };
}
