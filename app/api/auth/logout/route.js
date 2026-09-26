import {COOKIE_NAME} from "../../../../lib/auth";
import {auditLog} from "../../../../lib/audit";
export async function POST(request){
 const r=Response.json({ok:true});
 r.headers.set("Set-Cookie",COOKIE_NAME+"=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
 r.headers.set("Cache-Control","no-store");
 await auditLog(request,{action:"auth.logout"});
 return r;
}