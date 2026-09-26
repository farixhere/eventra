import {getDb} from "../../../../lib/db";
import {auditLog,safeChanges} from "../../../../lib/audit";
export async function POST(request){
 try{
  const b=await request.json();if(!b.eventId||!b.resultId)return Response.json({error:"eventId and resultId are required"},{status:400});
  const sql=getDb(),rows=await sql`SELECT r.*,p.event_id FROM results r JOIN programmes p ON p.id=r.programme_id WHERE r.id=${b.resultId} AND p.event_id=${b.eventId} LIMIT 1`;
  if(!rows[0])return Response.json({error:"Result not found for this event"},{status:403});
  if(rows[0].published)return Response.json({result:rows[0],idempotent:true});
  if(rows[0].verification_status!=="verified")return Response.json({error:"Result must be verified before publishing"},{status:409});
  const result=(await sql`UPDATE results SET published=true,published_at=now() WHERE id=${b.resultId} AND published=false RETURNING *`)[0];
  await auditLog(request,{action:"result.published",eventId:b.eventId,entityType:"result",entityId:b.resultId,changes:safeChanges({position:result.position,totalScore:result.total_score,points:result.points})});
  return Response.json({result});
 }catch(error){console.error("POST /api/results/publish failed",error);return Response.json({error:"Unable to publish result"},{status:500})}
}
