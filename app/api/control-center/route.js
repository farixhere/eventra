import { getDb } from "../../../lib/db";
import { createHash, randomBytes } from "crypto";

const json = (o,s=200)=>Response.json(o,{status:s});
function parseJson(v,f={}){try{return typeof v==="string"?JSON.parse(v):v||f}catch{return f}}
async function audit(sql,eventId,action,entityType,entityId=null,changes=null){
  try{await sql`INSERT INTO audit_logs(event_id,action,entity_type,entity_id,changes) VALUES(${eventId},${action},${entityType},${entityId},${changes?JSON.stringify(changes):null}::jsonb)`}catch{}
}

export async function GET(request){
  try{
    const eventId=new URL(request.url).searchParams.get("eventId"); if(!eventId)return json({error:"eventId is required"},400);
    const sql=getDb();
    const [programmes,criteria,assignments,scores,results,roles,appeals,substitutions,venues,availability,liveUpdates,notifications,settings,apiKeys,audit,leaderboard,certificates,idcards,event]=await Promise.all([
      sql`SELECT id,name,type,category FROM programmes WHERE event_id=${eventId} ORDER BY name`,
      sql`SELECT c.*,p.name AS programme_name FROM programme_criteria c JOIN programmes p ON p.id=c.programme_id WHERE p.event_id=${eventId} ORDER BY p.name,c.sort_order`,
      sql`SELECT ja.*,p.name AS programme_name FROM judge_assignments ja JOIN programmes p ON p.id=ja.programme_id WHERE ja.event_id=${eventId} ORDER BY p.name,ja.email`,
      sql`SELECT js.*,p.name AS programme_name,COALESCE(part.name,t.name) AS entry_name FROM judge_scores js JOIN programmes p ON p.id=js.programme_id LEFT JOIN participants part ON part.id=js.participant_id LEFT JOIN teams t ON t.id=js.team_id WHERE js.event_id=${eventId} ORDER BY js.created_at DESC LIMIT 100`,
      sql`SELECT r.*,p.name AS programme_name,COALESCE(part.name,t.name) AS entry_name FROM results r JOIN programmes p ON p.id=r.programme_id LEFT JOIN participants part ON part.id=r.participant_id LEFT JOIN teams t ON t.id=r.team_id WHERE p.event_id=${eventId} ORDER BY r.published DESC,r.position NULLS LAST`,
      sql`SELECT * FROM event_roles WHERE event_id=${eventId} ORDER BY role,email`,
      sql`SELECT a.*,p.name AS participant_name,t.name AS team_name FROM appeals a LEFT JOIN participants p ON p.id=a.participant_id LEFT JOIN teams t ON t.id=a.team_id WHERE a.event_id=${eventId} ORDER BY a.created_at DESC`,
      sql`SELECT s.*,p.name AS programme_name,o.name AS original_name,r.name AS replacement_name FROM substitutions s LEFT JOIN programmes p ON p.id=s.programme_id LEFT JOIN participants o ON o.id=s.original_participant_id LEFT JOIN participants r ON r.id=s.replacement_participant_id WHERE s.event_id=${eventId} ORDER BY s.created_at DESC`,
      sql`SELECT id,name FROM venues WHERE event_id=${eventId} ORDER BY name`,
      sql`SELECT va.*,v.name AS venue_name FROM venues_availability va JOIN venues v ON v.id=va.venue_id WHERE va.event_id=${eventId} ORDER BY va.starts_at DESC LIMIT 100`,
      sql`SELECT * FROM live_updates WHERE event_id=${eventId} ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT * FROM notifications WHERE event_id=${eventId} ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT * FROM festival_settings WHERE event_id=${eventId} LIMIT 1`,
      sql`SELECT id,name,last_used_at,expires_at,active,created_at FROM api_keys WHERE event_id=${eventId} ORDER BY created_at DESC`,
      sql`SELECT * FROM audit_logs WHERE event_id=${eventId} ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT t.id,t.name,COALESCE(SUM(CASE WHEN r.published THEN COALESCE(r.points,0) ELSE 0 END),0) AS points FROM teams t LEFT JOIN results r ON r.team_id=t.id WHERE t.event_id=${eventId} GROUP BY t.id,t.name ORDER BY points DESC,t.name`,
      sql`SELECT COUNT(*)::int AS count FROM certificates WHERE event_id=${eventId}`,
      sql`SELECT COUNT(*)::int AS count FROM id_cards WHERE event_id=${eventId}`,
      sql`SELECT id,slug,name FROM events WHERE id=${eventId} LIMIT 1`
    ]);
    const participants=await sql`SELECT id,name,participant_code FROM participants WHERE event_id=${eventId} ORDER BY name`;
    const teams=await sql`SELECT id,name FROM teams WHERE event_id=${eventId} ORDER BY name`;
    return json({eventSlug:event[0]?.slug,programmes,criteria,assignments,scores,results,roles,appeals,substitutions,venues,availability,liveUpdates,notifications,settings:settings[0]||null,apiKeys,audit,leaderboard,participants,teams,certificateCount:certificates[0]?.count||0,idCardCount:idcards[0]?.count||0});
  }catch(e){console.error(e);return json({error:"Unable to load control center"},500)}
}

export async function POST(request){
  try{
    const b=await request.json(), sql=getDb(), {eventId,action}=b;
    if(!eventId||!action)return json({error:"eventId and action are required"},400);
    if(action==="criteria.add"){
      const c=b.criterion||{}; if(!b.programmeId||!c.name)return json({error:"Programme and criterion name are required"},400);
      const max=Number(c.maxScore||10),weight=Number(c.weight||1);
      if(!(max>0&&weight>0))return json({error:"Invalid criterion values"},400);
      const r=await sql`INSERT INTO programme_criteria(programme_id,name,description,max_score,weight,sort_order,active) SELECT ${b.programmeId},${c.name},${c.description||null},${max},${weight},COALESCE(MAX(sort_order),-1)+1,true FROM programme_criteria WHERE programme_id=${b.programmeId} RETURNING *`;
      await audit(sql,eventId,"criteria.created","programme_criteria",r[0].id,c); return json({message:"Criterion added"});
    }
    if(action==="criteria.delete"){await sql`UPDATE programme_criteria SET active=false WHERE id=${b.id}`;await audit(sql,eventId,"criteria.disabled","programme_criteria",b.id);return json({message:"Criterion disabled"})}
    if(action==="judge.assign"){if(!b.programmeId||!b.email)return json({error:"Programme and email are required"},400);const r=await sql`INSERT INTO judge_assignments(event_id,programme_id,email,criteria,active) VALUES(${eventId},${b.programmeId},LOWER(TRIM(${b.email})), '[]'::jsonb,true) ON CONFLICT(programme_id,email) DO UPDATE SET active=true RETURNING id`;await audit(sql,eventId,"judge.assigned","judge_assignments",r[0]?.id,{email:b.email});return json({message:"Judge assigned"})}
    if(action==="judge.delete"){await sql`DELETE FROM judge_assignments WHERE id=${b.id}`;await audit(sql,eventId,"judge.removed","judge_assignments",b.id);return json({message:"Judge removed"})}
    if(action==="score.submit"){
      const s=b.score||{},p=await sql`SELECT id,type FROM programmes WHERE id=${s.programmeId} AND event_id=${eventId}`;if(!p[0])return json({error:"Programme not found"},404);
      const cs=await sql`SELECT id,max_score,weight FROM programme_criteria WHERE programme_id=${s.programmeId} AND active=true ORDER BY sort_order`;if(!cs.length)return json({error:"No active criteria"},400);
      let total=0;for(const c of cs){const v=Number(s.criteria?.[c.id]);if(!Number.isFinite(v)||v<0||v>Number(c.max_score))return json({error:"Invalid score for "+c.id},400);total+=v*Number(c.weight||1)}
      if(p[0].type==="team"&&!s.teamId)return json({error:"Team is required"},400);if(p[0].type!=="team"&&!s.participantId)return json({error:"Participant is required"},400);
      const r=await sql`INSERT INTO judge_scores(event_id,programme_id,participant_id,team_id,judge_email,criteria_scores,total_score,status,submitted_at) VALUES(${eventId},${s.programmeId},${s.participantId||null},${s.teamId||null},LOWER(TRIM(${s.judgeEmail||"admin"})),${JSON.stringify(s.criteria||{})}::jsonb,${total},'submitted',now()) RETURNING id`;
      await audit(sql,eventId,"score.submitted","judge_scores",r[0].id,{total});return json({message:"Score submitted",total});
    }
    if(action==="results.aggregate"){
      if(!b.programmeId)return json({error:"Programme is required"},400);
      const grouped=await sql`SELECT COALESCE(participant_id::text,team_id::text) AS entry_key,MAX(participant_id) AS participant_id,MAX(team_id) AS team_id,ROUND(AVG(total_score),2) AS total_score,COUNT(*)::int AS judges FROM judge_scores WHERE event_id=${eventId} AND programme_id=${b.programmeId} AND status='submitted' GROUP BY COALESCE(participant_id::text,team_id::text) ORDER BY AVG(total_score) DESC`;
      let pos=1;for(const g of grouped){const old=await sql`SELECT id FROM results WHERE programme_id=${b.programmeId} AND COALESCE(participant_id::text,'')=COALESCE(${g.participant_id}::text,'') AND COALESCE(team_id::text,'')=COALESCE(${g.team_id}::text,'')`;if(old[0])await sql`UPDATE results SET total_score=${g.total_score},score_breakdown=${JSON.stringify({judges:g.judges})}::jsonb,judge_scores=(SELECT COALESCE(jsonb_agg(js), '[]'::jsonb) FROM judge_scores js WHERE js.programme_id=${b.programmeId} AND (js.participant_id=${g.participant_id} OR js.team_id=${g.team_id})),position=${pos},verification_status='draft',published=false WHERE id=${old[0].id}`;else await sql`INSERT INTO results(programme_id,participant_id,team_id,position,total_score,points,published,verification_status,score_breakdown,judge_scores) VALUES(${b.programmeId},${g.participant_id},${g.team_id},${pos},${g.total_score},0,false,'draft',${JSON.stringify({judges:g.judges})}::jsonb,(SELECT COALESCE(jsonb_agg(js),'[]'::jsonb) FROM judge_scores js WHERE js.programme_id=${b.programmeId} AND (js.participant_id=${g.participant_id} OR js.team_id=${g.team_id})))`;pos++}
      await audit(sql,eventId,"results.aggregated","results",null,{programmeId:b.programmeId,count:grouped.length});return json({message:"Judge scores aggregated into draft results",count:grouped.length});
    }
    if(action==="results.manual"){const r=b.result||{};if(!r.programmeId)return json({error:"Programme required"},400);const rows=await sql`INSERT INTO results(programme_id,participant_id,team_id,position,total_score,points,published,verification_status) VALUES(${r.programmeId},${r.participantId||null},${r.teamId||null},${Number(r.position||1)},${r.totalScore===""?null:Number(r.totalScore||0)},${Number(r.points||0)},false,'draft') RETURNING id`;await audit(sql,eventId,"result.created","results",rows[0].id,r);return json({message:"Draft result created"})}
    if(action==="results.verify"){const r=await sql`UPDATE results SET verification_status='verified',verified_at=now(),verified_by=${b.verifiedBy||"admin"} WHERE id=${b.id} RETURNING id`;if(!r[0])return json({error:"Result not found"},404);await audit(sql,eventId,"result.verified","results",b.id);return json({message:"Result verified"})}
    if(action==="results.publish"){const r=await sql`UPDATE results SET published=true,published_at=COALESCE(published_at,now()),published_by=${b.publishedBy||"admin"},verification_status=CASE WHEN verification_status='draft' THEN 'verified' ELSE verification_status END WHERE id=${b.id} RETURNING id`;if(!r[0])return json({error:"Result not found"},404);await audit(sql,eventId,"result.published","results",b.id);return json({message:"Result published to the public site"})}
    if(action==="role.save"){if(!b.email||!b.role)return json({error:"Email and role required"},400);const r=await sql`INSERT INTO event_roles(event_id,email,role,active) VALUES(${eventId},LOWER(TRIM(${b.email})),${b.role},true) ON CONFLICT(event_id,email) DO UPDATE SET role=EXCLUDED.role,active=true RETURNING id`;await audit(sql,eventId,"role.assigned","event_roles",r[0].id,{email:b.email,role:b.role});return json({message:"Event role saved"})}
    if(action==="role.delete"){await sql`DELETE FROM event_roles WHERE id=${b.id}`;return json({message:"Event role removed"})}
    if(action==="appeal.add"){const a=b.appeal||{};if(!a.submittedBy||!a.reason)return json({error:"Submitter and reason required"},400);const r=await sql`INSERT INTO appeals(event_id,submitted_by,reason,result_id,status) VALUES(${eventId},${a.submittedBy},${a.reason},${a.resultId||null},'submitted') RETURNING id`;await audit(sql,eventId,"appeal.submitted","appeals",r[0].id);return json({message:"Appeal submitted"})}
    if(action==="appeal.update"){const r=await sql`UPDATE appeals SET status=${b.status||"resolved"},response=${b.response||null},decided_by=${b.resolvedBy||"admin"},decided_at=now(),resolved_at=now() WHERE id=${b.id} RETURNING id`;if(!r[0])return json({error:"Appeal not found"},404);await audit(sql,eventId,"appeal.resolved","appeals",b.id);return json({message:"Appeal resolved"})}
    if(action==="substitution.add"){const s=b.sub||{};if(!s.originalParticipantId||!s.replacementParticipantId||!s.reason)return json({error:"Participants and reason required"},400);const r=await sql`INSERT INTO substitutions(event_id,programme_id,original_participant_id,replacement_participant_id,reason,status) VALUES(${eventId},${s.programmeId||null},${s.originalParticipantId},${s.replacementParticipantId},${s.reason},'pending') RETURNING id`;await audit(sql,eventId,"substitution.submitted","substitutions",r[0].id);return json({message:"Substitution request created"})}
    if(action==="substitution.update"){const r=await sql`UPDATE substitutions SET status=${b.status||"approved"},approved_by=${b.approvedBy||"admin"} WHERE id=${b.id} RETURNING id`;if(!r[0])return json({error:"Substitution not found"},404);await audit(sql,eventId,"substitution.updated","substitutions",b.id);return json({message:"Substitution updated"})}
    if(action==="venue.add"){if(!b.venue)return json({error:"No venue available"},400);await sql`INSERT INTO venues_availability(event_id,venue_id,starts_at,ends_at,status,notes) VALUES(${eventId},${b.venue},${b.startsAt},${b.endsAt},'available',${b.notes||null})`;return json({message:"Venue availability saved"})}
    if(action==="live.add"){const u=b.update||{};if(!u.title)return json({error:"Title required"},400);const r=await sql`INSERT INTO live_updates(event_id,title,message,update_type) VALUES(${eventId},${u.title},${u.message||null},${u.updateType||"announcement"}) RETURNING id`;await audit(sql,eventId,"live_update.published","live_updates",r[0].id);return json({message:"Live update published"})}
    if(action==="notification.add"){const n=b.notification||{};if(!n.title||!n.body)return json({error:"Title and body required"},400);await sql`INSERT INTO notifications(event_id,recipient_email,title,body,type) VALUES(${eventId},${n.recipientEmail||null},${n.title},${n.body},'info')`;return json({message:"Notification created"})}
    if(action==="settings.save"){const s=b.settings||{};const branding=parseJson(s.branding),navigation=parseJson(s.navigation),contact=parseJson(s.contact),social=parseJson(s.socialLinks);await sql`INSERT INTO festival_settings(event_id,public_slug,branding,navigation,contact,social_links,updated_at) VALUES(${eventId},${s.publicSlug||null},${JSON.stringify(branding)}::jsonb,${JSON.stringify(navigation)}::jsonb,${JSON.stringify(contact)}::jsonb,${JSON.stringify(social)}::jsonb,now()) ON CONFLICT(event_id) DO UPDATE SET public_slug=EXCLUDED.public_slug,branding=EXCLUDED.branding,navigation=EXCLUDED.navigation,contact=EXCLUDED.contact,social_links=EXCLUDED.social_links,updated_at=now()`;return json({message:"Website settings saved"})}
    if(action==="apikey.create"){const k=b.apiKey||{};if(!k.name)return json({error:"Key name required"},400);const raw="evt_"+randomBytes(24).toString("hex");const hash=createHash("sha256").update(raw).digest("hex");const r=await sql`INSERT INTO api_keys(event_id,name,key_hash,expires_at) VALUES(${eventId},${k.name},${hash},${k.expiresAt||null}) RETURNING id`;await audit(sql,eventId,"api_key.created","api_keys",r[0].id);return json({message:"API key created. Copy it now.",apiKey:raw})}
    if(action==="apikey.revoke"){await sql`UPDATE api_keys SET active=false WHERE id=${b.id} AND event_id=${eventId}`;return json({message:"API key revoked"})}
    if(action==="documents.certificates"){const rows=await sql`SELECT r.id,r.participant_id,r.team_id,p.name AS participant_name,t.name AS team_name,pr.name AS programme_name FROM results r JOIN programmes pr ON pr.id=r.programme_id LEFT JOIN participants p ON p.id=r.participant_id LEFT JOIN teams t ON t.id=r.team_id WHERE pr.event_id=${eventId} AND r.published=true AND NOT EXISTS(SELECT 1 FROM certificates c WHERE c.result_id=r.id)`;let n=0;for(const r of rows){const num="EVT-"+Date.now().toString(36).toUpperCase()+"-"+randomBytes(3).toString("hex").toUpperCase();await sql`INSERT INTO certificates(event_id,result_id,participant_id,team_id,title,certificate_type,certificate_number) VALUES(${eventId},${r.id},${r.participant_id},${r.team_id},${r.programme_name||"Festival Result"},'achievement',${num})`;n++}return json({message:n+" certificate records generated"})}
    if(action==="documents.idcards"){const rows=await sql`SELECT p.id FROM participants p WHERE p.event_id=${eventId} AND NOT EXISTS(SELECT 1 FROM id_cards c WHERE c.participant_id=p.id)`;let n=0;for(const r of rows){const num="CARD-"+Date.now().toString(36).toUpperCase()+"-"+randomBytes(2).toString("hex").toUpperCase();await sql`INSERT INTO id_cards(event_id,participant_id,card_number) VALUES(${eventId},${r.id},${num})`;n++}return json({message:n+" ID card records generated"})}
    return json({error:"Unknown action"},400)
  }catch(e){console.error("control-center",e);return json({error:e.message||"Control center action failed"},500)}
}
