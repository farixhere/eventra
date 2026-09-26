import { getDb } from "../../../lib/db";

export async function GET(request){
  try{
    const eventId=new URL(request.url).searchParams.get("eventId");
    if(!eventId)return Response.json({error:"eventId is required"},{status:400});
    const sql=getDb();
    const rows=await sql`SELECT ja.*,p.name AS programme_name FROM judge_assignments ja JOIN programmes p ON p.id=ja.programme_id WHERE ja.event_id=${eventId} ORDER BY p.name,ja.email`;
    return Response.json({assignments:rows});
  }catch(error){console.error(error);return Response.json({error:"Unable to load judge assignments"},{status:500});}
}
export async function POST(request){
  try{
    const b=await request.json();
    if(!b.eventId||!b.programmeId||!b.email?.trim())return Response.json({error:"eventId, programmeId and email are required"},{status:400});
    const sql=getDb();
    const programme=await sql`SELECT id FROM programmes WHERE id=${b.programmeId} AND event_id=${b.eventId}`;
    if(!programme.length)return Response.json({error:"Programme not found for this event"},{status:404});
    const rows=await sql`INSERT INTO judge_assignments(event_id,programme_id,email,criteria,active) VALUES(${b.eventId},${b.programmeId},LOWER(TRIM(${b.email})),${JSON.stringify(b.criteria||[])}::jsonb,${b.active!==false}) ON CONFLICT(programme_id,email) DO UPDATE SET criteria=EXCLUDED.criteria,active=true RETURNING *`;
    return Response.json({assignment:rows[0]},{status:201});
  }catch(error){console.error(error);return Response.json({error:"Unable to assign judge"},{status:500});}
}
export async function DELETE(request){
  try{const id=new URL(request.url).searchParams.get("id");if(!id)return Response.json({error:"id is required"},{status:400});await getDb()`DELETE FROM judge_assignments WHERE id=${id}`;return Response.json({ok:true});}
  catch(error){return Response.json({error:"Unable to remove judge assignment"},{status:500});}
}