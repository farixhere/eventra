import { getDb } from "../../../lib/db";

export async function GET(request){
  try{
    const eventId=new URL(request.url).searchParams.get("eventId");
    const programmeId=new URL(request.url).searchParams.get("programmeId");
    if(!programmeId) return Response.json({error:"programmeId is required"},{status:400});
    const rows=await getDb()`SELECT c.*,p.name AS programme_name FROM programme_criteria c JOIN programmes p ON p.id=c.programme_id WHERE c.programme_id=${programmeId} ORDER BY c.sort_order,c.created_at`;
    return Response.json({criteria:rows});
  }catch(error){return Response.json({error:"Unable to load criteria"},{status:500});}
}

export async function POST(request){
  try{
    const body=await request.json();
    if(!body.programmeId||!body.name) return Response.json({error:"programmeId and name are required"},{status:400});
    const sql=getDb();
    const programme=await sql`SELECT id FROM programmes WHERE id=${body.programmeId} LIMIT 1`;
    if(!programme.length) return Response.json({error:"Programme not found"},{status:404});
    const rows=await sql`INSERT INTO programme_criteria(programme_id,name,description,max_score,weight,sort_order,active) VALUES(${body.programmeId},${body.name},${body.description||null},${Number(body.maxScore??10)},${Number(body.weight??1)},${Number(body.sortOrder??0)},${body.active!==false}) RETURNING *`;
    return Response.json({criteria:rows[0]},{status:201});
  }catch(error){return Response.json({error:"Unable to save criteria"},{status:500});}
}