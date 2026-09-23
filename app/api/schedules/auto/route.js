import { getDb } from "../../../lib/db";

export async function POST(request){
  try{
    const body=await request.json();
    if(!body.eventId) return Response.json({error:"eventId is required"},{status:400});
    const sql=getDb();
    const programmes=await sql`SELECT id,name,COALESCE(duration_minutes,30) AS duration_minutes FROM programmes WHERE event_id=${body.eventId} AND status <> 'cancelled' AND id NOT IN (SELECT programme_id FROM schedules) ORDER BY name`;
    const venues=await sql`SELECT id,name FROM venues WHERE event_id=${body.eventId} ORDER BY name`;
    if(!programmes.length) return Response.json({created:[],message:"No unscheduled programmes found"});
    if(!venues.length) return Response.json({error:"Add at least one venue before auto-scheduling"},{status:400});
    const start=new Date(body.startsAt || Date.now());
    const buffer=Number(body.bufferMinutes||10);
    const created=[];
    for(let i=0;i<programmes.length;i++){
      const p=programmes[i];
      const venue=venues[i%venues.length];
      const starts=new Date(start.getTime()+i*(Number(p.duration_minutes)+buffer)*60000);
      const ends=new Date(starts.getTime()+Number(p.duration_minutes)*60000);
      const rows=await sql`INSERT INTO schedules(programme_id,venue_id,starts_at,ends_at,status) VALUES(${p.id},${venue.id},${starts.toISOString()},${ends.toISOString()},'scheduled') RETURNING id,programme_id,venue_id,starts_at,ends_at,status`;
      created.push(rows[0]);
    }
    return Response.json({created});
  }catch(error){return Response.json({error:"Unable to auto-schedule programmes"},{status:500});}
}
