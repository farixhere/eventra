import { createUserToken, COOKIE_NAME } from "../../../../lib/auth";
import { getOrBootstrapAdmin, verifyPassword } from "../../../../lib/accounts";
import { getDb } from "../../../../lib/db";
import { auditLog } from "../../../../lib/audit";
import { consumeRateLimit } from "../../../../lib/rate-limit";

function clientIp(request) {
  return (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown").split(",")[0].trim();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const limit = await consumeRateLimit("login:" + clientIp(request) + ":" + email, 10, 900);
    if (!limit.allowed) {
      return Response.json({ error: "Too many sign-in attempts. Try again later." }, {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" }
      });
    }

    const sql = getDb();
    const user = await getOrBootstrapAdmin(email, password);

    if (!user) {
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
      const existing = rows[0] || null;

      if (!existing || !existing.active || !(await verifyPassword(password, existing.password_hash))) {
        await auditLog(request, { action: "auth.login.failed", changes: { email } });
        return Response.json({ error: "Invalid email or password." }, { status: 401, headers: { "Cache-Control": "no-store" } });
      }

      return await finishLogin(request, existing);
    }

    if (!user.active || !(await verifyPassword(password, user.password_hash))) {
      await auditLog(request, { action: "auth.login.failed", changes: { email } });
      return Response.json({ error: "Invalid email or password." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    return await finishLogin(request, user);
  } catch (error) {
    console.error("auth.login", error);
    return Response.json({ error: "Authentication service error." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

async function finishLogin(request, user) {
  const session = await createUserToken(user);
  const globalRole = user.roles?.includes("admin") ? "admin" : (user.roles?.[0] || null);
  const response = Response.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.display_name, globalRole, roles: user.roles || [] }
  }, { headers: { "Cache-Control": "no-store" } });

  response.headers.set(
    "Set-Cookie",
    COOKIE_NAME + "=" + session.token + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800"
  );
  await auditLog(request, { action: "auth.login", changes: { email: user.email, globalRole } });
  return response;
}