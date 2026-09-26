import {getDb} from "../../../../lib/db";
import {parseUserToken} from "../../../../lib/auth";
import {auditLog,safeChanges} from "../../../../lib/audit";

export async function POST(request){
 try{
  const b=await request.json();
  if(!b.eventId||!b.programmeId||(!b.participantId&&!b.teamId))return Response.json({error:"eventId, programmeId and participantId or teamId are required"},{status:400});
  const sql=getDb(),u=await parseUserToken(request.cookies.get("eventra_session")?.value,process.env.EVENTRA_ADMIN_PASSWORD);
  const scores=b.participantId
   ? await sql`SELECT id,total_score FROM judge_scores WHERE event_id=${b.eventId} AND programme_id=${b.programmeId} AND participant_id=${b.participantId} AND team_id IS NULL AND status='submitted' ORDER BY created_at`
   : await sql`SELECT id,total_score FROM judge_scores WHERE event_id=${b.eventId} AND programme_id=${b.programmeId} AND team_id=${b.teamId} AND participant_id IS NULL AND status='submitted' ORDER BY created_at`;
  if(!scores.length)return Response.json({error:"No submitted judge scores found for this entry"},{status:400});
  const average=scores.reduce((s,r)=>s+Number(r.total_score||0),0)/scores.length;
  const existing=b.participantId
   ? await sql`SELECT id,published FROM results WHERE programme_id=${b.programmeId} AND participant_id=${b.participantId} AND team_id IS NULL LIMIT 1`
   : await sql`SELECT id,published FROM results WHERE programme_id=${b.programmeId} AND team_id=${b.teamId} AND participant_id IS NULL LIMIT 1`;
  if(existing[0]?.published)return Response.json({error:"Published result is immutable"},{status:409});
  const verifiedBy=u?.email||"system";
  let result;
  if(existing[0])result=(await sql`UPDATE results SET total_score=${average},verification_status='verified',verified_at=now(),verified_by=${verifiedBy},published=false WHERE id=${existing[0].id} RETURNING *`)[0];
  else result=(await sql`INSERT INTO results(programme_id,participant_id,team_id,position,total_score,points,published,verification_status,verified_at,verified_by) VALUES(${b.programmeId},${b.participantId||null},${b.teamId||null},1,${average},0,false,'verified',now(),${verifiedBy}) RETURNING *`)[0];
  const all=b.participantId
   ? await sql`SELECT id,total_score FROM results WHERE programme_id=${b.programmeId} AND participant_id IS NOT NULL AND verification_status='verified' ORDER BY total_score DESC,id`
   : await sql`SELECT id,total_score FROM results WHERE programme_id=${b.programmeId} AND team_id IS NOT NULL AND verification_status='verified' ORDER BY total_score DESC,id`;
  for(let i=0;i<all.length;i++)await sql`UPDATE results SET position=${i+1},points=${i===0?5:i===1?3:i===2?1:0} WHERE id=${all[i].id}`;
  result=(await sql`SELECT * FROM results WHERE id=${result.id}`)[0];
  await auditLog(request,{action:"result.verified",eventId:b.eventId,entityType:"result",entityId:result.id,changes:safeChanges({judgeScoreIds:scores.map(s=>s.id),average,position:result.position,points:result.points})});
  return Response.json({result,judgeCount:scores.length,average});
 }catch(error){console.error("POST /api/results/verify failed",error);return Response.json({error:"Unable to verify result"},{status:500})}
}

export async function PATCH(request){
 try{
  const b=await request.json();if(!b.id||b.status!=="verified")return Response.json({error:"id and status=verified are required"},{status:400});
  const sql=getDb(),current=await sql`SELECT r.*,p.event_id FROM results r JOIN programmes p ON p.id=r.programme_id WHERE r.id=${b.id} LIMIT 1`;
  if(!current[0])return Response.json({error:"Result not found"},{status:404});
  if(current[0].published)return Response.json({error:"Published result is immutable"},{status:409});
  const u=await parseUserToken(request.cookies.get("eventra_session")?.value,process.env.EVENTRA_ADMIN_PASSWORD);
  const rows=await sql`UPDATE results SET verification_status='verified',verified_at=now(),verified_by=${u?.email||"system"} WHERE id=${b.id} RETURNING *`;
  await auditLog(request,{action:"result.verified",eventId:current[0].event_id,entityType:"result",entityId:b.id,changes:safeChanges(rows[0])});
  return Response.json({result:rows[0]});
 }catch(e){return Response.json({error:"Unable to verify result"},{status:500})}
}
