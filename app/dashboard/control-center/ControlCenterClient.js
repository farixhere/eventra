"use client";

import { useEffect, useMemo, useState } from "react";

const tabs = [
  ["judging","1 · Judging"],["results","2–4 · Results"],["access","5 · Access"],
  ["operations","6 · Operations"],["live","7 · Live"],["website","8 · Website"],
  ["documents","9 · Documents"],["management","10 · Management"],["qa","11 · QA"]
];

export default function ControlCenterClient(){
  const [events,setEvents]=useState([]),[eventId,setEventId]=useState(""),[tab,setTab]=useState("judging");
  const [data,setData]=useState({}),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
  const [programmeId,setProgrammeId]=useState(""),[criteria,setCriteria]=useState([]);
  const [criterion,setCriterion]=useState({name:"",description:"",maxScore:"10",weight:"1"});
  const [judge,setJudge]=useState({email:"",programmeId:""});
  const [score,setScore]=useState({programmeId:"",judgeEmail:"",participantId:"",teamId:"",criteria:{}});
  const [result,setResult]=useState({programmeId:"",participantId:"",teamId:"",position:"1",points:"",totalScore:""});
  const [appeal,setAppeal]=useState({submittedBy:"",reason:"",resultId:""});
  const [sub,setSub]=useState({programmeId:"",originalParticipantId:"",replacementParticipantId:"",reason:""});
  const [live,setLive]=useState({title:"",message:"",updateType:"announcement"});
  const [setting,setSetting]=useState({publicSlug:"",branding:"{}",navigation:"{}",contact:"{}",socialLinks:"{}"});
  const [apiKey,setApiKey]=useState({name:"",expiresAt:""});
  const [qa,setQa]=useState([]);

  async function call(url,opts={}){
    const r=await fetch(url,{cache:"no-store",...opts});
    const d=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(d.error||"Request failed");
    return d;
  }
  async function loadEvents(){
    try{const d=await call("/api/events");setEvents(d.events||[]);if(!eventId&&d.events?.[0])setEventId(d.events[0].id);}
    catch(e){setError(e.message)}
  }
  async function load(){
    if(!eventId)return;
    try{
      setBusy(true);setError("");
      const d=await call("/api/control-center?eventId="+eventId);
      setData(d);
      if(programmeId) setCriteria((d.criteria||[]).filter(x=>x.programme_id===programmeId));
      else if(d.programmes?.[0]){setProgrammeId(d.programmes[0].id);setCriteria((d.criteria||[]).filter(x=>x.programme_id===d.programmes[0].id));}
    }catch(e){setError(e.message)}finally{setBusy(false)}
  }
  useEffect(()=>{loadEvents()},[]);
  useEffect(()=>{if(eventId)load()},[eventId]);
  useEffect(()=>{if(programmeId)setCriteria((data.criteria||[]).filter(x=>x.programme_id===programmeId))},[programmeId,data.criteria]);

  async function action(body){
    try{setBusy(true);setError("");setMessage("");const d=await call("/api/control-center",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId,...body})});setMessage(d.message||"Saved.");await load();return d}catch(e){setError(e.message)}finally{setBusy(false)}
  }

  const programmes=data.programmes||[], participants=data.participants||[], teams=data.teams||[];
  const selectedProgramme=programmes.find(p=>p.id===programmeId);
  const scoreCriteria=criteria;
  function updateScore(id,v){setScore(s=>({...s,criteria:{...s.criteria,[id]:v}}))}

  return <main style={{minHeight:"100vh",background:"#0b0b0b",color:"#f5f5f0",fontFamily:"Inter,system-ui,sans-serif",padding:"28px"}}>
    <div style={{maxWidth:1400,margin:"0 auto"}}>
      <header style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"end",borderBottom:"1px solid #2b2b2b",paddingBottom:20}}>
        <div><div style={{fontSize:12,letterSpacing:2,color:"#d7ff3f"}}>EVENTRA / CONTROL CENTER</div><h1 style={{fontSize:"clamp(30px,5vw,64px)",margin:"8px 0"}}>Finish the festival.</h1><p style={{color:"#aaa",margin:0}}>One operational surface for judging, publishing, permissions, documents and production checks.</p></div>
        <div><select value={eventId} onChange={e=>setEventId(e.target.value)} style={input}><option value="">Choose event</option>{events.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
      </header>
      <nav style={{display:"flex",gap:8,overflowX:"auto",padding:"16px 0"}}>{tabs.map(([id,label])=><button key={id} onClick={()=>setTab(id)} style={{...button,background:tab===id?"#d7ff3f":"#171717",color:tab===id?"#0b0b0b":"#eee"}}>{label}</button>)}</nav>
      {message&&<div style={notice}>{message}</div>}{error&&<div style={{...notice,borderColor:"#9b4444",color:"#ffb2b2"}}>{error}</div>}
      {!eventId?<Panel title="Choose an event"><p>Select an event above to operate it.</p></Panel>:
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(310px,1fr))",gap:16}}>

      {tab==="judging"&&<>
        <Panel title="Programme criteria" wide>
          <select value={programmeId} onChange={e=>setProgrammeId(e.target.value)} style={input}>{programmes.map(p=><option key={p.id} value={p.id}>{p.name} · {p.type}</option>)}</select>
          <div style={grid2}>{criteria.map(c=><div style={card} key={c.id}><b>{c.name}</b><span>{c.max_score} max · weight {c.weight}</span><button style={danger} onClick={()=>action({action:"criteria.delete",id:c.id})}>Delete</button></div>)}</div>
          <form onSubmit={e=>{e.preventDefault();action({action:"criteria.add",programmeId,criterion})}} style={form}>
            <input style={input} placeholder="Criterion name" value={criterion.name} onChange={e=>setCriterion({...criterion,name:e.target.value})} required/>
            <input style={input} placeholder="Description" value={criterion.description} onChange={e=>setCriterion({...criterion,description:e.target.value})}/>
            <input style={input} type="number" min="0.01" step=".01" placeholder="Max score" value={criterion.maxScore} onChange={e=>setCriterion({...criterion,maxScore:e.target.value})}/>
            <input style={input} type="number" min="0.01" step=".01" placeholder="Weight" value={criterion.weight} onChange={e=>setCriterion({...criterion,weight:e.target.value})}/>
            <button style={primary} disabled={busy}>Add criterion</button>
          </form>
        </Panel>
        <Panel title="Judge assignments">
          <form onSubmit={e=>{e.preventDefault();action({action:"judge.assign",programmeId:judge.programmeId||programmeId,email:judge.email})}} style={form}>
            <select style={input} value={judge.programmeId||programmeId} onChange={e=>setJudge({...judge,programmeId:e.target.value})}>{programmes.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <input style={input} type="email" placeholder="judge@example.com" value={judge.email} onChange={e=>setJudge({...judge,email:e.target.value})} required/>
            <button style={primary}>Assign judge</button>
          </form>
          {(data.assignments||[]).map(a=><div style={row} key={a.id}><span><b>{a.email}</b><small>{a.programme_name}</small></span><button style={danger} onClick={()=>action({action:"judge.delete",id:a.id})}>Remove</button></div>)}
        </Panel>
        <Panel title="Judge score sheet" wide>
          <div style={grid2}>
            <select style={input} value={score.programmeId||programmeId} onChange={e=>{setScore({...score,programmeId:e.target.value,criteria:{}});setProgrammeId(e.target.value)}}>{programmes.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <input style={input} type="email" placeholder="Judge email" value={score.judgeEmail} onChange={e=>setScore({...score,judgeEmail:e.target.value})}/>
            {selectedProgramme?.type==="team"?<select style={input} value={score.teamId} onChange={e=>setScore({...score,teamId:e.target.value})}><option value="">Choose team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>:<select style={input} value={score.participantId} onChange={e=>setScore({...score,participantId:e.target.value})}><option value="">Choose participant</option>{participants.map(p=><option key={p.id} value={p.id}>{p.name} · {p.participant_code}</option>)}</select>}
          </div>
          {scoreCriteria.map(c=><label style={field} key={c.id}><span>{c.name} <small>max {c.max_score}</small></span><input style={input} type="number" min="0" max={c.max_score} step=".01" value={score.criteria[c.id]??""} onChange={e=>updateScore(c.id,e.target.value)} required/></label>)}
          <button style={primary} disabled={busy} onClick={()=>action({action:"score.submit",score:{...score,programmeId:score.programmeId||programmeId}})}>Submit score</button>
        </Panel>
      </>}

      {tab==="results"&&<>
        <Panel title="Aggregate judge scores" wide>
          <p>Convert submitted judge sheets into draft official results. The draft remains private until verification and publishing.</p>
          <select style={input} value={programmeId} onChange={e=>setProgrammeId(e.target.value)}>{programmes.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <button style={primary} onClick={()=>action({action:"results.aggregate",programmeId})}>Aggregate scores → draft result</button>
          <div style={grid2}>{(data.results||[]).map(r=><div style={card} key={r.id}><b>#{r.position} · {r.entry_name}</b><span>{r.programme_name} · score {r.total_score??"—"} · {r.points??0} pts</span><div><button style={button} onClick={()=>action({action:"results.verify",id:r.id,verifiedBy:"admin"})}>Verify</button><button style={primary} onClick={()=>action({action:"results.publish",id:r.id,publishedBy:"admin"})}>Publish</button></div></div>)}</div>
        </Panel>
        <Panel title="Manual correction">
          <form onSubmit={e=>{e.preventDefault();action({action:"results.manual",result})}} style={form}>
            <select style={input} value={result.programmeId} onChange={e=>setResult({...result,programmeId:e.target.value})}>{programmes.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <select style={input} value={result.participantId} onChange={e=>setResult({...result,participantId:e.target.value})}><option value="">Participant</option>{participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <input style={input} type="number" min="1" value={result.position} onChange={e=>setResult({...result,position:e.target.value})} placeholder="Position"/>
            <input style={input} type="number" min="0" step=".01" value={result.totalScore} onChange={e=>setResult({...result,totalScore:e.target.value})} placeholder="Score"/>
            <input style={input} type="number" min="0" step=".01" value={result.points} onChange={e=>setResult({...result,points:e.target.value})} placeholder="Points"/>
            <button style={primary}>Save draft result</button>
          </form>
        </Panel>
        <Panel title="Team leaderboard"><Leaderboard rows={data.leaderboard||[]}/></Panel>
        <Panel title="Published public surface"><p>{(data.results||[]).filter(r=>r.published).length} published results are visible to the public event pages.</p><a href={data.eventSlug?"/event/"+data.eventSlug+"/results":"#"} style={primaryLink}>Open public results ↗</a></Panel>
      </>}

      {tab==="access"&&<Panel title="Event roles & permissions" wide>
        <p>Assign operational roles at event level. The production auth gate remains server-side; these assignments are stored with the event and surfaced here for audit and management.</p>
        <RoleForm eventId={eventId} roles={data.roles||[]} onAction={action} programmes={programmes}/>
      </Panel>}

      {tab==="operations"&&<>
        <Panel title="Appeals"><form onSubmit={e=>{e.preventDefault();action({action:"appeal.add",appeal})}} style={form}><input style={input} placeholder="Submitted by" value={appeal.submittedBy} onChange={e=>setAppeal({...appeal,submittedBy:e.target.value})} required/><textarea style={input} placeholder="Reason" value={appeal.reason} onChange={e=>setAppeal({...appeal,reason:e.target.value})} required/><button style={primary}>Submit appeal</button></form>{(data.appeals||[]).map(a=><div style={row} key={a.id}><span><b>{a.submitted_by}</b><small>{a.reason} · {a.status}</small></span><button style={button} onClick={()=>action({action:"appeal.update",id:a.id,status:"resolved",response:"Reviewed by organiser",resolvedBy:"admin"})}>Resolve</button></div>)}</Panel>
        <Panel title="Substitutions"><form onSubmit={e=>{e.preventDefault();action({action:"substitution.add",sub})}} style={form}><select style={input} value={sub.originalParticipantId} onChange={e=>setSub({...sub,originalParticipantId:e.target.value})}><option value="">Original participant</option>{participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><select style={input} value={sub.replacementParticipantId} onChange={e=>setSub({...sub,replacementParticipantId:e.target.value})}><option value="">Replacement participant</option>{participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input style={input} placeholder="Reason" value={sub.reason} onChange={e=>setSub({...sub,reason:e.target.value})} required/><button style={primary}>Create substitution</button></form>{(data.substitutions||[]).map(s=><div style={row} key={s.id}><span><b>{s.original_name} → {s.replacement_name}</b><small>{s.reason} · {s.status}</small></span><button style={button} onClick={()=>action({action:"substitution.update",id:s.id,status:"approved",approvedBy:"admin"})}>Approve</button></div>)}</Panel>
        <Panel title="Venue availability"><form onSubmit={e=>{e.preventDefault();action({action:"venue.add",venue:data.venues?.[0]?.id,startsAt:new Date().toISOString(),endsAt:new Date(Date.now()+3600000).toISOString(),notes:"Available"})}} style={form}><select style={input}><option>{data.venues?.[0]?.name||"Add venues first"}</option></select><button style={primary}>Create one-hour availability slot</button></form><div>{(data.availability||[]).map(v=><div style={row} key={v.id}><span><b>{v.venue_name}</b><small>{new Date(v.starts_at).toLocaleString()} · {v.status}</small></span></div>)}</div></Panel>
      </>}

      {tab==="live"&&<>
        <Panel title="Live updates"><form onSubmit={e=>{e.preventDefault();action({action:"live.add",update:live})}} style={form}><input style={input} placeholder="Title" value={live.title} onChange={e=>setLive({...live,title:e.target.value})} required/><textarea style={input} placeholder="Live message" value={live.message} onChange={e=>setLive({...live,message:e.target.value})}/><button style={primary}>Publish live update</button></form>{(data.liveUpdates||[]).map(x=><div style={row} key={x.id}><span><b>{x.title}</b><small>{x.message}</small></span></div>)}</Panel>
        <Panel title="Notifications"><form onSubmit={e=>{e.preventDefault();action({action:"notification.add",notification:{title:live.title||"Eventra update",body:live.message||"New event update",recipientEmail:""}})}} style={form}><button style={primary}>Create broadcast notification</button></form>{(data.notifications||[]).map(x=><div style={row} key={x.id}><span><b>{x.title}</b><small>{x.body}</small></span></div>)}</Panel>
      </>}

      {tab==="website"&&<Panel title="Festival website settings" wide>
        <p>Public branding, navigation and contact configuration are stored separately from the event record so organisers can update the website without touching application code.</p>
        <form onSubmit={e=>{e.preventDefault();action({action:"settings.save",settings:setting})}} style={form}>
          <input style={input} placeholder="Public slug" value={setting.publicSlug} onChange={e=>setSetting({...setting,publicSlug:e.target.value})}/>
          <textarea style={input} placeholder='Branding JSON: {"primary":"#d7ff3f"}' value={setting.branding} onChange={e=>setSetting({...setting,branding:e.target.value})}/>
          <textarea style={input} placeholder='Navigation JSON: {"results":true}' value={setting.navigation} onChange={e=>setSetting({...setting,navigation:e.target.value})}/>
          <textarea style={input} placeholder='Contact JSON' value={setting.contact} onChange={e=>setSetting({...setting,contact:e.target.value})}/>
          <textarea style={input} placeholder='Social links JSON' value={setting.socialLinks} onChange={e=>setSetting({...setting,socialLinks:e.target.value})}/>
          <button style={primary}>Save website settings</button>
        </form>
      </Panel>}

      {tab==="documents"&&<>
        <Panel title="Document Studio" wide><p>Certificates and ID cards use the production document APIs with verification codes and unique numbers. Use the existing dashboard Document Studio for print/export, or generate records here.</p><div style={grid2}><button style={primary} onClick={()=>action({action:"documents.certificates"})}>Generate missing certificates from published results</button><button style={primary} onClick={()=>action({action:"documents.idcards"})}>Generate missing ID cards for all participants</button></div><div style={grid2}><b>Certificates: {data.certificateCount||0}</b><b>ID cards: {data.idCardCount||0}</b></div></Panel>
      </>}

      {tab==="management"&&<>
        <Panel title="API keys"><form onSubmit={e=>{e.preventDefault();action({action:"apikey.create",apiKey})}} style={form}><input style={input} placeholder="Key name" value={apiKey.name} onChange={e=>setApiKey({...apiKey,name:e.target.value})} required/><input style={input} type="date" value={apiKey.expiresAt} onChange={e=>setApiKey({...apiKey,expiresAt:e.target.value})}/><button style={primary}>Create API key</button></form>{(data.apiKeys||[]).map(k=><div style={row} key={k.id}><span><b>{k.name}</b><small>{k.active?"Active":"Revoked"} · {k.last_used_at||"never used"}</small></span><button style={danger} onClick={()=>action({action:"apikey.revoke",id:k.id})}>Revoke</button></div>)}</Panel>
        <Panel title="Analytics & audit"><Leaderboard rows={data.leaderboard||[]}/><div style={{marginTop:12}}>{(data.audit||[]).slice(0,12).map(a=><div style={row} key={a.id}><span><b>{a.action}</b><small>{a.entity_type||"system"} · {new Date(a.created_at).toLocaleString()}</small></span></div>)}</div></Panel>
      </>}

      {tab==="qa"&&<Panel title="Production QA — 11" wide><button style={primary} onClick={async()=>{setQa([]);for(const [name,url] of [["Events","/api/events"],["Programmes","/api/programmes?eventId="+eventId],["Results","/api/results?eventId="+eventId],["Leaderboard","/api/leaderboard?eventId="+eventId],["Analytics","/api/analytics?eventId="+eventId],["Appeals","/api/appeals?eventId="+eventId],["Substitutions","/api/substitutions?eventId="+eventId],["Certificates","/api/certificates?eventId="+eventId],["ID cards","/api/id-cards?eventId="+eventId]]){try{const r=await fetch(url,{cache:"no-store"});setQa(q=>[...q,{name,ok:r.ok,status:r.status}])}catch(e){setQa(q=>[...q,{name,ok:false,status:"error"}])}}}}>Run production smoke tests</button><div style={{marginTop:16}}>{qa.map(x=><div style={row} key={x.name}><span><b>{x.name}</b><small>HTTP {x.status}</small></span><strong style={{color:x.ok?"#d7ff3f":"#ff7777"}}>{x.ok?"PASS":"FAIL"}</strong></div>)}</div><p style={{color:"#aaa"}}>The final gate is green only when build, runtime APIs, private/public visibility and the publish pipeline all pass.</p></Panel>}
      </div>}
      <footer style={{marginTop:30,color:"#666",fontSize:12}}>Eventra Control Center · operational workflows 1–11 · private admin surface</footer>
    </div>
  </main>
}

function Panel({title,children,wide}){return <section style={{...panel,gridColumn:wide?"1/-1":"auto"}}><div style={{fontSize:12,letterSpacing:1.5,color:"#d7ff3f",marginBottom:8}}>CONTROL</div><h2 style={{margin:"0 0 10px",fontSize:24}}>{title}</h2>{children}</section>}
function Leaderboard({rows}){return <div>{rows.length?rows.map((r,i)=><div style={row} key={r.team_id||r.id||i}><span><b>#{i+1} {r.name||r.team_name}</b><small>{r.points??r.total_points??0} points</small></span></div>):<p style={{color:"#888"}}>No team points yet.</p>}</div>}
function RoleForm({roles,onAction}){const [f,setF]=useState({email:"",role:"coordinator"});return <><form onSubmit={e=>{e.preventDefault();onAction({action:"role.save",...f})}} style={form}><input style={input} type="email" placeholder="user@example.com" value={f.email} onChange={e=>setF({...f,email:e.target.value})} required/><select style={input} value={f.role} onChange={e=>setF({...f,role:e.target.value})}>{["admin","coordinator","judge","team_manager","volunteer","viewer"].map(x=><option key={x}>{x}</option>)}</select><button style={primary}>Assign role</button></form>{roles.map(r=><div style={row} key={r.id}><span><b>{r.email}</b><small>{r.role} · {r.active?"active":"inactive"}</small></span><button style={danger} onClick={()=>onAction({action:"role.delete",id:r.id})}>Remove</button></div>)}</>}
const input={width:"100%",padding:"12px 14px",background:"#111",border:"1px solid #333",borderRadius:10,color:"#fff",boxSizing:"border-box"};
const button={padding:"10px 13px",border:0,borderRadius:999,cursor:"pointer",whiteSpace:"nowrap"};
const primary={...button,background:"#d7ff3f",color:"#0b0b0b",fontWeight:700};
const primaryLink={...primary,display:"inline-block",textDecoration:"none",padding:"11px 15px"};
const danger={...button,background:"#241515",color:"#ff9b9b"};
const panel={background:"#121212",border:"1px solid #282828",borderRadius:18,padding:20};
const card={background:"#181818",border:"1px solid #292929",padding:14,borderRadius:12,display:"flex",flexDirection:"column",gap:7};
const row={display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #262626"};
const form={display:"grid",gap:10,margin:"14px 0"};
const grid2={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10,marginTop:14};
const field={display:"grid",gap:6,margin:"10px 0"};
const notice={margin:"14px 0",padding:"12px 14px",border:"1px solid #435000",borderRadius:10,color:"#d7ff3f",background:"#141900"};
