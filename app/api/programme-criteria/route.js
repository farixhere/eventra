import { getDb } from "../../../lib/db";
import { auditLog } from "../../../lib/audit";

export async function GET(request){
  try{
    const programmeId=new URL(request.url).searchParams.get("programmeId");
    if(!programmeId) return Response.json({error:"programmeId is required"},{status:400});
    const sql=getDb();
    const rows=await sql`SELECT c.*,p.name AS programme_name FROM programme_criteria c JOIN programmes p ON p.id=c.programme_id WHERE c.programme_id=${programmeId} ORDER BY c.sort_order,c.created_at`;
    return Response.json({criteria:rows});
  }catch(error){
    console.error("GET /api/programme-criteria failed",error);
    return Response.json({error:"Unable to load criteria"},{status:500});
  }
}

export async function POST(request){
  try{
    const body=await request.json();
    if(!body.programmeId||!body.name) return Response.json({error:"programmeId and name are required"},{status:400});
    const sql=getDb();
    const programme=await sql`SELECT id FROM programmes WHERE id=${body.programmeId} LIMIT 1`;
    if(!programme.length) return Response.json({error:"Programme not found"},{status:404});
    const maxScore=Number(body.maxScore??10),weight=Number(body.weight??1),sortOrder=Number(body.sortOrder??0);
    if(!Number.isFinite(maxScore)||maxScore<=0||!Number.isFinite(weight)||weight<=0||!Number.isInteger(sortOrder)||sortOrder<0) return Response.json({error:"Invalid criteria values"},{status:400});
    const rows=await sql`INSERT INTO programme_criteria(programme_id,name,description,max_score,weight,sort_order,active) VALUES(${body.programmeId},${body.name},${body.description||null},${maxScore},${weight},${sortOrder},${body.active!==false}) RETURNING *`;
    const event=(await sql`SELECT event_id FROM programmes WHERE id=${body.programmeId}`)[0];
    await auditLog(request,{action:"programme.criteria.created",eventId:event?.event_id||null,entityType:"programme_criteria",entityId:rows[0].id,changes:{programmeId:body.programmeId,name:body.name,maxScore,weight}});
    return Response.json({criteria:rows[0]},{status:201});
  }catch(error){
    console.error("POST /api/programme-criteria failed",error);
    return Response.json({error:"Unable to save criteria"},{status:500});
  }
}
