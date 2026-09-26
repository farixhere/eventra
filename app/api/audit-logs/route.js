import { getDb } from "../../../lib/db";
import { parseUserToken } from "../../../lib/auth";

export async function GET(request){
 try{
  const u=await parseUserToken(request.cookies.get("eventra_session")?.value);
  if(!u||u.globalRole!=="admin")return Response.json({error:"Admin access required"},{status:403});
  const q=new URL(request.url).searchParams,eventId=q.get("eventId"),actor=q.get("user"),action=q.get("action"),from=q.get("from"),to=q.get("to");
  const limit=Math.min(200,Math.max(1,Number(q.get("limit")||100)));
  const sql=getDb();
  const rows=await sql`SELECT id,event_id,action,entity_type,entity_id,changes,created_at FROM audit_logs
    WHERE (${eventId}::uuid IS NULL OR event_id=${eventId})
      AND (${actor}::text IS NULL OR changes->'_meta'->>'actorEmail' ILIKE '%'||${actor}||'%')
      AND (${action}::text IS NULL OR action=${action})
      AND (${from}::timestamptz IS NULL OR created_at>=${from})
      AND (${to}::timestamptz IS NULL OR created_at<=${to})
    ORDER BY created_at DESC LIMIT ${limit}`;
  return Response.json({logs:rows},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return Response.json({error:"Unable to load audit history"},{status:500})}
}
