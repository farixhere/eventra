import { NextResponse } from "next/server";
import { guardApi } from "./lib/api-guard";

function addHeaders(response) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(),microphone=(),geolocation=()");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  return response;
}

export default async function proxy(request) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const blocked = await guardApi(request);
    if (blocked) return addHeaders(blocked);
  }
  return addHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
