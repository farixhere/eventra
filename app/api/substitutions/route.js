import { getDb } from "../../../lib/db";

export async function GET(request){
  try{const eventId=new URL(request.url).searchParams.get("eventId");if(!eventId)return Response.json({error:"eventId is required"},{status:400});const sql=getDb();const rows=await sql`SELECT s.*,p.name AS programme_name,o.name AS original_name,r.name AS replacement_name FROM substitutions s LEFT JOIN programmes p ON p.id=s.programme_id LEFT JOIN participants o ON o.id=s.original_participant_id LEFT JOIN participants r ON r.id=s.replacement_participant_id WHERE s.event_id=${eventId} ORDER BY s.created_at DESC`;return Response.json({substitutions:rows});}
  catch(error){return Response.json({error:"Unable to load substitutions"},{status:500});}
}
export async function POST(request){
  try{const b=await request.json();if(!b.eventId||!b.originalParticipantId||!b.replacementParticipantId||!b.reason?.trim())return Response.json({error:"eventId, original participant, replacement participant and reason are required"},{status:400});const sql=getDb();const participants=await sql`SELECT id FROM participants WHERE id IN (${b.originalParticipantId},${b.replacementParticipantId}) AND event_id=${b.eventId}`;if(participants.length!==2)return Response.json({error:"Both participants must belong to this event"},{status:400});const rows=await sql`INSERT INTO substitutions(event_id,programme_id,original_participant_id,replacement_participant_id,reason,approved_by,status,notes) VALUES(${b.eventId},${b.programmeId||null},${b.originalParticipantId},${b.replacementParticipantId},${b.reason},${b.approvedBy||null},${b.status||"pending"},${b.notes||null}) RETURNING *`;return Response.json({substitution:rows[0]},{status:201});}
  catch(error){return Response.json({error:"Unable to create substitution"},{status:500});}
}
export async function PATCH(request){
  try{const b=await request.json();if(!b.id)return Response.json({error:"id is required"},{status:400});const sql=getDb();const rows=await sql`UPDATE substitutions SET status=COALESCE(${b.status||null},status),approved_by=COALESCE(${b.approvedBy||null},approved_by),notes=CASE WHEN ${b.notes===undefined} THEN notes ELSE ${b.notes||null} END WHERE id=${b.id} RETURNING *`;if(!rows.length)return Response.json({error:"Substitution not found"},{status:404});return Response.json({substitution:rows[0]});}
  catch(error){return Response.json({error:"Unable to update substitution"},{status:500});}
}