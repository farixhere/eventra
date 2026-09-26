import { NextResponse } from "next/server";
import { authorizeRequest } from "./lib/rbac";
const PUBLIC_API=new Set(["/api/auth/login","/api/auth/logout","/api/public-registration"]);
async function proxy(request){
 const {pathname}=request.nextUrl;
 if(pathname==="/admin-login"||pathname==="/dashboard/login")return NextResponse.next();
 if(PUBLIC_API.has(pathname)||pathname.startsWith("/api/v1/")||pathname==="/api/health")return NextResponse.next();
 if(pathname==="/api/contact"&&request.method==="POST")return NextResponse.next();
 if(pathname==="/api/certificate-verifications"&&request.method==="GET")return NextResponse.next();
 const decision=await authorizeRequest(request);
 if(decision.ok)return NextResponse.next();
 if(pathname.startsWith("/api/"))return NextResponse.json({error:decision.error||"Access denied"},{status:decision.status||403});
 const loginUrl=new URL("/dashboard/login",request.url);loginUrl.searchParams.set("next",pathname);return NextResponse.redirect(loginUrl);
}
export default proxy;
export const config={matcher:["/dashboard/:path*","/api/:path*"]};