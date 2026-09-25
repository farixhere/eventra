"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const today = () => new Date().toISOString().slice(0, 10);
const clean = (value) => String(value ?? "").replace(/[&<>"]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
const fileSafe = (value) => String(value || "eventra-document").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "eventra-document";

function documentHtml(kind, data) {
  const event = clean(data.event?.name || "EVENTRA");
  const primary = clean(data.event?.primary_color || "#d7ff3f");
  const secondary = clean(data.event?.secondary_color || "#111111");
  const title = clean(data.title || "");
  const recipient = clean(data.recipient || "Recipient");
  const programme = clean(data.programme || "Programme");
  const achievement = clean(data.achievement || "Certificate of Achievement");
  const number = clean(data.number || "EVENTRA");
  const date = clean(data.date || today());
  const signatory = clean(data.signatory || "Authorised Signatory");
  const designation = clean(data.designation || "Event Coordinator");
  const issuer = clean(data.issuer || event);
  const role = clean(data.role || "PARTICIPANT");
  const code = clean(data.code || "—");
  const institution = clean(data.institution || "Institution");
  const classYear = clean(data.classYear || "");
  const validUntil = clean(data.validUntil || "Event duration");
  const subtitle = clean(data.subtitle || "");
  const note = clean(data.note || "");
  const position = clean(data.position || "");

  if (kind === "certificate") return '<!doctype html><html><head><meta charset="utf-8"><title>' + event + ' Certificate</title><style>@page{size:A4 landscape;margin:0}*{box-sizing:border-box}body{margin:0;background:#ddd;font-family:Arial,sans-serif;color:#171714}.sheet{width:1123px;height:794px;margin:30px auto;background:#f8f6ee;position:relative;overflow:hidden;border:14px solid ' + secondary + ';box-shadow:0 20px 70px #0003}.inner{position:absolute;inset:28px;border:4px solid ' + primary + ';padding:55px;text-align:center}.mark{width:64px;height:64px;border-radius:50%;background:' + primary + ';display:grid;place-items:center;margin:0 auto 18px;font-size:34px;font-weight:800}.eyebrow{font:700 15px monospace;letter-spacing:5px}.label{font:34px Georgia,serif;margin:52px 0 22px}.name{font-size:58px;font-weight:800;margin:0 0 20px}.line{height:6px;background:' + primary + ';width:380px;margin:0 auto 24px}.programme{font-size:22px}.achievement{font-size:18px;margin-top:10px;color:#666}.meta{font:12px monospace;color:#777;margin-top:22px}.signs{display:flex;justify-content:space-between;gap:80px;margin-top:75px}.sign{flex:1;border-top:1px solid #777;padding-top:10px;font-size:15px}.sign small{display:block;color:#777;margin-top:5px}@media print{body{background:#fff}.sheet{margin:0;box-shadow:none;width:100vw;height:100vh}}</style></head><body><div class="sheet"><div class="inner"><div class="mark">E</div><div class="eyebrow">' + event.toUpperCase() + '</div><div class="label">' + achievement + '</div><div class="name">' + recipient + '</div><div class="line"></div><div class="programme">' + programme + '</div><div class="achievement">' + title + '</div><div class="meta">Issued ' + date + ' · Certificate ' + number + '</div><div class="signs"><div class="sign">' + signatory + '<small>' + designation + '</small></div><div class="sign">' + issuer + '<small>Issuing Committee</small></div></div></div></div><script>window.onload=function(){setTimeout(function(){window.print()},250)};<\/script></body></html>';

  if (kind === "id-card") return '<!doctype html><html><head><meta charset="utf-8"><title>' + event + ' ID Card</title><style>@page{size:1011px 638px;margin:0}*{box-sizing:border-box}body{margin:0;background:#ddd;font-family:Arial,sans-serif}.card{width:1011px;height:638px;margin:30px auto;padding:58px;background:' + secondary + ';color:#fff;border-radius:36px;border:4px solid ' + primary + ';position:relative}.brand{font:700 16px monospace;letter-spacing:4px;color:' + primary + '}.small{font:11px monospace;color:#aaa;margin-top:8px}.name{font-size:54px;font-weight:800;margin-top:115px}.role{font-size:18px;color:' + primary + ';font-weight:700;margin-top:8px}.institution{font-size:17px;color:#ccc;margin-top:42px}.code{position:absolute;left:58px;bottom:58px;font:700 24px monospace}.code small{display:block;font-size:11px;color:#999;margin-bottom:7px}.valid{position:absolute;right:58px;bottom:62px;color:#aaa;font:12px monospace}@media print{body{background:#fff}.card{margin:0}}</style></head><body><div class="card"><div class="brand">' + event.toUpperCase() + '</div><div class="small">OFFICIAL EVENT ID CARD</div><div class="name">' + recipient + '</div><div class="role">' + role + '</div><div class="institution">' + institution + (classYear ? ' · ' + classYear : '') + '</div><div class="code"><small>PARTICIPANT CODE</small>' + code + '</div><div class="valid">CARD ' + number + '<br>' + validUntil + '</div></div><script>window.onload=function(){setTimeout(function(){window.print()},250)};<\/script></body></html>';

  return '<!doctype html><html><head><meta charset="utf-8"><title>' + event + ' Poster</title><style>@page{size:A4 portrait;margin:0}*{box-sizing:border-box}body{margin:0;background:#ddd;font-family:Arial,sans-serif}.poster{width:794px;height:1123px;margin:20px auto;padding:62px;background:' + secondary + ';color:#fff;position:relative;overflow:hidden}.poster:before{content:"";position:absolute;width:480px;height:480px;border-radius:50%;background:' + primary + ';opacity:.12;right:-170px;top:-130px}.poster:after{content:"";position:absolute;width:360px;height:360px;border-radius:50%;background:' + primary + ';opacity:.08;left:-160px;bottom:-100px}.content{position:relative;z-index:2}.brand{font:700 14px monospace;letter-spacing:5px;color:' + primary + '}.headline{font-size:78px;line-height:.95;font-weight:800;margin-top:190px;max-width:650px}.subtitle{font:32px Georgia,serif;color:#ddd;margin-top:26px}.recipient{font-size:50px;font-weight:800;color:' + primary + ';margin-top:120px}.programme{font-size:25px;margin-top:15px}.position{font:700 22px monospace;color:#bbb;margin-top:15px}.note{font-size:18px;color:#bbb;margin-top:28px}.footer{position:absolute;bottom:55px;left:62px;font:12px monospace;color:#777}@media print{body{background:#fff}.poster{margin:0}}</style></head><body><div class="poster"><div class="content"><div class="brand">' + event.toUpperCase() + '</div><div class="headline">' + title + '</div><div class="subtitle">' + subtitle + '</div>' + (recipient ? '<div class="recipient">' + recipient + '</div>' : '') + (programme ? '<div class="programme">' + programme + '</div>' : '') + (position ? '<div class="position">POSITION #' + position + '</div>' : '') + (note ? '<div class="note">' + note + '</div>' : '') + '</div><div class="footer">' + date + ' · OFFICIAL EVENTRA POSTER</div></div><script>window.onload=function(){setTimeout(function(){window.print()},250)};<\/script></body></html>';
}

function openDocument(kind, data) {
  const html = documentHtml(kind, data);
  const win = window.open("", "_blank", "width=1200,height=900");
  if (!win) throw new Error("Popup blocked. Allow popups for Eventra document previews.");
  win.document.open(); win.document.write(html); win.document.close();
  const blob = new Blob([html], { type:"text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download=fileSafe((data.recipient || data.title || kind) + "-" + (data.event?.name || "eventra")) + ".html"; a.click();
  URL.revokeObjectURL(url);
}

export default function DocumentsPage() {
  const [events,setEvents]=useState([]), [selectedId,setSelectedId]=useState("");
  const [results,setResults]=useState([]), [participants,setParticipants]=useState([]);
  const [certificates,setCertificates]=useState([]), [tab,setTab]=useState("certificates");
  const [busy,setBusy]=useState(false), [error,setError]=useState("");
  const [cert,setCert]=useState({resultId:"",achievement:"",title:"Certificate of Achievement",date:today(),issuer:"",signatory:"",designation:""});
  const [card,setCard]=useState({participantId:"",role:"PARTICIPANT",institution:"",classYear:"",validUntil:"Event duration"});
  const [poster,setPoster]=useState({title:"Congratulations!",subtitle:"Celebrate the achievement.",recipient:"",programme:"",position:"",date:today(),note:""});

  const event=useMemo(()=>events.find(e=>e.id===selectedId)||null,[events,selectedId]);
  const result=results.find(r=>r.id===cert.resultId)||null;
  const participant=participants.find(p=>p.id===card.participantId)||null;

  async function loadEvents(){const r=await fetch("/api/events",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load events");setEvents(d.events||[]);if(!selectedId&&d.events?.[0])setSelectedId(d.events[0].id);}
  async function loadData(id){if(!id)return;const [a,b,c]=await Promise.all([fetch("/api/results?eventId="+id,{cache:"no-store"}),fetch("/api/certificates?eventId="+id,{cache:"no-store"}),fetch("/api/participants?eventId="+id,{cache:"no-store"})]);const [ad,bd,cd]=await Promise.all([a.json(),b.json(),c.json()]);if(!a.ok)throw new Error(ad.error||"Unable to load results");if(!b.ok)throw new Error(bd.error||"Unable to load certificates");if(!c.ok)throw new Error(cd.error||"Unable to load participants");setResults((ad.results||[]).filter(x=>x.published));setCertificates(bd.certificates||[]);setParticipants(cd.participants||[]);}
  useEffect(()=>{loadEvents().catch(e=>setError(e.message));},[]);
  useEffect(()=>{loadData(selectedId).catch(e=>setError(e.message));},[selectedId]);
  useEffect(()=>{if(result)setCert(v=>({...v,achievement:result.position===1?"First Place":result.position?"Position #"+result.position:"Achievement",title:result.programme_name||"Certificate of Achievement",issuer:event?.name||""}));},[result,event]);

  async function generateCertificate(){
    if(!event||!result)return setError("Choose a published result first.");
    setBusy(true);setError("");
    try{let record=certificates.find(c=>c.result_id===result.id);if(!record){const r=await fetch("/api/certificates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId:event.id,resultId:result.id,participantId:result.participant_id,teamId:result.team_id,title:cert.title,certificateType:result.position===1?"winner":"achievement"})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to create certificate record");record=d.certificate;}openDocument("certificate",{event,recipient:result.entry_name,programme:result.programme_name,achievement:cert.achievement,title:cert.title,date:cert.date,issuer:cert.issuer,signatory:cert.signatory,designation:cert.designation,number:record.certificate_number});}catch(e){setError(e.message)}finally{setBusy(false)}
  }
  async function generateCard(){
    if(!event||!participant)return setError("Choose a participant first.");
    setBusy(true);setError("");
    try{const r=await fetch("/api/id-cards?eventId="+event.id,{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load ID cards");let record=(d.cards||[]).find(x=>x.participant_id===participant.id);if(!record){const cr=await fetch("/api/id-cards",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId:event.id,participantId:participant.id})});const cd=await cr.json();if(!cr.ok)throw new Error(cd.error||"Unable to create ID card record");record=cd.card;}openDocument("id-card",{event,recipient:participant.name,role:card.role,code:participant.participant_code,institution:card.institution||participant.school_college,classYear:card.classYear||participant.class_year,validUntil:card.validUntil,number:record.card_number});}catch(e){setError(e.message)}finally{setBusy(false)}
  }
  function generatePoster(){if(!event)return setError("Choose an event first.");setError("");openDocument("poster",{event,...poster});}

  return <main className="documentsPage">
    <header className="documentsHeader"><div><Link href="/dashboard" className="backLink">← Event Control Center</Link><span className="docEyebrow">DOCUMENT STUDIO</span><h1>Certificates, ID cards & posters.</h1><p>Generate print-ready event documents from approved Eventra records.</p></div><select value={selectedId} onChange={e=>setSelectedId(e.target.value)} aria-label="Event"><option value="">Choose event</option>{events.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></header>
    {error&&<div className="formError">{error}</div>}
    <nav className="documentTabs">{[["certificates","Certificates"],["id-cards","ID Cards"],["posters","Posters"]].map(([k,l])=><button key={k} className={tab===k?"active":""} onClick={()=>setTab(k)}>{l}</button>)}</nav>

    {tab==="certificates"&&<section className="documentStudio"><div className="documentIntro"><span>01 · CERTIFICATE GENERATOR</span><h2>Approved result → official certificate.</h2><p>Certificates are generated from published manual results, keeping the document tied to the official result record.</p></div><div className="documentGrid"><form className="studioForm" onSubmit={e=>{e.preventDefault();generateCertificate()}}><h3>Certificate details</h3><label>Published result<select required value={cert.resultId} onChange={e=>setCert({...cert,resultId:e.target.value})}><option value="">Choose result</option>{results.map(r=><option key={r.id} value={r.id}>{r.programme_name} — {r.entry_name} · #{r.position}</option>)}</select></label><label>Achievement<input value={cert.achievement} onChange={e=>setCert({...cert,achievement:e.target.value})}/></label><label>Certificate title<input value={cert.title} onChange={e=>setCert({...cert,title:e.target.value})}/></label><div className="twoFields"><label>Issue date<input type="date" value={cert.date} onChange={e=>setCert({...cert,date:e.target.value})}/></label><label>Issuer<input value={cert.issuer} onChange={e=>setCert({...cert,issuer:e.target.value})}/></label></div><div className="twoFields"><label>Signatory<input value={cert.signatory} onChange={e=>setCert({...cert,signatory:e.target.value})} placeholder="Authorised signatory"/></label><label>Designation<input value={cert.designation} onChange={e=>setCert({...cert,designation:e.target.value})}/></label></div><button className="generateButton" disabled={busy||!cert.resultId}>{busy?"Generating…":"Generate & print certificate →"}</button></form><div className="documentPreview"><span className="previewLabel">PREVIEW</span><div className="certificatePreview"><b>{event?.name||"EVENTRA"}</b><h3>{result?.entry_name||"Recipient"}</h3><p>{cert.achievement||"Certificate of Achievement"}</p><small>{result?.programme_name||"Programme"} · #{result?.position||"—"}</small></div></div></div></section>}

    {tab==="id-cards"&&<section className="documentStudio"><div className="documentIntro"><span>02 · ID CARD GENERATOR</span><h2>Official cards for every participant.</h2><p>Generate a consistent card with participant code, role, institution and validity.</p></div><div className="documentGrid"><form className="studioForm" onSubmit={e=>{e.preventDefault();generateCard()}}><h3>ID card details</h3><label>Participant<select required value={card.participantId} onChange={e=>setCard({...card,participantId:e.target.value})}><option value="">Choose participant</option>{participants.map(p=><option key={p.id} value={p.id}>{p.name} · {p.participant_code}</option>)}</select></label><label>Role<input value={card.role} onChange={e=>setCard({...card,role:e.target.value})}/></label><div className="twoFields"><label>Institution<input value={card.institution} onChange={e=>setCard({...card,institution:e.target.value})} placeholder={participant?.school_college||"School / College"}/></label><label>Class / year<input value={card.classYear} onChange={e=>setCard({...card,classYear:e.target.value})} placeholder={participant?.class_year||"Optional"}/></label></div><label>Valid until<input type="date" value={card.validUntil==="Event duration"?"":card.validUntil} onChange={e=>setCard({...card,validUntil:e.target.value||"Event duration"})}/></label><button className="generateButton" disabled={busy||!card.participantId}>{busy?"Generating…":"Generate & print ID card →"}</button></form><div className="documentPreview"><span className="previewLabel">CARD PREVIEW</span><div className="idCardPreview"><b>{event?.name||"EVENTRA"}</b><strong>{participant?.name||"Participant Name"}</strong><span>{card.role} · {participant?.participant_code||"CODE"}</span><small>{card.institution||participant?.school_college||"Institution"}</small></div></div></div></section>}

    {tab==="posters"&&<section className="documentStudio"><div className="documentIntro"><span>03 · POSTER GENERATOR</span><h2>Make official posters without leaving Eventra.</h2><p>Use one generator for congratulations, announcements, programme cards and welcome graphics.</p></div><div className="documentGrid"><form className="studioForm" onSubmit={e=>{e.preventDefault();generatePoster()}}><h3>Poster details</h3><label>Headline<input value={poster.title} onChange={e=>setPoster({...poster,title:e.target.value})}/></label><label>Subtitle<input value={poster.subtitle} onChange={e=>setPoster({...poster,subtitle:e.target.value})}/></label><div className="twoFields"><label>Recipient<input value={poster.recipient} onChange={e=>setPoster({...poster,recipient:e.target.value})}/></label><label>Programme<input value={poster.programme} onChange={e=>setPoster({...poster,programme:e.target.value})}/></label></div><div className="twoFields"><label>Position<input value={poster.position} onChange={e=>setPoster({...poster,position:e.target.value})}/></label><label>Date<input type="date" value={poster.date} onChange={e=>setPoster({...poster,date:e.target.value})}/></label></div><label>Supporting note<input value={poster.note} onChange={e=>setPoster({...poster,note:e.target.value})}/></label><button className="generateButton" disabled={!event}>Generate & print poster →</button></form><div className="documentPreview"><span className="previewLabel">POSTER PREVIEW</span><div className="posterPreview"><b>{event?.name||"EVENTRA"}</b><h3>{poster.title}</h3><p>{poster.subtitle}</p>{poster.recipient&&<strong>{poster.recipient}</strong>}{poster.programme&&<small>{poster.programme}</small>}</div></div></div></section>}
  </main>;
}
