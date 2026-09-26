// Eventra is running in open-control mode: authentication is disabled.
// Keep the exported helpers for compatibility with existing API modules, but
// never consult the legacy session store. This also makes old session cookies
// harmless and prevents legacy auth/database state from breaking the dashboard.

export const COOKIE_NAME = "eventra_session";
export const TOKEN_TTL_SECONDS = 60 * 60 * 8;

export async function createUserToken(user) {
  return { token: null, sessionId: null, expiresAt: null, userId: user?.id ?? null };
}

export async function parseUserToken(_token) {
  return {
    id: null,
    email: "open-access@eventra.local",
    name: "Eventra Operator",
    globalRole: "admin",
    roles: ["admin"],
    sessionId: null
  };
}

export async function verifyAdminToken(_token) {
  return true;
}
