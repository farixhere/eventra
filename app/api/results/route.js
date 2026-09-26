import {getDb} from "../../../lib/db";
import {parseUserToken} from "../../../lib/auth";
import {auditLog,safeChanges} from "../../../lib/audit";

async function user(request){return parseUserToken(request.cookies.get("eventra_session")?.value,process.env.EVENTRA_ADMIN_PASSWORD)}

export async function GET(request){
 try{
  const eventId=new URL(request.url).searchParams.get("eventId");if(!eventId)return Response.json({error:"eventId is required"},{status:400});
  const u=await user(request);if(!u)return Response.json({error:"Authentication required"},{status:401});
  const sql=getDb();
  const roleRows=u.globalRole==="admin"?[]:await sql`SELECT role FROM event_roles WHERE event_id=${eventId} AND lower(email)=lower(${u.email}) AND active=true LIMIT 1`;
  const role=u.globalRole==="admin"?"admin":roleRows[0]?.role;
  if(!role)return Response.json({error:"You are not assigned to this event"},{status:403});
  const rows=role==="judge"
   ? await sql`SELECT r.id,r.programme_id,r.participant_id,r.team_id,r.position,r.total_score,r.points,r.notes,r.published,r.published_at,r.created_at,p.name AS programme_name,p.type AS programme_type,COALESCE(part.name,tm.name) AS entry_name,tm.name AS team_name FROM results r JOIN programmes p ON p.id=r.programme_id LEFT JOIN participants part ON part.id=r.participant_id LEFT JOIN teams tm ON tm.id=r.team_id WHERE p.event_id=${eventId} AND r.published=true ORDER BY r.position ASC,r.created_at ASC`
   : await sql`SELECT r.id,r.programme_id,r.participant_id,r.team_id,r.position,r.total_score,r.points,r.notes,r.published,r.published_at,r.created_at,p.name AS programme_name,p.type AS programme_type,COALESCE(part.name,tm.name) AS entry_name,tm.name AS team_name FROM results r JOIN programmes p ON p.id=r.programme_id LEFT JOIN participants part ON part.id=r.participant_id LEFT JOIN teams tm ON tm.id=r.team_id WHERE p.event_id=${eventId} ORDER BY r.published DESC,r.position ASC,r.created_at ASC`;
  return Response.json({results:rows});
 }catch(error){console.error("GET /api/results failed",error);return Response.json({error:"Unable to load results"},{status:500})}
}

export async function POST(request){
 try{
  const body=await request.json();if(!body.eventId||!body.programmeId)return Response.json({error:"Event and programme are required"},{status:400});
  const position=Number(body.position);if(!Number.isInteger(position)||position<1)return Response.json({error:"Position must be a positive whole number"},{status:400});
  const sql=getDb();
  const programmes=await sql`SELECT id,event_id,type FROM programmes WHERE id=${body.programmeId} AND event_id=${body.eventId}`;if(!programmes[0])return Response.json({error:"Programme not found for this event"},{status:403});
  const programme=programmes[0],participantId=body.participantId||null,teamId=body.teamId||null;
  if(programme.type==="team"&&!teamId)return Response.json({error:"Select a team for this programme"},{status:400});
  if(programme.type==="individual"&&!participantId)return Response.json({error:"Select a participant for this programme"},{status:400});
  if(teamId){const team=await sql`SELECT id FROM teams WHERE id=${teamId} AND event_id=${body.eventId}`;if(!team[0])return Response.json({error:"Selected team does not belong to this event"},{status:400})}
  if(participantId){const participant=await sql`SELECT id FROM participants WHERE id=${participantId} AND event_id=${body.eventId}`;if(!participant[0])return Response.json({error:"Selected participant does not belong to this event"},{status:400})}
  const duplicate=await sql`SELECT id FROM results WHERE programme_id=${body.programmeId} AND COALESCE(participant_id::text,'')=COALESCE(${participantId}::text,'') AND COALESCE(team_id::text,'')=COALESCE(${teamId}::text,'') LIMIT 1`;if(duplicate[0])return Response.json({error:"A result already exists for this entry"},{status:409});
  const totalScore=body.totalScore===""||body.totalScore==null?null:Number(body.totalScore),points=body.points===""||body.points==null?0:Number(body.points);
  if(totalScore!==null&&!Number.isFinite(totalScore)||!Number.isFinite(points))return Response.json({error:"Scores must be valid numbers"},{status:400});
  const rows=await sql`INSERT INTO results(programme_id,participant_id,team_id,position,total_score,points,notes,published,published_at,verification_status) VALUES(${body.programmeId},${participantId},${teamId},${position},${totalScore},${points},${body.notes?.trim()||null},false,null,'draft') RETURNING id,programme_id,participant_id,team_id,position,total_score,points,notes,published,published_at,verification_status,created_at`;
  await auditLog(request,{action:"result.created",eventId:body.eventId,entityType:"result",entityId:rows[0].id,changes:safeChanges(rows[0])});
  return Response.json({result:rows[0]},{status:201});
 }catch(error){console.error("POST /api/results failed",error);return Response.json({error:"Unable to create result"},{status:500})}
}

export async function PATCH(request){
 try{
  const body=await request.json();if(!body.id)return Response.json({error:"id is required"},{status:400});
  const sql=getDb();const current=await sql`SELECT r.*,p.event_id FROM results r JOIN programmes p ON p.id=r.programme_id WHERE r.id=${body.id} LIMIT 1`;
  if(!current[0])return Response.json({error:"Result not found"},{status:404});
  if(current[0].published)return Response.json({error:"Published results are immutable; use result correction with an audit reason"},{status:409});
  if(body.published)return Response.json({error:"Use POST /api/results/publish to publish a verified result"},{status:409});
  const rows=await sql`UPDATE results SET position=COALESCE(${body.position??null},position),total_score=COALESCE(${body.totalScore??null},total_score),points=COALESCE(${body.points??null},points),notes=COALESCE(${body.notes??null},notes) WHERE id=${body.id} RETURNING *`;
  await auditLog(request,{action:"result.updated",eventId:current[0].event_id,entityType:"result",entityId:rows[0].id,changes:safeChanges(rows[0])});
  return Response.json({result:rows[0]});
 }catch(error){console.error("PATCH /api/results failed",error);return Response.json({error:"Unable to update result"},{status:500})}
}

export async function DELETE(request){
 try{
  const id=new URL(request.url).searchParams.get("id");if(!id)return Response.json({error:"id is required"},{status:400});
  const sql=getDb();const current=await sql`SELECT r.id,p.event_id,r.published FROM results r JOIN programmes p ON p.id=r.programme_id WHERE r.id=${id} LIMIT 1`;
  if(!current[0])return Response.json({error:"Result not found"},{status:404});
  if(current[0].published)return Response.json({error:"Published results cannot be deleted"},{status:409});
  await sql`DELETE FROM results WHERE id=${id}`;
  await auditLog(request,{action:"result.deleted",eventId:current[0].event_id,entityType:"result",entityId:id});
  return Response.json({ok:true});
 }catch(error){console.error("DELETE /api/results failed",error);return Response.json({error:"Unable to delete result"},{status:500})}
}
