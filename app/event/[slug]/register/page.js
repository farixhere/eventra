"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function RegisterPage() {
  const { slug } = useParams();
  const [data,setData]=useState(null),[form,setForm]=useState({name:"",email:"",phone:"",participantCode:"",programmeId:""}),[message,setMessage]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);

  useEffect(()=>{if(!slug)return;fetch("/api/public-registration?slug="+encodeURIComponent(slug),{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load registration");setData(d)}).catch(e=>setError(e.message));},[slug]);

  async function submit(e){
    e.preventDefault();setError("");setMessage("");setBusy(true);
    try{const r=await fetch("/api/public-registration",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,slug})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to register");setMessage("Registration received. Your participant code is "+(d.participant?.participant_code||"pending")+".");setForm({name:"",email:"",phone:"",participantCode:"",programmeId:""});}
    catch(e){setError(e.message)}finally{setBusy(false)}
  }

  if(error&&!data)return <main className="publicEvent"><section className="publicSection"><div className="formError">{error}</div></section></main>;
  const event=data?.event, programmes=data?.programmes||[];
  return <main className="publicEvent registrationPublic" style={{"--event-primary":event?.primary_color||"#d7ff3f","--event-secondary":event?.secondary_color||"#111"}}>
    <nav className="publicNav"><a href={"/event/"+slug}>EVENTRA<span>.</span></a><div><a href={"/event/"+slug}>Event</a><a href={"/event/"+slug+"/results"}>Results</a><a href={"/event/"+slug+"/schedules"}>Schedule</a><a href={"/event/"+slug+"/gallery"}>Gallery</a></div></nav>
    <section className="publicHero compactHero"><span className="publicKicker">REGISTRATION · {(event?.name||"EVENTRA").toUpperCase()}</span><h1>Join the event.</h1><p>{event?.tagline||event?.description||"Complete the form once. Your participant record stays connected to the event."}</p><div className="registrationPublicMeta"><span>{event?.location||"Venue to be announced"}</span><span>{event?.registration_open?"Registration open":"Registration closed"}</span></div></section>
    <section className="publicSection"><div className="registrationPublicGrid"><div><div className="publicSectionTitle"><small>01 · YOUR DETAILS</small><h2>Participant information</h2></div><form className="contactForm registrationFormPublic" onSubmit={submit}>
      <label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your full name"/></label>
      <label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label>
      <label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Phone number"/></label>
      <label>Participant code <span>optional</span><input value={form.participantCode} onChange={e=>setForm({...form,participantCode:e.target.value})} placeholder="Leave blank to generate one"/></label>
      <label>Programme <span>optional</span><select value={form.programmeId} onChange={e=>setForm({...form,programmeId:e.target.value})}><option value="">Register as participant only</option>{programmes.map(p=><option key={p.id} value={p.id} disabled={p.type!=="individual"||(p.max_participants&&p.registered_count>=p.max_participants)}>{p.name} · {p.category||"General"}{p.max_participants?" · "+p.registered_count+"/"+p.max_participants:""}{p.type==="team"?" · organiser entry":""}</option>)}</select></label>
      <button disabled={busy||!event?.registration_open}>{busy?"Submitting…":"Submit registration →"}</button>
      {message&&<div className="publicNotice">{message}</div>}{error&&<div className="formError">{error}</div>}
    </form></div>
    <aside className="registrationInfo"><span>02 · BEFORE YOU SUBMIT</span><h3>One official registration.</h3><p>Your participant code can be used later on the public result lookup. Programme limits are checked before an entry is accepted.</p><div className="registrationInfoItem"><strong>Deadline</strong><span>{event?.registration_deadline?new Date(event.registration_deadline).toLocaleString("en-IN"):"Not specified"}</span></div><div className="registrationInfoItem"><strong>Team programmes</strong><span>Team entries are handled by the organiser.</span></div><div className="registrationInfoItem"><strong>Need help?</strong><a href={"/event/"+slug+"/contact"}>Contact organisers →</a></div></aside></div></section>
    <footer className="publicFooter"><strong>EVENTRA<span>.</span></strong><span>Festival management, made simple.</span></footer>
  </main>;
}
