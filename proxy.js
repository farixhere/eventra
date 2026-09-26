import { NextResponse } from "next/server";

const COOKIE_MUTATIONS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (origin) return origin === request.nextUrl.origin;
  const referer = request.headers.get("referer");
  return !referer || new URL(referer).origin === request.nextUrl.origin;
}

function addHeaders(response) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(),microphone=(),geolocation=()");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  return response;
}

async function proxy(request) {
  // Eventra is intentionally running in open-control mode.
  // Do not block dashboard pages or API routes with authentication/RBAC.
  // Keep only basic browser safety headers and same-origin protection for
  // cookie-backed state-changing requests.
  if (
    COOKIE_MUTATIONS.has(request.method) &&
    request.cookies.get("eventra_session") &&
    !sameOrigin(request)
  ) {
    return addHeaders(
      NextResponse.json({ error: "Cross-site mutation rejected" }, { status: 403 })
    );
  }

  return addHeaders(NextResponse.next());
}

export default proxy;

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
