import {getDb} from "./db";

export async function auditLog(request,{action,eventId=null,entityType=null,entityId=null,changes=null,reason=null}={}){
 try{
  const sql=getDb();
  const {parseUserToken}=await import("./auth");
  const user=await parseUserToken(request?.cookies?.get("eventra_session")?.value,process.env.EVENTRA_ADMIN_PASSWORD);
  const meta={actorEmail:user?.email||null,reason:reason||null,requestId:request?.headers?.get("x-request-id")||null,ip:request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim()||null};
  const payload=changes==null?{_meta:meta}:{...safeChanges(changes),_meta:meta};
  await sql`INSERT INTO audit_logs(event_id,action,entity_type,entity_id,changes) VALUES(${eventId||null},${action},${entityType},${entityId||null},${JSON.stringify(payload)}::jsonb)`;
 }catch(error){console.error("audit_log_failed",error?.message||error)}
}

export function safeChanges(value){
 if(value==null)return null;
 const copy=JSON.parse(JSON.stringify(value));
 for(const key of ["password","passwordHash","password_hash","token","accessToken","secret","apiKey","api_key"])delete copy[key];
 return copy;
}
