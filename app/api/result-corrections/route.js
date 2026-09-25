import { getDb } from "../../../lib/db";

export async function POST(request){
  try{
    const b=await request.json();
    if(!b.eventId||!b.resultId||!b.reason||!b.correctedBy)return Response.json({error:"eventId, resultId, reason and correctedBy are required"},{status:400});
    const sql=getDb();
    const old=await sql`SELECT * FROM results WHERE id=${b.resultId} AND id IN (SELECT r.id FROM results r JOIN programmes p ON p.id=r.programme_id WHERE p.event_id=${b.eventId}) LIMIT 1`;
    if(!old.length)return Response.json({error:"Result not found"},{status:404});
    const next={position:b.position??old[0].position,points:b.points??old[0].points,total_score:b.totalScore??old[0].total_score,notes:b.notes??old[0].notes};
    await sql`UPDATE results SET position=${next.position},points=${next.points},total_score=${next.total_score},notes=${next.notes},corrected_at=now(),correction_reason=${b.reason} WHERE id=${b.resultId}`;
    const audit=await sql`INSERT INTO result_corrections(event_id,result_id,previous_value,new_value,reason,corrected_by) VALUES(${b.eventId},${b.resultId},${JSON.stringify(old[0])}::jsonb,${JSON.stringify(next)}::jsonb,${b.reason},${b.correctedBy}) RETURNING *`;
    return Response.json({result:next,correction:audit[0]});
  }catch{return Response.json({error:"Unable to correct result"},{status:500});}
}