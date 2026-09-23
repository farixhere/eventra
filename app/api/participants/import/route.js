import { getDb } from "../../../lib/db";

export async function POST(request){
  try{
    const body=await request.json();
    if(!body.eventId || !body.csv?.trim()) return Response.json({error:"eventId and csv are required"},{status:400});
    const lines=body.csv.trim().split(/\r?\n/).filter(Boolean);
    const header=lines.shift().split(",").map(x=>x.trim().toLowerCase());
    const index=(name)=>header.indexOf(name);
    const sql=getDb();
    const created=[]; const skipped=[];
    for(const line of lines){
      const cols=line.split(",").map(x=>x.trim());
      const name=cols[index("name")>=0?index("name"):0];
      if(!name){skipped.push(line);continue;}
      const email=cols[index("email")>=0?index("email"):1]||null;
      const phone=cols[index("phone")>=0?index("phone"):2]||null;
      const code=cols[index("participant_code")>=0?index("participant_code"):3]||null;
      if(code){
        const duplicate=await sql`SELECT id FROM participants WHERE event_id=${body.eventId} AND participant_code=${code}`;
        if(duplicate.length){skipped.push(name);continue;}
      }
      const rows=await sql`INSERT INTO participants(event_id,name,email,phone,participant_code) VALUES(${body.eventId},${name},${email},${phone},${code}) RETURNING id,name,email,phone,participant_code`;
      created.push(rows[0]);
    }
    return Response.json({created,skipped});
  }catch(error){return Response.json({error:"Unable to import participants"},{status:500});}
}
