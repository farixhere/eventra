"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function ContactPage() {
  const { slug } = useParams();
  const [form,setForm]=useState({name:"",email:"",subject:"",message:""});
  const [sent,setSent]=useState(false);
  const [error,setError]=useState("");

  async function submit(e){
    e.preventDefault(); setError("");
    const res=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,eventSlug:slug})});
    const data=await res.json();
    if(!res.ok){setError(data.error||"Unable to send message");return;}
    setSent(true);
    setForm({name:"",email:"",subject:"",message:""});
  }

  return <main className="publicEvent">
    <nav className="publicNav"><a href={"/event/"+slug}>EVENTRA<span>.</span></a><div><a href={"/event/"+slug+"/results"}>Results</a><a href={"/event/"+slug+"/schedules"}>Schedules</a><a href={"/event/"+slug+"/wall"}>Wall</a><a href={"/event/"+slug+"/gallery"}>Gallery</a></div></nav>
    <section className="publicHero compactHero"><span className="publicKicker">CONTACT · EVENTRA</span><h1>Talk to the organisers.</h1><p>Questions, corrections or event information? Send a message.</p></section>
    <section className="publicSection">
      <form className="contactForm" onSubmit={submit}>
        <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name" required />
        <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email address" required />
        <input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="Subject" />
        <textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Your message" rows="7" required />
        <button type="submit">Send message →</button>
        {sent && <div className="publicNotice">Message sent. The organisers can now review it from Eventra.</div>}
        {error && <div className="formError">{error}</div>}
      </form>
    </section>
    <footer className="publicFooter"><strong>EVENTRA<span>.</span></strong><span>Festival management, made simple.</span></footer>
  </main>;
}
