import { getDb } from "../../../lib/db";
const required=["events","programmes","participants","teams","schedules","registrations","event_roles","judge_assignments","programme_criteria","judge_scores","results","result_corrections","certificates","certificate_verifications","audit_logs","users","user_roles","roles","sessions","eventra_rate_limits"];
export async function GET(){
 try{
  const sql=getDb();
  const r=await sql`SELECT now() AS database_time,(SELECT COUNT(*)::int FROM events) AS events,(SELECT COUNT(*)::int FROM programmes) AS programmes,(SELECT COUNT(*)::int FROM results) AS results,(SELECT COUNT(*)::int FROM users) AS users`;
  const tables=await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=ANY(${required})`;
  const present=new Set(tables.map(x=>x.table_name));
  const missing=required.filter(x=>!present.has(x));
  const cols=await sql`SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND ((table_name='events' AND column_name IN ('timezone','settings','registration_settings')) OR (table_name='results' AND column_name IN ('verification_status','verified_at','verified_by','score_breakdown','published_by','corrected_at')) OR (table_name='audit_logs' AND column_name IN ('actor_user_id','reason','request_id','ip_address')))`;
  const signatures={
   migration005:present.has("event_roles")&&present.has("judge_assignments")&&present.has("certificate_verifications"),
   migration006:present.has("users")&&present.has("roles")&&present.has("permissions")&&present.has("sessions"),
   migration007:present.has("programme_criteria")&&present.has("judge_scores")&&present.has("result_corrections")&&present.has("api_keys"),
   migration008:present.has("eventra_rate_limits")&&present.has("sessions")
  };
  return Response.json({ok:missing.length===0,database:"connected",...r[0],schema:{missingTables:missing,migrations:signatures,columnChecks:cols,checkedAt:new Date().toISOString()}},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return Response.json({ok:false,error:"Database health check failed"},{status:503,headers:{"Cache-Control":"no-store"}})}
}
