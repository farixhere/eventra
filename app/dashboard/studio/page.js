"use client";

import { useEffect, useMemo, useState } from "react";

const emptyAnnouncement={title:"",body:""};
const emptyDownload={title:"",description:"",fileUrl:"",fileType:"FILE"};
const emptyMedia={fileName:"",fileUrl:"",fileType:"image",category:"gallery",caption:""};
const emptyContact={};
const emptyCertificate={title:"",certificateType:"participation",participantId:"",teamId:"",resultId:"",fileUrl:""};
const emptyCard={participantId:"",fileUrl:""};

export default function EventStudio(){
  const [events,setEvents]=useState([]);
  const [eventId,setEventId]=useState("");
  const [section,setSection]=useState("overview");
  const [data,setData]=useState({announcements:[],downloads:[],media:[],messages:[],certificates:[],cards:[],analytics:null,participants:[],teams:[],results:[]});
  const [forms,setForms]=useState({announcement:emptyAnnouncement,download:emptyDownload,media:emptyMedia,certificate:emptyCertificate,card:emptyCard,branding:{}});
  const [error,setError]=useState("");
  const [saving,setSaving]=useState(false);

  async function getJson(url){
    const r=await fetch(url,{cache:"no-store"}); const d=await r.json();
    if(!r.ok) throw new Error(d.error||"Request failed"); return d;
  }

  async function loadEvents(){
    try{const d=await getJson("/api/events");setEvents(d.events||[]);if(!eventId&&d.events?.[0])setEventId(d.events[0].id);}catch(e){setError(e.message);}
  }

  async function loadAll(id=eventId){
    if(!id)return;
    try{
      const [a,d,m,c,cert,cards,p,r]=await Promise.all([
        getJson("/api/announcements?eventId="+id),getJson("/api/downloads?eventId="+id),getJson("/api/media?eventId="+id),
        getJson("/api/contact?eventId="+id),getJson("/api/certificates?eventId="+id),getJson("/api/id-cards?eventId="+id),
        getJson("/api/participants?eventId="+id),getJson("/api/results?eventId="+id)
      ]);
      let analytics=null; try{analytics=(await getJson("/api/analytics?eventId="+id)).analytics;}catch(_){}
      setData({announcements:a.announcements||[],downloads:d.downloads||[],media:m.media||[],messages:c.messages||[],certificates:cert.certificates||[],cards:cards.cards||[],analytics,participants:p.participants||[],teams:[],results:r.results||[]});
      const ev=events.find(x=>x.id===id); if(ev)setForms(x=>({...x,branding:{...ev}}));
    }catch(e){setError(e.message);}
  }

  useEffect(()=>{loadEvents();},[]);
  useEffect(()=>{loadAll();},[eventId]);

  async function mutate(url,method,body){
    setSaving(true);setError("");
    try{const r=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to save");await loadAll();return d;}
    catch(e){setError(e.message);}
    finally{setSaving(false);}
  }

  const event=events.find(x=>x.id===eventId);
  const publishedMedia=data.media.filter(x=>x.published).length;
  const publishedAnnouncements=data.announcements.filter(x=>x.published).length;
  const publishedDownloads=data.downloads.filter(x=>x.published).length;

  return <main className="studioPage">
    <header className="studioHeader"><div><small>EVENTRA · EVENT STUDIO</small><h1>{event?.name||"Event Studio"}</h1><p>Everything around the festival website, documents, communication and operations.</p></div><div className="studioHeaderActions"><select value={eventId} onChange={e=>setEventId(e.target.value)}>{events.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select>{event&&<a href={"/event/"+event.slug} target="_blank" rel="noreferrer">View public site ↗</a>}</div></header>
    {error&&<div className="formError">{error}</div>}
    <div className="studioShell">
      <aside className="studioNav">{[["overview","Overview"],["branding","Website & branding"],["announcements","Announcements"],["downloads","Downloads"],["media","Gallery & media"],["messages","Contact inbox"],["certificates","Certificates"],["idcards","ID cards"]].map(([k,l])=><button key={k} className={section===k?"active":""} onClick={()=>setSection(k)}>{l}</button>)}</aside>
      <section className="studioContent">
        {section==="overview"&&<><div className="studioStats"><div><small>Participants</small><strong>{data.analytics?.participants??data.participants.length}</strong></div><div><small>Registrations</small><strong>{data.analytics?.registrations??"—"}</strong></div><div><small>Published results</small><strong>{data.analytics?.published_results??"—"}</strong></div><div><small>Page views</small><strong>{data.analytics?.page_views??0}</strong></div></div><div className="studioGrid"><article><small>CONTENT</small><h2>{publishedAnnouncements} live announcements</h2><p>{data.announcements.length-publishedAnnouncements} drafts waiting to publish.</p></article><article><small>MEDIA</small><h2>{publishedMedia} live media items</h2><p>{data.media.length-publishedMedia} items are still private.</p></article><article><small>RESOURCES</small><h2>{publishedDownloads} live downloads</h2><p>Publish schedules, posters, documents and files.</p></article><article><small>INBOX</small><h2>{data.messages.filter(x=>x.status==="unread").length} unread messages</h2><p>Respond to public questions from one place.</p></article></div></>}

        {section==="branding"&&<form className="studioForm" onSubmit={e=>{e.preventDefault();const b=forms.branding;mutate("/api/events","PATCH",{id:eventId,name:b.name,description:b.description,tagline:b.tagline,logoUrl:b.logo_url,bannerUrl:b.banner_url,websiteTheme:b.website_theme,primaryColor:b.primary_color,secondaryColor:b.secondary_color,isPublic:Boolean(b.is_public),registrationOpen:Boolean(b.registration_open),registrationDeadline:b.registration_deadline||null,websiteSections:b.website_sections||{}})}}>
          <small>PUBLIC WEBSITE CONTROL CENTER</small><h2>Website & branding</h2><p>One place for identity, theme, visibility and public navigation.</p>
          <label>Event name<input value={forms.branding.name||""} onChange={e=>setForms(x=>({...x,branding:{...x.branding,name:e.target.value}}))}/></label>
          <label>Tagline<input value={forms.branding.tagline||""} onChange={e=>setForms(x=>({...x,branding:{...x.branding,tagline:e.target.value}}))}/></label>
          <label>Description<textarea value={forms.branding.description||""} onChange={e=>setForms(x=>({...x,branding:{...x.branding,description:e.target.value}}))}/></label>
          <label>Logo URL<input value={forms.branding.logo_url||""} onChange={e=>setForms(x=>({...x,branding:{...x.branding,logo_url:e.target.value}}))}/></label>
          <label>Banner URL<input value={forms.branding.banner_url||""} onChange={e=>setForms(x=>({...x,branding:{...x.branding,banner_url:e.target.value}}))}/></label>
          <div className="studioTwo"><label>Theme<select value={forms.branding.website_theme||"eventra"} onChange={e=>setForms(x=>({...x,branding:{...x.branding,website_theme:e.target.value}}))}><option value="eventra">Eventra Editorial</option><option value="dark">Dark Festival</option><option value="light">Light Festival</option></select></label><label>Primary color<input type="color" value={forms.branding.primary_color||"#d7ff3f"} onChange={e=>setForms(x=>({...x,branding:{...x.branding,primary_color:e.target.value}}))}/></label><label>Secondary color<input type="color" value={forms.branding.secondary_color||"#111111"} onChange={e=>setForms(x=>({...x,branding:{...x.branding,secondary_color:e.target.value}}))}/></label></div>
          <div className="studioToggle"><div><strong>Public website</strong><span>Make the public event pages visible.</span></div><input type="checkbox" checked={Boolean(forms.branding.is_public)} onChange={e=>setForms(x=>({...x,branding:{...x.branding,is_public:e.target.checked}}))}/></div>
          <div className="studioToggle"><div><strong>Registration open</strong><span>Allow public participant registration.</span></div><input type="checkbox" checked={Boolean(forms.branding.registration_open)} onChange={e=>setForms(x=>({...x,branding:{...x.branding,registration_open:e.target.checked}}))}/></div>
          <label>Registration deadline<input type="datetime-local" value={forms.branding.registration_deadline?new Date(forms.branding.registration_deadline).toISOString().slice(0,16):""} onChange={e=>setForms(x=>({...x,branding:{...x.branding,registration_deadline:e.target.value}}))}/></label>
          <div className="studioSectionControls"><strong>Homepage sections</strong>{Object.entries({programmes:true,schedule:true,results:true,gallery:true,announcements:true,participants:true,contact:true,...(forms.branding.website_sections||{})}).map(([key,val])=><label key={key}><span>{key[0].toUpperCase()+key.slice(1)}</span><input type="checkbox" checked={Boolean(val)} onChange={e=>setForms(x=>({...x,branding:{...x.branding,website_sections:{...(x.branding.website_sections||{}),[key]:e.target.checked}}}))}/></label>)}</div>
          <button disabled={saving}>{saving?"Saving…":"Save website settings"}</button>
        </form>}

        {section==="announcements"&&<div><div className="studioForm"><h2>Announcements</h2><input placeholder="Headline" value={forms.announcement.title} onChange={e=>setForms(x=>({...x,announcement:{...x.announcement,title:e.target.value}}))}/><textarea placeholder="Message" value={forms.announcement.body} onChange={e=>setForms(x=>({...x,announcement:{...x.announcement,body:e.target.value}}))}/><button disabled={saving} onClick={()=>mutate("/api/announcements","POST",{eventId,...forms.announcement})}>Add announcement</button></div><StudioList items={data.announcements} render={x=><><strong>{x.title}</strong><span>{x.published?"LIVE":"DRAFT"} · {new Date(x.created_at).toLocaleString()}</span></>} action={x=>mutate("/api/announcements","PATCH",{id:x.id,published:!x.published})} actionLabel={x=>x.published?"Unpublish":"Publish"} /></div>}

        {section==="downloads"&&<div><div className="studioForm"><h2>Downloads</h2><input placeholder="Title" value={forms.download.title} onChange={e=>setForms(x=>({...x,download:{...x.download,title:e.target.value}}))}/><input placeholder="File URL" value={forms.download.fileUrl} onChange={e=>setForms(x=>({...x,download:{...x.download,fileUrl:e.target.value}}))}/><input placeholder="Description" value={forms.download.description} onChange={e=>setForms(x=>({...x,download:{...x.download,description:e.target.value}}))}/><input placeholder="Type e.g. PDF / JPG" value={forms.download.fileType} onChange={e=>setForms(x=>({...x,download:{...x.download,fileType:e.target.value}}))}/><button disabled={saving} onClick={()=>mutate("/api/downloads","POST",{eventId,...forms.download})}>Add resource</button></div><StudioList items={data.downloads} render={x=><><strong>{x.title}</strong><span>{x.published?"LIVE":"DRAFT"} · {x.file_type}</span></>} action={x=>mutate("/api/downloads","PATCH",{id:x.id,published:!x.published})} actionLabel={x=>x.published?"Unpublish":"Publish"} /></div>}

        {section==="media"&&<div><div className="studioForm"><h2>Gallery & media</h2><input placeholder="File name" value={forms.media.fileName} onChange={e=>setForms(x=>({...x,media:{...x.media,fileName:e.target.value}}))}/><input placeholder="Image/video URL" value={forms.media.fileUrl} onChange={e=>setForms(x=>({...x,media:{...x.media,fileUrl:e.target.value}}))}/><input placeholder="Caption" value={forms.media.caption} onChange={e=>setForms(x=>({...x,media:{...x.media,caption:e.target.value}}))}/><input placeholder="Category" value={forms.media.category} onChange={e=>setForms(x=>({...x,media:{...x.media,category:e.target.value}}))}/><button disabled={saving} onClick={()=>mutate("/api/media","POST",{eventId,...forms.media})}>Add media</button></div><StudioList items={data.media} render={x=><><strong>{x.file_name}</strong><span>{x.published?"LIVE":"DRAFT"} · {x.category}</span></>} action={x=>mutate("/api/media","PATCH",{id:x.id,published:!x.published})} actionLabel={x=>x.published?"Unpublish":"Publish"} /></div>}

        {section==="messages"&&<StudioList items={data.messages} render={x=><><strong>{x.subject||"Message"} · {x.name}</strong><span>{x.email} · {x.status}</span><p>{x.message}</p></>} action={x=>mutate("/api/contact","PATCH",{id:x.id,status:x.status==="unread"?"read":"unread"})} actionLabel={x=>x.status==="unread"?"Mark read":"Mark unread"} />}

        {section==="certificates"&&<div><div className="studioForm"><h2>Certificates</h2><input placeholder="Certificate title" value={forms.certificate.title} onChange={e=>setForms(x=>({...x,certificate:{...x.certificate,title:e.target.value}}))}/><select value={forms.certificate.participantId} onChange={e=>setForms(x=>({...x,certificate:{...x.certificate,participantId:e.target.value}}))}><option value="">Select participant</option>{data.participants.map(p=><option key={p.id} value={p.id}>{p.name} · {p.participant_code}</option>)}</select><input placeholder="Optional certificate file URL" value={forms.certificate.fileUrl} onChange={e=>setForms(x=>({...x,certificate:{...x.certificate,fileUrl:e.target.value}}))}/><button disabled={saving} onClick={()=>mutate("/api/certificates","POST",{eventId,...forms.certificate})}>Issue certificate</button></div><StudioList items={data.certificates} render={x=><><strong>{x.title}</strong><span>{x.recipient_name||"Recipient"} · {x.certificate_number}</span></>} /></div>}

        {section==="idcards"&&<div><div className="studioForm"><h2>ID cards</h2><select value={forms.card.participantId} onChange={e=>setForms(x=>({...x,card:{...x.card,participantId:e.target.value}}))}><option value="">Select participant</option>{data.participants.map(p=><option key={p.id} value={p.id}>{p.name} · {p.participant_code}</option>)}</select><input placeholder="Optional card file URL" value={forms.card.fileUrl} onChange={e=>setForms(x=>({...x,card:{...x.card,fileUrl:e.target.value}}))}/><button disabled={saving} onClick={()=>mutate("/api/id-cards","POST",{eventId,...forms.card})}>Create ID card record</button></div><StudioList items={data.cards} render={x=><><strong>{x.participant_name}</strong><span>{x.card_number} · {x.participant_code}</span></>} /></div>}
      </section>
    </div>
  </main>
}

function StudioList({items,render,action,actionLabel}){
  return <div className="studioList">{items.length?items.map(x=><div className="studioRow" key={x.id}><div>{render(x)}</div>{action&&<button onClick={()=>action(x)}>{actionLabel(x)}</button>}</div>):<div className="studioEmpty">Nothing here yet.</div>}</div>
}
