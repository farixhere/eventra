import { getSessionUser, createSession } from "./session";

export const COOKIE_NAME = "eventra_session";
export const TOKEN_TTL_SECONDS = 60 * 60 * 8;

// Eventra is currently running in open-control mode: no sign-in is required.
// Keep the session helpers available for compatibility with existing APIs.
export async function createUserToken(user) { return createSession(user.id); }

export async function parseUserToken(token) {
  const sessionUser = token ? await getSessionUser(token) : null;
  if (sessionUser) return sessionUser;

  // Synthetic administrator for the no-auth/open-control mode.
  return {
    id: null,
    email: "open-access@eventra.local",
    name: "Eventra Operator",
    globalRole: "admin",
    roles: ["admin"],
    sessionId: null
  };
}

export async function verifyAdminToken(token) {
  const u = await parseUserToken(token);
  return Boolean(u && u.globalRole === "admin");
}
