"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

export default function RegisterPage(){
  const {slug}=useParams();
  const [form,setForm]=useState({name:"",email:"",phone:"",participantCode:""});
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  async function submit(e){
    e.preventDefault();setError("");setMessage("");
    const r=await fetch("/api/public-registration",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,slug})});
    const d=await r.json(); if(!r.ok){setError(d.error||"Unable to register");return;}
    setMessage("Registration received. Your participant code is "+(d.participant?.participant_code||"pending")+".");
    setForm({name:"",email:"",phone:"",participantCode:""});
  }
  return <main className="publicEvent">
    <nav className="publicNav"><a href={"/event/"+slug}>EVENTRA<span>.</span></a><div><a href={"/event/"+slug+"/results"}>Results</a><a href={"/event/"+slug+"/schedules"}>Schedules</a><a href={"/event/"+slug+"/gallery"}>Gallery</a></div></nav>
    <section className="publicHero compactHero"><span className="publicKicker">REGISTRATION · EVENTRA</span><h1>Join the event.</h1><p>Submit your participant details to the organiser.</p></section>
    <section className="publicSection"><form className="contactForm" onSubmit={submit}>
      <input required placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
      <input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
      <input placeholder="Participant code (optional)" value={form.participantCode} onChange={e=>setForm({...form,participantCode:e.target.value})}/>
      <button>Submit registration →</button>
      {message&&<div className="publicNotice">{message}</div>}
      {error&&<div className="formError">{error}</div>}
    </form></section>
    <footer className="publicFooter"><strong>EVENTRA<span>.</span></strong><span>Festival management, made simple.</span></footer>
  </main>;
}
