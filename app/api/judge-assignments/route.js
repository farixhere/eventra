import {getDb} from "../../../lib/db";
import {auditLog} from "../../../lib/audit";

export async function GET(request){
 try{
  const eventId=new URL(request.url).searchParams.get("eventId");if(!eventId)return Response.json({error:"eventId is required"},{status:400});
  const sql=getDb(),{parseUserToken}=await import("../../../lib/auth"),u=await parseUserToken(request.cookies.get("eventra_session")?.value,process.env.EVENTRA_ADMIN_PASSWORD);
  if(!u)return Response.json({error:"Authentication required"},{status:401});
  const rows=u.globalRole==="admin"||u.globalRole==="coordinator"
   ? await sql`SELECT ja.id,ja.event_id,ja.programme_id,ja.email,ja.criteria,ja.active,ja.created_at,p.name AS programme_name FROM judge_assignments ja JOIN programmes p ON p.id=ja.programme_id WHERE ja.event_id=${eventId} ORDER BY p.name,ja.email`
   : await sql`SELECT ja.id,ja.event_id,ja.programme_id,ja.email,ja.criteria,ja.active,ja.created_at,p.name AS programme_name FROM judge_assignments ja JOIN programmes p ON p.id=ja.programme_id WHERE ja.event_id=${eventId} AND lower(ja.email)=lower(${u.email}) AND ja.active=true ORDER BY p.name`;
  return Response.json({assignments:rows});
 }catch(error){return Response.json({error:"Unable to load judge assignments"},{status:500})}
}
export async function POST(request){
 try{
  const b=await request.json();if(!b.eventId||!b.programmeId||!b.email?.trim())return Response.json({error:"eventId, programmeId and email are required"},{status:400});
  const sql=getDb(),programme=await sql`SELECT id FROM programmes WHERE id=${b.programmeId} AND event_id=${b.eventId}`;
  if(!programme.length)return Response.json({error:"Programme not found for this event"},{status:403});
  const account=await sql`SELECT id FROM users WHERE lower(email)=lower(${b.email.trim()}) AND active=true LIMIT 1`;
  if(!account.length)return Response.json({error:"Judge account not found or inactive"},{status:400});
  const rows=await sql`INSERT INTO judge_assignments(event_id,programme_id,email,criteria,active) VALUES(${b.eventId},${b.programmeId},LOWER(TRIM(${b.email})),${JSON.stringify(b.criteria||[])}::jsonb,${b.active!==false}) ON CONFLICT(programme_id,email) DO UPDATE SET criteria=EXCLUDED.criteria,active=true RETURNING *`;
  await auditLog(request,{action:"judge.assignment.created",eventId:b.eventId,entityType:"judge_assignment",entityId:rows[0].id,changes:{programmeId:b.programmeId,email:rows[0].email}});
  return Response.json({assignment:rows[0]},{status:201});
 }catch(error){return Response.json({error:"Unable to assign judge"},{status:400})}
}
export async function DELETE(request){
 try{
  const id=new URL(request.url).searchParams.get("id");if(!id)return Response.json({error:"id is required"},{status:400});
  const sql=getDb(),rows=await sql`DELETE FROM judge_assignments WHERE id=${id} RETURNING *`;
  if(!rows[0])return Response.json({error:"Assignment not found"},{status:404});
  await auditLog(request,{action:"judge.assignment.removed",eventId:rows[0].event_id,entityType:"judge_assignment",entityId:rows[0].id,changes:{email:rows[0].email,programmeId:rows[0].programme_id}});
  return Response.json({ok:true});
 }catch(error){return Response.json({error:"Unable to remove judge assignment"},{status:500})}
}
