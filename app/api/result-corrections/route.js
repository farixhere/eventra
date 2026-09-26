import {getDb} from "../../../lib/db";
import {auditLog,safeChanges} from "../../../lib/audit";

export async function POST(request){
 try{
  const b=await request.json();
  if(!b.eventId||!b.resultId||!b.reason)return Response.json({error:"eventId, resultId and reason are required"},{status:400});
  const sql=getDb();
  const old=await sql`SELECT r.*,p.event_id FROM results r JOIN programmes p ON p.id=r.programme_id WHERE r.id=${b.resultId} AND p.event_id=${b.eventId} LIMIT 1`;
  if(!old.length)return Response.json({error:"Result not found"},{status:403});
  if(old[0].published===false&&old[0].verification_status!=="verified")return Response.json({error:"Only verified results can be corrected"},{status:409});
  const next={position:b.position??old[0].position,points:b.points??old[0].points,total_score:b.totalScore??old[0].total_score,notes:b.notes??old[0].notes};
  await sql`UPDATE results SET position=${next.position},points=${next.points},total_score=${next.total_score},notes=${next.notes},corrected_at=now(),correction_reason=${b.reason},published=false WHERE id=${b.resultId}`;
  const u=await (await import("../../../lib/auth")).parseUserToken(request.cookies.get("eventra_session")?.value,process.env.EVENTRA_ADMIN_PASSWORD);
  const by=u?.email||"unknown";
  const previousJson=JSON.stringify(old[0]),nextJson=JSON.stringify(next);
  const correction=(await sql`INSERT INTO result_corrections(event_id,result_id,previous_value,new_value,reason,corrected_by) VALUES(${b.eventId},${b.resultId},${previousJson}::jsonb,${nextJson}::jsonb,${b.reason},${by}) RETURNING *`)[0];
  await auditLog(request,{action:"result.corrected",eventId:b.eventId,entityType:"result",entityId:b.resultId,changes:safeChanges({reason:b.reason,previous:old[0],newValue:next})});
  return Response.json({result:next,correction});
 }catch(error){console.error("POST /api/result-corrections failed",error);return Response.json({error:"Unable to correct result"},{status:500})}
}
