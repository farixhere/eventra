import { getDb } from "../../../lib/db";

export async function GET(request){
  try{
    const q=new URL(request.url).searchParams;
    const eventId=q.get("eventId"),programmeId=q.get("programmeId"),judgeEmail=q.get("judgeEmail");
    if(!eventId) return Response.json({error:"eventId is required"},{status:400});
    const sql=getDb();
    const rows=programmeId
      ? judgeEmail
        ? await sql`SELECT js.*,p.name AS programme_name,part.name AS participant_name,t.name AS team_name FROM judge_scores js JOIN programmes p ON p.id=js.programme_id LEFT JOIN participants part ON part.id=js.participant_id LEFT JOIN teams t ON t.id=js.team_id WHERE js.event_id=${eventId} AND js.programme_id=${programmeId} AND js.judge_email=${judgeEmail} ORDER BY js.created_at DESC`
        : await sql`SELECT js.*,p.name AS programme_name,part.name AS participant_name,t.name AS team_name FROM judge_scores js JOIN programmes p ON p.id=js.programme_id LEFT JOIN participants part ON part.id=js.participant_id LEFT JOIN teams t ON t.id=js.team_id WHERE js.event_id=${eventId} AND js.programme_id=${programmeId} ORDER BY js.created_at DESC`
      : await sql`SELECT js.*,p.name AS programme_name,part.name AS participant_name,t.name AS team_name FROM judge_scores js JOIN programmes p ON p.id=js.programme_id LEFT JOIN participants part ON part.id=js.participant_id LEFT JOIN teams t ON t.id=js.team_id WHERE js.event_id=${eventId} ORDER BY js.created_at DESC`;
    return Response.json({scores:rows});
  }catch(error){
    console.error("GET /api/judge-scores failed",error);
    return Response.json({error:"Unable to load judge scores"},{status:500});
  }
}

export async function POST(request){
  try{
    const b=await request.json();
    if(!b.eventId||!b.programmeId||!b.judgeEmail) return Response.json({error:"eventId, programmeId and judgeEmail are required"},{status:400});
    const sql=getDb();
    const programme=await sql`SELECT id,event_id,type FROM programmes WHERE id=${b.programmeId} AND event_id=${b.eventId} LIMIT 1`;
    if(!programme.length) return Response.json({error:"Programme not found for this event"},{status:404});
    const criteria=await sql`SELECT id,max_score,weight FROM programme_criteria WHERE programme_id=${b.programmeId} AND active=true ORDER BY sort_order`;
    if(!criteria.length) return Response.json({error:"No active judging criteria are configured for this programme"},{status:400});
    const scores=b.criteriaScores&&typeof b.criteriaScores==="object"?b.criteriaScores:{};
    let total=0;
    for(const c of criteria){
      const value=Number(scores[c.id]??0);
      if(!Number.isFinite(value)||value<0||value>Number(c.max_score)) return Response.json({error:"Invalid score for criterion "+c.id},{status:400});
      total+=value*Number(c.weight||1);
    }
    const participantId=b.participantId||null,teamId=b.teamId||null;
    if(programme[0].type==="individual"&&!participantId) return Response.json({error:"Participant is required for an individual programme"},{status:400});
    if(programme[0].type==="team"&&!teamId) return Response.json({error:"Team is required for a team programme"},{status:400});
    const rows=await sql`INSERT INTO judge_scores(event_id,programme_id,result_id,participant_id,team_id,judge_email,criteria_scores,total_score,status,submitted_at) VALUES(${b.eventId},${b.programmeId},${b.resultId||null},${participantId},${teamId},${b.judgeEmail},${JSON.stringify(scores)}::jsonb,${total},${b.status||"submitted"},now()) RETURNING *`;
    return Response.json({score:rows[0]},{status:201});
  }catch(error){
    console.error("POST /api/judge-scores failed",error);
    return Response.json({error:"Unable to save judge score"},{status:500});
  }
}
