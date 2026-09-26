import { NextResponse } from "next/server";
import { authorizeRequest } from "./lib/rbac";
import { consumeRateLimit } from "./lib/rate-limit";
import { auditLog } from "./lib/audit";

const PUBLIC_API=new Set(["/api/auth/login","/api/auth/logout","/api/public-registration","/api/certificates/download"]);
const COOKIE_MUTATIONS=new Set(["POST","PUT","PATCH","DELETE"]);

function sameOrigin(request){
 const origin=request.headers.get("origin");
 if(origin)return origin===request.nextUrl.origin;
 const referer=request.headers.get("referer");
 return !referer || new URL(referer).origin===request.nextUrl.origin;
}

async function proxy(request){
 const {pathname}=request.nextUrl;
 const addHeaders=(response)=>{
   response.headers.set("X-Content-Type-Options","nosniff");
   response.headers.set("X-Frame-Options","DENY");
   response.headers.set("Referrer-Policy","strict-origin-when-cross-origin");
   response.headers.set("Permissions-Policy","camera=(),microphone=(),geolocation=()");
   response.headers.set("X-DNS-Prefetch-Control","off");
   return response;
 };
 if(pathname==="/admin-login"||pathname==="/dashboard/login")return addHeaders(NextResponse.next());
 if(PUBLIC_API.has(pathname)||pathname.startsWith("/api/v1/")||pathname==="/api/health")return addHeaders(NextResponse.next());
 if(pathname==="/api/contact"&&request.method==="POST")return addHeaders(NextResponse.next());
 if(pathname==="/api/certificate-verifications"&&request.method==="GET")return addHeaders(NextResponse.next());

 if(COOKIE_MUTATIONS.has(request.method) && request.cookies.get("eventra_session") && !sameOrigin(request))
   return addHeaders(NextResponse.json({error:"Cross-site mutation rejected"},{status:403}));

 if(pathname==="/api/judge-scores"&&request.method==="POST"){
   const ip=(request.headers.get("x-forwarded-for")||"unknown").split(",")[0].trim();
   const rl=await consumeRateLimit("score:"+ip,120,900);
   if(!rl.allowed)return addHeaders(NextResponse.json({error:"Too many score submissions. Try again later."},{status:429,headers:{"Retry-After":String(rl.retryAfter)}}));
 }
 if(pathname==="/api/auth/accounts"&&request.method==="POST"){
   const ip=(request.headers.get("x-forwarded-for")||"unknown").split(",")[0].trim();
   const rl=await consumeRateLimit("account-create:"+ip,20,3600);
   if(!rl.allowed)return addHeaders(NextResponse.json({error:"Too many account creation attempts."},{status:429,headers:{"Retry-After":String(rl.retryAfter)}}));
 }

 const decision=await authorizeRequest(request);
 if(decision.ok){
   if(COOKIE_MUTATIONS.has(request.method) && decision.user) await auditLog(request,{action:"api.mutation",eventId:decision.eventId||null,entityType:pathname,changes:{method:request.method,path:pathname}});
   return addHeaders(NextResponse.next());
 }
 if(pathname.startsWith("/api/"))return addHeaders(NextResponse.json({error:decision.error||"Access denied"},{status:decision.status||403,headers:{"Cache-Control":"no-store"}}));
 const loginUrl=new URL("/dashboard/login",request.url);loginUrl.searchParams.set("next",pathname);return addHeaders(NextResponse.redirect(loginUrl));
}
export default proxy;
export const config={matcher:["/dashboard/:path*","/api/:path*"]};
