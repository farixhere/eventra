import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyAdminToken } from "./lib/auth";

const PUBLIC_API = new Set([
  "/api/auth/login",
  "/api/auth/logout",
  "/api/public-registration",
]);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname === "/dashboard/login") return NextResponse.next();
  if (PUBLIC_API.has(pathname)) return NextResponse.next();
  if (pathname === "/api/contact" && request.method === "POST") return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const authenticated = await verifyAdminToken(
    token,
    process.env.EVENTRA_ADMIN_PASSWORD
  );

  if (authenticated) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const loginUrl = new URL("/dashboard/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
