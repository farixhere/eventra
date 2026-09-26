import { createHash } from "crypto";
import { getDb } from "../../../../lib/db";
export async function GET(request){
  try{
    const raw=request.headers.get("x-eventra-api-key")||"";
    if(!raw)return Response.json({error:"x-eventra-api-key is required"},{status:401});
    const hash=createHash("sha256").update(raw).digest("hex"),sql=getDb();
    const keys=await sql`SELECT id,event_id FROM api_keys WHERE key_hash=${hash} AND active=true AND (expires_at IS NULL OR expires_at>now()) LIMIT 1`;
    if(!keys[0])return Response.json({error:"Invalid or expired API key"},{status:401});
    await sql`UPDATE api_keys SET last_used_at=now() WHERE id=${keys[0].id}`;
    const rows=await sql`SELECT r.id,r.position,r.total_score,r.points,r.published,r.published_at,p.name AS programme_name,COALESCE(part.name,t.name) AS recipient_name,t.name AS team_name FROM results r JOIN programmes p ON p.id=r.programme_id LEFT JOIN participants part ON part.id=r.participant_id LEFT JOIN teams t ON t.id=r.team_id WHERE p.event_id=${keys[0].event_id} AND r.published=true ORDER BY p.name,r.position NULLS LAST`;
    return Response.json({results:rows,eventId:keys[0].event_id});
  }catch(e){console.error(e);return Response.json({error:"Unable to load API results"},{status:500})}
}