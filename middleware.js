import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyAdminToken } from "./lib/auth";

const PUBLIC_API = new Set([
  "/api/auth/login",
  "/api/auth/logout",
  "/api/public-registration",
]);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const publicApi =
      PUBLIC_API.has(pathname) ||
      (pathname === "/api/contact" && request.method === "POST");

    if (publicApi) return NextResponse.next();

    const token = request.cookies.get(COOKIE_NAME)?.value;
    const valid = await verifyAdminToken(token, process.env.EVENTRA_ADMIN_PASSWORD);

    if (!valid) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard") && pathname !== "/dashboard/login") {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const valid = await verifyAdminToken(token, process.env.EVENTRA_ADMIN_PASSWORD);

    if (!valid) {
      const loginUrl = new URL("/admin-login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"],
};
