import {getDb} from "./db";
import {parseUserToken} from "./auth";

const perms={
  admin:new Set(["*"]),
  organizer:new Set(["read","manage"]),
  judge:new Set(["read","judge"]),
  viewer:new Set(["read"])
};

function required(path,method,body){
  if(path.includes("/judge-scores")) return method==="GET"?"read":"judge";
  if(path.includes("/judge-assignments")) return method==="GET"?"read":"manage";
  if(path.includes("/results")) return method==="GET"?"read":"manage";
  if(path.includes("/result-corrections")) return "manage";
  if(path.includes("/programme-criteria")) return method==="GET"?"read":"manage";
  if(path==="/api/auth/accounts"||path==="/api/auth/event-roles") return "manage";
  return method==="GET"||method==="HEAD"?"read":"manage";
}

async function resolveEvent(request,body){
  const u=new URL(request.url),path=u.pathname;
  let eventId=u.searchParams.get("eventId")||body?.eventId;
  const programmeId=u.searchParams.get("programmeId")||body?.programmeId||body?.score?.programmeId;
  const id=u.searchParams.get("id")||body?.id||body?.resultId||body?.assignmentId||body?.certificateId;
  if(eventId)return eventId;
  const sql=getDb();
  if(programmeId){
    const r=await sql`SELECT event_id FROM programmes WHERE id=${programmeId} LIMIT 1`;
    if(r[0])return r[0].event_id;
  }
  if(id){
    const queries=[];
    if(path==="/api/events") queries.push(sql`SELECT id AS event_id FROM events WHERE id=${id} LIMIT 1`);
    if(path.includes("/results")||path.includes("/result-corrections")) queries.push(sql`SELECT p.event_id FROM results r JOIN programmes p ON p.id=r.programme_id WHERE r.id=${id} LIMIT 1`);
    if(path.includes("/programmes")) queries.push(sql`SELECT event_id FROM programmes WHERE id=${id} LIMIT 1`);
    if(path.includes("/participants")) queries.push(sql`SELECT event_id FROM participants WHERE id=${id} LIMIT 1`);
    if(path.includes("/teams")) queries.push(sql`SELECT event_id FROM teams WHERE id=${id} LIMIT 1`);
    if(path.includes("/venues")) queries.push(sql`SELECT event_id FROM venues WHERE id=${id} LIMIT 1`);
    if(path.includes("/schedules")) queries.push(sql`SELECT p.event_id FROM schedules s JOIN programmes p ON p.id=s.programme_id WHERE s.id=${id} LIMIT 1`);
    if(path.includes("/registrations")) queries.push(sql`SELECT event_id FROM registrations WHERE id=${id} LIMIT 1`);
    if(path.includes("/judge-assignments")) queries.push(sql`SELECT event_id FROM judge_assignments WHERE id=${id} LIMIT 1`);
    if(path.includes("/judge-scores")) queries.push(sql`SELECT event_id FROM judge_scores WHERE id=${id} LIMIT 1`);
    if(path.includes("/certificates")) queries.push(sql`SELECT event_id FROM certificates WHERE id=${id} LIMIT 1`);
    if(path.includes("/id-cards")) queries.push(sql`SELECT event_id FROM id_cards WHERE id=${id} LIMIT 1`);
    if(path.includes("/announcements")) queries.push(sql`SELECT event_id FROM announcements WHERE id=${id} LIMIT 1`);
    if(path.includes("/downloads")) queries.push(sql`SELECT event_id FROM downloads WHERE id=${id} LIMIT 1`);
    if(path.includes("/media")) queries.push(sql`SELECT event_id FROM media_assets WHERE id=${id} LIMIT 1`);
    for(const q of queries){const r=await q;if(r[0])return r[0].event_id}
  }
  return null;
}

export async function authorizeRequest(request){
  const user=await parseUserToken(request.cookies.get("eventra_session")?.value,process.env.EVENTRA_ADMIN_PASSWORD);
  if(!user)return{ok:false,status:401,error:"Authentication required"};
  const path=new URL(request.url).pathname;
  if(path==="/api/auth/logout")return{ok:true,user};
  const body=["POST","PATCH","PUT","DELETE"].includes(request.method)?await request.clone().json().catch(()=>({})): {};
  if(user.globalRole==="admin")return{ok:true,user,role:"admin"};

  const eventId=await resolveEvent(request,body);
  if(!eventId)return{ok:false,status:400,error:"Event context is required"};
  const rows=await getDb().unsafe(
    "SELECT role FROM event_roles WHERE event_id=$1 AND lower(email)=lower($2) AND active=true LIMIT 1",
    [eventId,user.email]
  );
  const role=rows[0]?.role;
  if(!role||!perms[role])return{ok:false,status:403,error:"You are not assigned to this event"};

  const need=required(path,request.method,body);
  const allowed=perms[role].has("*")||perms[role].has(need)||(need==="read"&&perms[role].has("manage"));
  if(!allowed)return{ok:false,status:403,error:"Insufficient permission for this operation"};

  if(path.includes("/results")&&request.method!=="GET"&&role!=="organizer")
    return{ok:false,status:403,error:"Only an organizer or admin can manage results"};

  if(path.includes("/result-corrections")&&role!=="organizer")
    return{ok:false,status:403,error:"Only an organizer or admin can correct results"};

  if(path.includes("/judge-assignments")&&role!=="organizer")
    return{ok:false,status:403,error:"Only an organizer or admin can manage judge assignments"};

  if(role==="judge"&&(path.includes("/programme-criteria")||path.includes("/programmes"))){
    const programmeId=new URL(request.url).searchParams.get("programmeId")||body?.programmeId||body?.id;
    if(programmeId){
      const a=await getDb().unsafe("SELECT id FROM judge_assignments WHERE event_id=$1 AND programme_id=$2 AND lower(email)=lower($3) AND active=true LIMIT 1",[eventId,programmeId,user.email]);
      if(!a[0])return{ok:false,status:403,error:"You are not assigned to this programme"};
    }
  }

  if(path.includes("/judge-scores")&&role==="judge"){
    const judgeEmail=body?.judgeEmail||new URL(request.url).searchParams.get("judgeEmail");
    if(judgeEmail&&judgeEmail.toLowerCase()!==user.email.toLowerCase())
      return{ok:false,status:403,error:"Judge identity does not match signed-in account"};
    const programmeId=new URL(request.url).searchParams.get("programmeId")||body?.programmeId||body?.score?.programmeId;
    if(programmeId){
      const a=await getDb().unsafe(
        "SELECT id FROM judge_assignments WHERE event_id=$1 AND programme_id=$2 AND lower(email)=lower($3) AND active=true LIMIT 1",
        [eventId,programmeId,user.email]
      );
      if(!a[0])return{ok:false,status:403,error:"You are not assigned to this programme"};
    }
  }
  return{ok:true,user,role,eventId};
}
