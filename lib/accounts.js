import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { getDb } from "./db";

const scrypt = promisify(scryptCb);

export async function ensureAccountsTable() {
  // Authentication schema is managed by migrations. No runtime DDL.
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return "scrypt$" + salt.toString("base64url") + "$" + Buffer.from(derived).toString("base64url");
}

export async function verifyPassword(password, encoded) {
  try {
    const parts = String(encoded || "").split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const salt = Buffer.from(parts[1], "base64url");
    const expected = Buffer.from(parts[2], "base64url");
    if (!salt.length || !expected.length) return false;
    const actual = Buffer.from(await scrypt(password, salt, expected.length, { N: 16384, r: 8, p: 1 }));
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

async function findUserByEmail(sql, email) {
  const rows = await sql.unsafe(
    `SELECT u.id,u.email,u.display_name,u.active,u.password_hash,
            COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::text[]) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id=u.id
       LEFT JOIN roles r ON r.id=ur.role_id
      WHERE lower(u.email)=lower($1)
      GROUP BY u.id
      LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function ensureAdminRole(sql) {
  const roleRows = await sql.unsafe("SELECT id FROM roles WHERE name='admin' LIMIT 1");
  if (roleRows[0]) return roleRows[0].id;

  // Safety net for databases where the role seed migration was not applied.
  // This is idempotent and only creates the canonical admin role.
  const created = await sql.unsafe(
    "INSERT INTO roles(name,description) VALUES('admin','Full system administration') ON CONFLICT(name) DO UPDATE SET description=EXCLUDED.description RETURNING id"
  );
  if (!created[0]) throw new Error("Unable to provision the admin role.");
  return created[0].id;
}

export async function getOrBootstrapAdmin(email, password) {
  const sql = getDb();
  const requestedEmail = String(email || "").trim().toLowerCase();
  const configuredEmail = String(process.env.EVENTRA_ADMIN_EMAIL || "owner@eventra.local").trim().toLowerCase();
  const configuredPassword = String(process.env.EVENTRA_ADMIN_PASSWORD || "");

  const existing = await findUserByEmail(sql, requestedEmail);
  if (existing) {
    // The configured bootstrap identity is authoritative for the initial admin.
    // This also keeps login working if an older production database has a
    // partially-seeded roles/user_roles table.
    if (requestedEmail === configuredEmail && !existing.roles?.includes("admin")) {
      return { ...existing, roles: ["admin", ...(existing.roles || []).filter((r) => r !== "admin")] };
    }
    return existing;
  }

  const countRows = await sql.unsafe("SELECT COUNT(*)::int AS count FROM users");
  const userCount = Number(countRows[0]?.count || 0);

  // First account is created only when both configured credentials match.
  if (userCount !== 0 || requestedEmail !== configuredEmail || !configuredPassword || password !== configuredPassword) {
    return null;
  }

  let adminRoleId = null;
  try {
    adminRoleId = await ensureAdminRole(sql);
  } catch (error) {
    // Bootstrap must not be blocked by a stale/partially migrated RBAC seed.
    // The configured bootstrap email is treated as admin until RBAC is repaired.
    console.error("auth.bootstrap.admin-role", error);
  }

  const hash = await hashPassword(password);
  const rows = await sql.unsafe(
    `INSERT INTO users(email,display_name,password_hash,active)
     VALUES($1,$2,$3,true)
     RETURNING id,email,display_name,active,password_hash`,
    [requestedEmail, requestedEmail.split("@")[0] || "Eventra Admin", hash]
  );

  if (adminRoleId) {
    try {
      await sql.unsafe(
        "INSERT INTO user_roles(user_id,role_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
        [rows[0].id, adminRoleId]
      );
    } catch (error) {
      console.error("auth.bootstrap.user-role", error);
    }
  }

  return { ...rows[0], roles: ["admin"] };
}

export async function getAuthStatus() {
  const sql = getDb();
  const rows = await sql.unsafe("SELECT COUNT(*)::int AS count FROM users");
  return {
    configured: Boolean(process.env.EVENTRA_ADMIN_PASSWORD),
    configuredEmail: String(process.env.EVENTRA_ADMIN_EMAIL || "owner@eventra.local").trim().toLowerCase(),
    users: Number(rows[0]?.count || 0)
  };
}