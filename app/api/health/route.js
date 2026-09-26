import { getDb } from "../../../lib/db";
export async function GET(){
  try{
    const sql=getDb();
    const r=await sql`SELECT now() AS database_time, (SELECT COUNT(*)::int FROM events) AS events, (SELECT COUNT(*)::int FROM programmes) AS programmes, (SELECT COUNT(*)::int FROM results) AS results`;
    return Response.json({ok:true,database:"connected",...r[0],checkedAt:new Date().toISOString()});
  }catch(e){return Response.json({ok:false,error:"Database health check failed"},{status:503})}
}