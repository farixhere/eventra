import {getDb} from "../../../lib/db";
import {parseUserToken} from "../../../lib/auth";
import {auditLog,safeChanges} from "../../../lib/audit";

async function session(request){return parseUserToken(request.cookies.get("eventra_session")?.value,process.env.EVENTRA_ADMIN_PASSWORD)}

export async function GET(request){
 try{
  const q=new URL(request.url).searchParams,eventId=q.get("eventId"),programmeId=q.get("programmeId");
  if(!eventId)return Response.json({error:"eventId is required"},{status:400});
  const user=await session(request);if(!user)return Response.json({error:"Authentication required"},{status:401});
  const sql=getDb();
  let rows;
  if(user.globalRole==="admin"){
   rows=programmeId
    ? await sql`SELECT js.id,js.event_id,js.programme_id,js.participant_id,js.team_id,js.judge_email,js.criteria_scores,js.total_score,js.status,js.submitted_at,p.name AS programme_name,part.name AS participant_name,t.name AS team_name FROM judge_scores js JOIN programmes p ON p.id=js.programme_id LEFT JOIN participants part ON part.id=js.participant_id LEFT JOIN teams t ON t.id=js.team_id WHERE js.event_id=${eventId} AND js.programme_id=${programmeId} ORDER BY js.created_at DESC`
    : await sql`SELECT js.id,js.event_id,js.programme_id,js.participant_id,js.team_id,js.judge_email,js.criteria_scores,js.total_score,js.status,js.submitted_at,p.name AS programme_name,part.name AS participant_name,t.name AS team_name FROM judge_scores js JOIN programmes p ON p.id=js.programme_id LEFT JOIN participants part ON part.id=js.participant_id LEFT JOIN teams t ON t.id=js.team_id WHERE js.event_id=${eventId} ORDER BY js.created_at DESC`;
  }else if(user.globalRole==="coordinator"){
   rows=programmeId
    ? await sql`SELECT js.id,js.event_id,js.programme_id,js.participant_id,js.team_id,js.judge_email,js.criteria_scores,js.total_score,js.status,js.submitted_at,p.name AS programme_name,part.name AS participant_name,t.name AS team_name FROM judge_scores js JOIN programmes p ON p.id=js.programme_id LEFT JOIN participants part ON part.id=js.participant_id LEFT JOIN teams t ON t.id=js.team_id WHERE js.event_id=${eventId} AND js.programme_id=${programmeId} ORDER BY js.created_at DESC`
    : await sql`SELECT js.id,js.event_id,js.programme_id,js.participant_id,js.team_id,js.judge_email,js.criteria_scores,js.total_score,js.status,js.submitted_at,p.name AS programme_name,part.name AS participant_name,t.name AS team_name FROM judge_scores js JOIN programmes p ON p.id=js.programme_id LEFT JOIN participants part ON part.id=js.participant_id LEFT JOIN teams t ON t.id=js.team_id WHERE js.event_id=${eventId} ORDER BY js.created_at DESC`;
  }else{
   rows=programmeId
    ? await sql`SELECT js.id,js.event_id,js.programme_id,js.participant_id,js.team_id,js.judge_email,js.criteria_scores,js.total_score,js.status,js.submitted_at,p.name AS programme_name,part.name AS participant_name,t.name AS team_name FROM judge_scores js JOIN programmes p ON p.id=js.programme_id LEFT JOIN participants part ON part.id=js.participant_id LEFT JOIN teams t ON t.id=js.team_id JOIN judge_assignments ja ON ja.programme_id=js.programme_id AND lower(ja.email)=lower(js.judge_email) AND ja.active=true WHERE js.event_id=${eventId} AND js.programme_id=${programmeId} AND lower(js.judge_email)=lower(${user.email}) ORDER BY js.created_at DESC`
    : await sql`SELECT js.id,js.event_id,js.programme_id,js.participant_id,js.team_id,js.judge_email,js.criteria_scores,js.total_score,js.status,js.submitted_at,p.name AS programme_name,part.name AS participant_name,t.name AS team_name FROM judge_scores js JOIN programmes p ON p.id=js.programme_id LEFT JOIN participants part ON part.id=js.participant_id LEFT JOIN teams t ON t.id=js.team_id JOIN judge_assignments ja ON ja.programme_id=js.programme_id AND lower(ja.email)=lower(js.judge_email) AND ja.active=true WHERE js.event_id=${eventId} AND lower(js.judge_email)=lower(${user.email}) ORDER BY js.created_at DESC`;
  }
  return Response.json({scores:rows});
 }catch(error){console.error("GET /api/judge-scores failed",error);return Response.json({error:"Unable to load judge scores"},{status:500})}
}

export async function POST(request){
 try{
  const b=await request.json(),user=await session(request);
  if(!user)return Response.json({error:"Authentication required"},{status:401});
  if(user.globalRole!=="admin"){
   const assignment=await getDb()`SELECT id FROM judge_assignments WHERE event_id=${b.eventId} AND programme_id=${b.programmeId} AND lower(email)=lower(${user.email}) AND active=true LIMIT 1`;
   if(!assignment[0])return Response.json({error:"You are not assigned to this programme"},{status:403});
  }
  if(!b.eventId||!b.programmeId)return Response.json({error:"eventId and programmeId are required"},{status:400});
  const sql=getDb();
  const programme=await sql`SELECT id,event_id,type FROM programmes WHERE id=${b.programmeId} AND event_id=${b.eventId} LIMIT 1`;
  if(!programme.length)return Response.json({error:"Programme not found for this event"},{status:403});
  const criteria=await sql`SELECT id,max_score,weight FROM programme_criteria WHERE programme_id=${b.programmeId} AND active=true ORDER BY sort_order`;
  if(!criteria.length)return Response.json({error:"No active judging criteria are configured for this programme"},{status:400});
  const scores=b.criteriaScores&&typeof b.criteriaScores==="object"?b.criteriaScores:{};
  let total=0;
  for(const c of criteria){
   const raw=scores[c.id];
   if(raw===undefined||raw===null||raw==="")return Response.json({error:"Every active criterion requires a score"},{status:400});
   const value=Number(raw);
   if(!Number.isFinite(value)||value<0||value>Number(c.max_score))return Response.json({error:"Invalid score for criterion "+c.id},{status:400});
   total+=value*Number(c.weight||1);
  }
  const participantId=b.participantId||null,teamId=b.teamId||null;
  if(programme[0].type==="individual"&&!participantId)return Response.json({error:"Participant is required for an individual programme"},{status:400});
  if(programme[0].type==="team"&&!teamId)return Response.json({error:"Team is required for a team programme"},{status:400});
  if(teamId){const team=await sql`SELECT id FROM teams WHERE id=${teamId} AND event_id=${b.eventId}`;if(!team[0])return Response.json({error:"Selected team does not belong to this event"},{status:400})}
  if(participantId){const part=await sql`SELECT id FROM participants WHERE id=${participantId} AND event_id=${b.eventId}`;if(!part[0])return Response.json({error:"Selected participant does not belong to this event"},{status:400})}
  const judgeEmail=user.email;
  const duplicate=await sql`SELECT id FROM judge_scores WHERE event_id=${b.eventId} AND programme_id=${b.programmeId} AND lower(judge_email)=lower(${judgeEmail}) AND COALESCE(participant_id::text,'')=COALESCE(${participantId}::text,'') AND COALESCE(team_id::text,'')=COALESCE(${teamId}::text,'') LIMIT 1`;
  if(duplicate[0])return Response.json({error:"This judge has already submitted a score for this entry"},{status:409});
  const rows=await sql`INSERT INTO judge_scores(event_id,programme_id,result_id,participant_id,team_id,judge_email,criteria_scores,total_score,status,submitted_at) VALUES(${b.eventId},${b.programmeId},${b.resultId||null},${participantId},${teamId},${judgeEmail},${JSON.stringify(scores)}::jsonb,${total},'submitted',now()) RETURNING id,event_id,programme_id,participant_id,team_id,judge_email,criteria_scores,total_score,status,submitted_at`;
  await auditLog(request,{action:"score.submitted",eventId:b.eventId,entityType:"judge_score",entityId:rows[0].id,changes:safeChanges({programmeId:b.programmeId,participantId,teamId,totalScore:total})});
  return Response.json({score:rows[0]},{status:201});
 }catch(error){console.error("POST /api/judge-scores failed",error);return Response.json({error:"Unable to save judge score"},{status:500})}
}
