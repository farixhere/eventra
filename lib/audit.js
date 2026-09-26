import {getDb} from "./db";

export async function auditLog(request,{action,eventId=null,entityType=null,entityId=null,changes=null,reason=null}={}){
 try{
  const sql=getDb();
  const {parseUserToken}=await import("./auth");
  const user=await parseUserToken(request?.cookies?.get("eventra_session")?.value);
  const meta={actorEmail:user?.email||null,reason:reason||null,requestId:request?.headers?.get("x-request-id")||null,ip:request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim()||null};
  const payload=changes==null?{_meta:meta}:{...safeChanges(changes),_meta:meta};
  await sql`INSERT INTO audit_logs(event_id,action,entity_type,entity_id,changes) VALUES(${eventId||null},${action},${entityType},${entityId||null},${JSON.stringify(payload)}::jsonb)`;
 }catch(error){console.error("audit_log_failed",error?.message||error)}
}

const SENSITIVE=new Set(["password","passwordHash","password_hash","token","accessToken","secret","apiKey","api_key","authorization","cookie","session"]);

export function safeChanges(value){
 if(value==null)return null;
 if(Array.isArray(value))return value.map(safeChanges);
 if(typeof value!=="object")return value;
 const out={};
 for(const [key,val] of Object.entries(value)){
  if(SENSITIVE.has(key))continue;
  out[key]=safeChanges(val);
 }
 return out;
}
