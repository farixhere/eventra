import { createUserToken, COOKIE_NAME } from "../../../../lib/auth";
import { ensureAccountsTable, getOrBootstrapAdmin, verifyPassword } from "../../../../lib/accounts";
import { getDb } from "../../../../lib/db";
export async function POST(request){
 try{
  const body=await request.json(),email=String(body.email||"owner@eventra.local").trim().toLowerCase(),password=String(body.password||"");
  if(!password)return Response.json({error:"Password is required"},{status:400});
  const sql=getDb();await ensureAccountsTable(sql);let user=await getOrBootstrapAdmin(email,password);
  if(!user){const rows=await sql.unsafe("SELECT id,email,name,global_role,active,password_hash FROM eventra_accounts WHERE lower(email)=lower($1) LIMIT 1",[email]);user=rows[0]||null}
  if(!user||!user.active||!(await verifyPassword(password,user.password_hash)))return Response.json({error:"Incorrect email or password"},{status:401});
  await sql.unsafe("UPDATE eventra_accounts SET last_login_at=now(),updated_at=now() WHERE id=$1",[user.id]);
  const token=await createUserToken(user,process.env.EVENTRA_ADMIN_PASSWORD),response=Response.json({ok:true,user:{id:user.id,email:user.email,name:user.name,globalRole:user.global_role}});
  response.headers.set("Set-Cookie",`${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`);
  response.headers.set("Cache-Control","no-store");return response;
 }catch(e){console.error("login",e);return Response.json({error:"Unable to sign in"},{status:500})}
}