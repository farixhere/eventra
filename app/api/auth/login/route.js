import {createUserToken,COOKIE_NAME} from "../../../../lib/auth";
import {ensureAccountsTable,getOrBootstrapAdmin,verifyPassword} from "../../../../lib/accounts";
import {getDb} from "../../../../lib/db";
import {auditLog} from "../../../../lib/audit";
import {consumeRateLimit} from "../../../../lib/rate-limit";

function clientIp(request){return (request.headers.get("x-forwarded-for")||request.headers.get("x-real-ip")||"unknown").split(",")[0].trim()}

export async function POST(request){
 try{
  const body=await request.json(),email=String(body.email||"").trim().toLowerCase(),password=String(body.password||"");
  if(!email||!password)return Response.json({error:"Invalid email or password"},{status:400,headers:{"Cache-Control":"no-store"}});
  const limit=await consumeRateLimit("login:"+clientIp(request)+":"+email,10,900);
  if(!limit.allowed)return Response.json({error:"Too many sign-in attempts. Try again later."},{status:429,headers:{"Retry-After":String(limit.retryAfter),"Cache-Control":"no-store"}});
  const sql=getDb();await ensureAccountsTable(sql);let user=await getOrBootstrapAdmin(email,password);
  if(!user){const rows=await sql.unsafe("SELECT id,email,name,global_role,active,password_hash FROM eventra_accounts WHERE lower(email)=lower($1) LIMIT 1",[email]);user=rows[0]||null}
  if(!user||!user.active||!(await verifyPassword(password,user.password_hash))){
   await auditLog(request,{action:"auth.login.failed",changes:{email}});
   return Response.json({error:"Invalid email or password"},{status:401,headers:{"Cache-Control":"no-store"}});
  }
  const session=await createUserToken(user);
  const response=Response.json({ok:true,user:{id:user.id,email:user.email,name:user.name,globalRole:user.global_role}},{headers:{"Cache-Control":"no-store"}});
  response.headers.set("Set-Cookie",COOKIE_NAME+"="+session.token+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800");
  await sql.unsafe("UPDATE eventra_accounts SET last_login_at=now(),updated_at=now() WHERE id=$1",[user.id]);
  await auditLog(request,{action:"auth.login",changes:{email:user.email,globalRole:user.global_role}});
  return response;
 }catch(e){console.error("login",e);return Response.json({error:"Unable to sign in"},{status:500,headers:{"Cache-Control":"no-store"}})}
}
