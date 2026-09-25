import { getDb } from "../../../lib/db";

export async function GET(request){
  try{
    const eventId=new URL(request.url).searchParams.get("eventId");
    if(!eventId)return Response.json({error:"eventId is required"},{status:400});
    const rows=await getDb()`SELECT a.*,p.name AS participant_name,t.name AS team_name FROM appeals a LEFT JOIN participants p ON p.id=a.participant_id LEFT JOIN teams t ON t.id=a.team_id WHERE a.event_id=${eventId} ORDER BY a.created_at DESC`;
    return Response.json({appeals:rows});
  }catch{return Response.json({error:"Unable to load appeals"},{status:500});}
}
export async function POST(request){
  try{
    const b=await request.json();
    if(!b.eventId||!b.submittedBy||!b.reason)return Response.json({error:"eventId, submittedBy and reason are required"},{status:400});
    const rows=await getDb()`INSERT INTO appeals(event_id,result_id,participant_id,team_id,submitted_by,reason,evidence_url,status) VALUES(${b.eventId},${b.resultId||null},${b.participantId||null},${b.teamId||null},${b.submittedBy},${b.reason},${b.evidenceUrl||null},'submitted') RETURNING *`;
    return Response.json({appeal:rows[0]},{status:201});
  }catch{return Response.json({error:"Unable to submit appeal"},{status:500});}
}