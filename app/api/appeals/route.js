import { getDb } from "../../../lib/db";

export async function GET(request){
  try{
    const eventId=new URL(request.url).searchParams.get("eventId");
    if(!eventId)return Response.json({error:"eventId is required"},{status:400});
    const sql=getDb();
    const rows=await sql`SELECT a.*,p.name AS participant_name,t.name AS team_name FROM appeals a LEFT JOIN participants p ON p.id=a.participant_id LEFT JOIN teams t ON t.id=a.team_id WHERE a.event_id=${eventId} ORDER BY a.created_at DESC`;
    return Response.json({appeals:rows});
  }catch(error){
    console.error("GET /api/appeals failed",error);
    return Response.json({error:"Unable to load appeals"},{status:500});
  }
}

export async function POST(request){
  try{
    const b=await request.json();
    if(!b.eventId||!b.submittedBy||!b.reason)return Response.json({error:"eventId, submittedBy and reason are required"},{status:400});
    const sql=getDb();
    const event=await sql`SELECT id FROM events WHERE id=${b.eventId} LIMIT 1`;
    if(!event.length)return Response.json({error:"Event not found"},{status:404});
    const rows=await sql`INSERT INTO appeals(event_id,result_id,participant_id,team_id,submitted_by,reason,evidence_url,status) VALUES(${b.eventId},${b.resultId||null},${b.participantId||null},${b.teamId||null},${b.submittedBy},${b.reason},${b.evidenceUrl||null},'submitted') RETURNING *`;
    return Response.json({appeal:rows[0]},{status:201});
  }catch(error){
    console.error("POST /api/appeals failed",error);
    return Response.json({error:"Unable to submit appeal"},{status:500});
  }
}
