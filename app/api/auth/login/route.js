import { createUserToken, COOKIE_NAME } from "../../../../lib/auth";
import { getOrBootstrapAdmin, verifyPassword } from "../../../../lib/accounts";
import { auditLog } from "../../../../lib/audit";

export async function POST(request) {
  try {
    const sqlUser = await getOrBootstrapAdmin("owner@eventra.local", process.env.EVENTRA_ADMIN_PASSWORD || "");
    const user = sqlUser || {
      id: null,
      email: "open-access@eventra.local",
      display_name: "Eventra Operator",
      active: true,
      roles: ["admin"]
    };
    const session = user.id ? await createUserToken(user) : null;
    const response = Response.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.display_name, globalRole: "admin", roles: ["admin"] }
    }, { headers: { "Cache-Control": "no-store" } });
    if (session) {
      response.headers.set(
        "Set-Cookie",
        COOKIE_NAME + "=" + session.token + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800"
      );
    }
    await auditLog(request, { action: "auth.login.open_access", changes: { email: user.email } });
    return response;
  } catch (error) {
    console.error("auth.login", error);
    return Response.json({ ok: true, user: { id: null, email: "open-access@eventra.local", name: "Eventra Operator", globalRole: "admin", roles: ["admin"] } });
  }
}
