import {createUserToken,COOKIE_NAME} from "../../../../lib/auth";
import {ensureAccountsTable,getOrBootstrapAdmin,verifyPassword} from "../../../../lib/accounts";
import {getDb} from "../../../../lib/db";
import {auditLog} from "../../../../lib/audit";

const attempts=new Map(),WINDOW_MS=15*60*1000,MAX_ATTEMPTS=10;
function keyFor(request,email){return (request.headers.get("x-forwarded-for")||"unknown").split(",")[0].trim()+"|"+email}
function allowed(key){const now=Date.now(),entry=attempts.get(key)||{count:0,reset:now+WINDOW_MS};if(now>entry.reset){entry.count=0;entry.reset=now+WINDOW_MS}if(entry.count>=MAX_ATTEMPTS){attempts.set(key,entry);return false}entry.count++;attempts.set(key,entry);return true}

export async function POST(request){
 try{
  const body=await request.json(),email=String(body.email||"owner@eventra.local").trim().toLowerCase(),password=String(body.password||"");
  if(!password)return Response.json({error:"Invalid email or password"},{status:400});
  const key=keyFor(request,email);if(!allowed(key))return Response.json({error:"Too many sign-in attempts. Try again later."},{status:429,headers:{"Retry-After":"900"}});
  const sql=getDb();await ensureAccountsTable(sql);let user=await getOrBootstrapAdmin(email,password);
  if(!user){const rows=await sql.unsafe("SELECT id,email,name,global_role,active,password_hash FROM eventra_accounts WHERE lower(email)=lower($1) LIMIT 1",[email]);user=rows[0]||null}
  if(!user||!user.active||!(await verifyPassword(password,user.password_hash))){
   await auditLog(request,{action:"auth.login.failed",changes:{email}});
   return Response.json({error:"Invalid email or password"},{status:401});
  }
  attempts.delete(key);
  await sql.unsafe("UPDATE eventra_accounts SET last_login_at=now(),updated_at=now() WHERE id=$1",[user.id]);
  const token=await createUserToken(user,process.env.EVENTRA_ADMIN_PASSWORD),response=Response.json({ok:true,user:{id:user.id,email:user.email,name:user.name,globalRole:user.global_role}});
  response.headers.set("Set-Cookie",COOKIE_NAME+"="+token+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800");
  response.headers.set("Cache-Control","no-store");
  await auditLog(request,{action:"auth.login",changes:{email:user.email,globalRole:user.global_role}});
  return response;
 }catch(e){console.error("login",e);return Response.json({error:"Unable to sign in"},{status:500})}
}
