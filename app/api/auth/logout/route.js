import {COOKIE_NAME} from "../../../../lib/auth";
import {revokeSession} from "../../../../lib/session";
import {auditLog} from "../../../../lib/audit";

export async function POST(request){
 const token=request.cookies.get(COOKIE_NAME)?.value;
 await revokeSession(token);
 const r=Response.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 r.headers.set("Set-Cookie",COOKIE_NAME+"=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
 await auditLog(request,{action:"auth.logout"});
 return r;
}
