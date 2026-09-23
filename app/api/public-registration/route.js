import { getDb } from "../../../lib/db";

export async function POST(request){
  try{
    const body=await request.json();
    if(!body.slug||!body.name?.trim()) return Response.json({error:"Event and name are required"},{status:400});
    const sql=getDb();
    const events=await sql`SELECT id,is_public,registration_open,registration_deadline FROM events WHERE slug=${body.slug} LIMIT 1`;
    if(!events.length)return Response.json({error:"Event not found"},{status:404});
    const event=events[0];
    if(!event.is_public)return Response.json({error:"This event is not public yet"},{status:403});
    if(!event.registration_open)return Response.json({error:"Registration is currently closed"},{status:403});
    if(event.registration_deadline&&new Date(event.registration_deadline)<new Date())return Response.json({error:"Registration deadline has passed"},{status:403});
    let code=body.participantCode?.trim()||null;
    if(code){const exists=await sql`SELECT id FROM participants WHERE event_id=${event.id} AND participant_code=${code}`;if(exists.length)return Response.json({error:"That participant code is already in use"},{status:409});}
    if(!code)code="P"+String(Date.now()).slice(-6);
    const rows=await sql`INSERT INTO participants(event_id,name,email,phone,participant_code) VALUES(${event.id},${body.name.trim()},${body.email?.trim()||null},${body.phone?.trim()||null},${code}) RETURNING id,name,email,phone,participant_code`;
    await sql`INSERT INTO event_analytics(event_id,total_participants) VALUES(${event.id},1) ON CONFLICT(event_id) DO UPDATE SET total_participants=event_analytics.total_participants+1,last_updated=now()`;
    return Response.json({participant:rows[0]},{status:201});
  }catch(error){return Response.json({error:"Unable to register"},{status:500});}
}
