"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function RegistrationDesk() {
  const [events,setEvents]=useState([]),[selectedId,setSelectedId]=useState(""),[programmes,setProgrammes]=useState([]),[participants,setParticipants]=useState([]),[teams,setTeams]=useState([]),[registrations,setRegistrations]=useState([]);
  const [form,setForm]=useState({programmeId:"",participantId:"",teamId:""}),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const event=useMemo(()=>events.find(e=>e.id===selectedId)||null,[events,selectedId]);
  const programme=programmes.find(p=>p.id===form.programmeId)||null;

  async function loadEvents(){const r=await fetch("/api/events",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load events");setEvents(d.events||[]);if(!selectedId&&d.events?.[0])setSelectedId(d.events[0].id);}
  async function load(){if(!selectedId)return;const rs=await Promise.all(["programmes","participants","teams","registrations"].map(x=>fetch("/api/"+x+"?eventId="+selectedId,{cache:"no-store"})));const ds=await Promise.all(rs.map(x=>x.json()));for(let i=0;i<rs.length;i++)if(!rs[i].ok)throw new Error(ds[i].error||"Unable to load registration data");setProgrammes(ds[0].programmes||[]);setParticipants(ds[1].participants||[]);setTeams(ds[2].teams||[]);setRegistrations(ds[3].registrations||[]);}
  useEffect(()=>{loadEvents().catch(e=>setError(e.message));},[]);
  useEffect(()=>{load().catch(e=>setError(e.message));},[selectedId]);

  async function addRegistration(){
    setBusy(true);setError("");
    try{
      if(!form.programmeId)throw new Error("Choose a programme.");
      if(programme?.type==="team"&&!form.teamId)throw new Error("Choose a team.");
      if(programme?.type!=="team"&&!form.participantId)throw new Error("Choose a participant.");
      const r=await fetch("/api/registrations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,eventId:selectedId})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to create registration");
      setForm({programmeId:"",participantId:"",teamId:""});await load();
    }catch(e){setError(e.message)}finally{setBusy(false)}
  }
  async function remove(id){if(!window.confirm("Remove this registration?"))return;const r=await fetch("/api/registrations?id="+id,{method:"DELETE"});const d=await r.json();if(!r.ok){setError(d.error||"Unable to remove registration");return;}await load();}

  return <main className="registrationDesk">
    <header className="registrationDeskHeader"><div><Link href="/dashboard" className="backLink">← Event Control Center</Link><span className="docEyebrow">REGISTRATION DESK</span><h1>Programme registration.</h1><p>Manage participant and team entries with the same rules used by the rest of Eventra.</p></div><select value={selectedId} onChange={e=>setSelectedId(e.target.value)} aria-label="Event"><option value="">Choose event</option>{events.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></header>
    {error&&<div className="formError">{error}</div>}
    {!event?<div className="registrationEmpty">Create an event first.</div>:<><section className="registrationHero"><div><span>EVENT</span><h2>{event.name}</h2><p>{event.registration_open?"Public registration is open.":"Public registration is closed."}{event.registration_deadline?" · Deadline "+new Date(event.registration_deadline).toLocaleDateString("en-IN"):""}</p></div><div><strong>{participants.length}</strong><small>participants</small></div><div><strong>{registrations.length}</strong><small>programme entries</small></div></section>
    <section className="registrationCard"><span className="docEyebrow">MANUAL ENTRY</span><h2>Add a programme entry.</h2><p>Programme limits and duplicate protection are enforced by the registration API.</p><div className="registrationFields"><label>Programme<select value={form.programmeId} onChange={e=>setForm({programmeId:e.target.value,participantId:"",teamId:""})}><option value="">Choose programme</option>{programmes.map(p=><option key={p.id} value={p.id}>{p.name} · {p.type}{p.max_participants?" · max "+p.max_participants:""}</option>)}</select></label>{programme?.type==="team"?<label>Team<select value={form.teamId} onChange={e=>setForm({...form,teamId:e.target.value})}><option value="">Choose team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>:<label>Participant<select value={form.participantId} onChange={e=>setForm({...form,participantId:e.target.value})}><option value="">Choose participant</option>{participants.map(p=><option key={p.id} value={p.id}>{p.name} · {p.participant_code}</option>)}</select></label>}<button onClick={addRegistration} disabled={busy||!form.programmeId}>{busy?"Registering…":"Register →"}</button></div></section>
    <section className="registrationList"><div className="registrationListHeader"><div><span className="docEyebrow">CURRENT ENTRIES</span><h2>Programme entries</h2></div><strong>{registrations.length.toString().padStart(2,"0")}</strong></div>{registrations.length===0?<div className="registrationEmpty">No registrations yet.</div>:registrations.map(r=><div className="registrationRow" key={r.id}><span className="regStatus">{r.status}</span><div><strong>{r.programme_name}</strong><span>{r.programme_type==="team"?r.team_name:r.participant_name} · {r.participant_code||"Team entry"}</span></div><time>{new Date(r.created_at).toLocaleDateString("en-IN")}</time><button onClick={()=>remove(r.id)}>Remove</button></div>)}</section></>}
  </main>;
}
