import {getDb} from "../../../../lib/db";
import {parseUserToken} from "../../../../lib/auth";
import {auditLog} from "../../../../lib/audit";

async function admin(request){
 const u=await parseUserToken(request.cookies.get("eventra_session")?.value,process.env.EVENTRA_ADMIN_PASSWORD);
 return u&&u.globalRole==="admin";
}
const roles=new Set(["coordinator","judge","viewer"]);

export async function GET(request){
 try{
  if(!await admin(request))return Response.json({error:"Admin access required"},{status:403});
  const eventId=new URL(request.url).searchParams.get("eventId");
  if(!eventId)return Response.json({error:"eventId is required"},{status:400});
  const rows=await getDb()`SELECT id,event_id,email,role,active,created_at FROM event_roles WHERE event_id=${eventId} ORDER BY role,email`;
  return Response.json({assignments:rows});
 }catch(e){return Response.json({error:"Unable to load event roles"},{status:500})}
}

export async function POST(request){
 try{
  if(!await admin(request))return Response.json({error:"Admin access required"},{status:403});
  const b=await request.json(),email=String(b.email||"").trim().toLowerCase(),role=String(b.role||"").toLowerCase();
  if(!b.eventId||!email||!roles.has(role))return Response.json({error:"eventId, email and a supported event role are required"},{status:400});
  const sql=getDb();
  const account=await sql`SELECT id FROM eventra_accounts WHERE lower(email)=${email} LIMIT 1`;
  if(!account[0])return Response.json({error:"User account not found"},{status:404});
  const event=await sql`SELECT id FROM events WHERE id=${b.eventId} LIMIT 1`;
  if(!event[0])return Response.json({error:"Event not found"},{status:404});
  const rows=await sql`INSERT INTO event_roles(event_id,email,role,active) VALUES(${b.eventId},${email},${role},true)
    ON CONFLICT(event_id,email) DO UPDATE SET role=EXCLUDED.role,active=true RETURNING id,event_id,email,role,active,created_at`;
  await auditLog(request,{action:"event.role.assigned",eventId:b.eventId,entityType:"event_role",entityId:rows[0].id,changes:{email,role}});
  return Response.json({assignment:rows[0]},{status:201});
 }catch(e){return Response.json({error:"Unable to assign event role"},{status:400})}
}

export async function DELETE(request){
 try{
  if(!await admin(request))return Response.json({error:"Admin access required"},{status:403});
  const id=new URL(request.url).searchParams.get("id");
  if(!id)return Response.json({error:"id is required"},{status:400});
  const sql=getDb();const rows=await sql`DELETE FROM event_roles WHERE id=${id} RETURNING *`;
  if(!rows[0])return Response.json({error:"Assignment not found"},{status:404});
  await auditLog(request,{action:"event.role.removed",eventId:rows[0].event_id,entityType:"event_role",entityId:rows[0].id,changes:{email:rows[0].email,role:rows[0].role}});
  return Response.json({ok:true});
 }catch(e){return Response.json({error:"Unable to remove event role"},{status:400})}
}
