import {getDb} from "../../../../lib/db";
import {ensureAccountsTable,hashPassword} from "../../../../lib/accounts";
import {parseUserToken} from "../../../../lib/auth";
import {auditLog,safeChanges} from "../../../../lib/audit";
import {revokeAccountSessions} from "../../../../lib/session";

async function admin(request){
 const u=await parseUserToken(request.cookies.get("eventra_session")?.value,process.env.EVENTRA_ADMIN_PASSWORD);
 return u&&u.globalRole==="admin";
}
const allowedRoles=new Set(["admin","coordinator","judge","viewer"]);

export async function GET(request){
 try{
  if(!await admin(request))return Response.json({error:"Admin access required"},{status:403});
  const sql=getDb();await ensureAccountsTable(sql);
  const accounts=await sql.unsafe("SELECT id,email,name,global_role,active,last_login_at,created_at FROM eventra_accounts ORDER BY created_at DESC");
  return Response.json({accounts});
 }catch(e){return Response.json({error:"Unable to load accounts"},{status:500})}
}

export async function POST(request){
 try{
  if(!await admin(request))return Response.json({error:"Admin access required"},{status:403});
  const b=await request.json(),email=String(b.email||"").trim().toLowerCase(),password=String(b.password||"");
  const role=String(b.globalRole||"viewer").toLowerCase();
  if(!email.includes("@")||password.length<8||!allowedRoles.has(role))
    return Response.json({error:"Valid email, an 8+ character password, and a supported role are required"},{status:400});
  const sql=getDb();await ensureAccountsTable(sql);
  const rows=await sql.unsafe(
   "INSERT INTO eventra_accounts(email,name,password_hash,global_role,active) VALUES(lower($1),$2,$3,$4,true) RETURNING id,email,name,global_role,active",
   [email,b.name?.trim()||email.split("@")[0],await hashPassword(password),role]
  );
  await auditLog(request,{action:"user.created",entityType:"account",entityId:rows[0].id,changes:safeChanges({email,name:rows[0].name,globalRole:role})});
  return Response.json({account:rows[0]},{status:201});
 }catch(e){
  return Response.json({error:String(e?.message||"").toLowerCase().includes("duplicate")?"Account already exists":"Unable to create account"},{status:400});
 }
}

export async function PATCH(request){
 try{
  if(!await admin(request))return Response.json({error:"Admin access required"},{status:403});
  const b=await request.json(),sql=getDb();await ensureAccountsTable(sql);
  if(!b.id)return Response.json({error:"id is required"},{status:400});
  const role=b.globalRole===undefined?null:String(b.globalRole).toLowerCase();
  if(role&&!allowedRoles.has(role))return Response.json({error:"Unsupported role"},{status:400});
  if(b.password&&String(b.password).length<8)return Response.json({error:"Password must be at least 8 characters"},{status:400});
  if(b.password){await sql.unsafe("UPDATE eventra_accounts SET password_hash=$1,password_changed_at=now(),updated_at=now() WHERE id=$2",[await hashPassword(String(b.password)),b.id]);await revokeAccountSessions(b.id);}
  const rows=await sql.unsafe(
   "UPDATE eventra_accounts SET name=COALESCE($1,name),global_role=COALESCE($2,global_role),active=COALESCE($3,active),updated_at=now() WHERE id=$4 RETURNING id,email,name,global_role,active",
   [b.name?.trim()||null,role,typeof b.active==="boolean"?b.active:null,b.id]
  );
  if(!rows[0])return Response.json({error:"Account not found"},{status:404});
  if(typeof b.active==="boolean"&&!b.active)await revokeAccountSessions(b.id);
  await auditLog(request,{action:"user.updated",entityType:"account",entityId:rows[0].id,changes:safeChanges({name:b.name,globalRole:role,active:b.active,passwordChanged:Boolean(b.password)})});
  return Response.json({account:rows[0]});
 }catch(e){return Response.json({error:"Unable to update account"},{status:400})}
}
