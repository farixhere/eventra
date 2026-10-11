import { NextResponse } from "next/server";
import { authorizeRequest } from "./rbac";
import { parseUserToken } from "./auth";

// Routes that are intentionally reachable without a session.
// Everything else under /api is denied unless the caller is authenticated and authorized.
const PUBLIC = [
  ["GET", /^\/api\/health$/],
  ["GET", /^\/api\/auth\/status$/],
  ["POST", /^\/api\/auth\/login$/],
  ["POST", /^\/api\/auth\/logout$/],
  ["GET", /^\/api\/public-registration$/],
  ["POST", /^\/api\/public-registration$/],
  ["POST", /^\/api\/contact$/],
  ["GET", /^\/api\/certificate-verifications$/],
  ["GET", /^\/api\/certificates\/download$/],
  ["GET", /^\/api\/leaderboard$/],
  // Authenticated by its own x-eventra-api-key check.
  ["GET", /^\/api\/v1\/results$/]
];

// Routes that only need a valid session; the route itself scopes the data per user.
const SESSION_ONLY = [
  ["GET", /^\/api\/auth\/me$/],
  ["GET", /^\/api\/events$/]
];

const matches = (list, method, path) => list.some(([m, re]) => m === method && re.test(path));

function deny(status, error) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function guardApi(request) {
  const method = request.method.toUpperCase();
  const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";

  if (method === "OPTIONS") return null;
  if (matches(PUBLIC, method, path)) return null;

  try {
    if (matches(SESSION_ONLY, method, path)) {
      const user = await parseUserToken(request.cookies.get("eventra_session")?.value);
      return user ? null : deny(401, "Authentication required");
    }
    const decision = await authorizeRequest(request);
    return decision.ok ? null : deny(decision.status || 403, decision.error || "Forbidden");
  } catch (error) {
    console.error("api-guard", error);
    // Fail closed: never let a request through because authorization could not be evaluated.
    return deny(503, "Authorization service unavailable");
  }
}
