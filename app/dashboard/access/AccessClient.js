"use client";
import {useEffect,useState} from "react";

export default function AccessClient(){
 const [me,setMe]=useState(null),[accounts,setAccounts]=useState([]),[events,setEvents]=useState([]),[assignments,setAssignments]=useState([]),[eventId,setEventId]=useState(""),[error,setError]=useState(""),[form,setForm]=useState({name:"",email:"",password:"",globalRole:"viewer"});
 async function load(){
  const m=await fetch("/api/auth/me",{cache:"no-store"});
  if(!m.ok){location.href="/dashboard/login?next=/dashboard/access";return}
  const md=await m.json();setMe(md.user);
  if(md.user.globalRole!=="admin"){setError("Admin access required.");return}
  const [a,e]=await Promise.all([fetch("/api/auth/accounts"),fetch("/api/events")]);
  const ad=await a.json(),ed=await e.json();
  if(!a.ok)throw new Error(ad.error||"Unable to load accounts");
  if(!e.ok)throw new Error(ed.error||"Unable to load events");
  setAccounts(ad.accounts||[]);setEvents(ed.events||[]);
  if(!eventId&&ed.events?.[0])setEventId(ed.events[0].id);
 }
 async function loadAssignments(id=eventId){
  if(!id)return;
  const r=await fetch("/api/auth/event-roles?eventId="+id),d=await r.json();
  if(!r.ok)throw new Error(d.error||"Unable to load assignments");
  setAssignments(d.assignments||[]);
 }
 useEffect(()=>{load().catch(e=>setError(e.message))},[]);
 useEffect(()=>{if(me?.globalRole==="admin")loadAssignments().catch(e=>setError(e.message))},[eventId,me]);
 async function create(e){
  e.preventDefault();setError("");
  const r=await fetch("/api/auth/accounts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}),d=await r.json();
  if(!r.ok){setError(d.error||"Unable to create account");return}
  setAccounts(x=>[d.account,...x]);setForm({name:"",email:"",password:"",globalRole:"viewer"});
 }
 async function update(id,patch){
  const r=await fetch("/api/auth/accounts",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,...patch})}),d=await r.json();
  if(!r.ok){setError(d.error||"Unable to update account");return}
  setAccounts(x=>x.map(a=>a.id===id?d.account:a));
 }
 async function assign(email){
  const role=prompt("Role: organizer, judge, or viewer","judge");if(!role)return;
  const r=await fetch("/api/auth/event-roles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId,email,role})}),d=await r.json();
  if(!r.ok){setError(d.error||"Unable to assign role");return}
  setAssignments(x=>[...x.filter(a=>a.id!==d.assignment.id),d.assignment]);
 }
 async function remove(id){
  const r=await fetch("/api/auth/event-roles?id="+id,{method:"DELETE"}),d=await r.json();
  if(!r.ok){setError(d.error||"Unable to remove assignment");return}
  setAssignments(x=>x.filter(a=>a.id!==id));
 }
 if(!me)return <main className="dashboardPage"><div className="eventEmpty">Loading access control…</div></main>;
 if(me.globalRole!=="admin")return <main className="dashboardPage"><div className="eventEmpty"><strong>Access denied.</strong><span>{error}</span></div></main>;
 return <main className="dashboardPage"><div className="dashShell"><section className="workspace" style={{padding:"32px",maxWidth:1100}}>
  <div className="workspaceTop"><div className="workspaceTitle"><div className="workspaceEyebrow">EVENTRA / SECURITY</div><h1>Access Control Center</h1><p>Accounts, roles and event assignments.</p></div><a href="/dashboard">← Dashboard</a></div>
  {error&&<div className="formError">{error}</div>}
  <div className="resourcePanel"><div className="resourceHeader"><div><small>USER MANAGEMENT</small><h2>Create account</h2><p>Admin creates real user accounts.</p></div></div>
   <form className="inlineForm" onSubmit={create}><input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/><input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/><input type="password" placeholder="Password (8+)" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} minLength="8" required/><select value={form.globalRole} onChange={e=>setForm({...form,globalRole:e.target.value})}><option value="organizer">Organizer</option><option value="judge">Judge</option><option value="viewer">Viewer</option><option value="admin">Admin</option></select><button>Create account</button></form>
  </div>
  <div className="resourcePanel"><div className="resourceHeader"><div><small>ACCOUNTS</small><h2>Users</h2><p>Enable, disable or change a user's global role.</p></div></div>
   <div className="resourceList">{accounts.map(a=><div className="resourceRow" key={a.id}><div><strong>{a.name}</strong><span>{a.email} · {a.global_role} · {a.active?"Active":"Disabled"}</span></div><div><button onClick={()=>update(a.id,{active:!a.active})}>{a.active?"Disable":"Enable"}</button><select value={a.global_role} onChange={e=>update(a.id,{globalRole:e.target.value})}><option value="admin">Admin</option><option value="organizer">Organizer</option><option value="judge">Judge</option><option value="viewer">Viewer</option></select></div></div>)}</div>
  </div>
  <div className="resourcePanel"><div className="resourceHeader"><div><small>EVENT ACCESS</small><h2>Assignments</h2><p>Assign a user to one event without exposing other events.</p></div></div>
   <select value={eventId} onChange={e=>setEventId(e.target.value)}><option value="">Select event</option>{events.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select>
   {eventId&&<div className="resourceList">{accounts.filter(a=>a.active&&a.global_role!=="admin").map(a=><div className="resourceRow" key={a.id}><div><strong>{a.name}</strong><span>{a.email}</span></div><button onClick={()=>assign(a.email)}>Assign / change role</button></div>)}</div>}
   <div className="resourceList">{assignments.map(a=><div className="resourceRow" key={a.id}><div><strong>{a.email}</strong><span>{a.role} · {a.active?"Active":"Inactive"}</span></div><button onClick={()=>remove(a.id)}>Remove</button></div>)}</div>
  </div>
  <div className="resourcePanel"><div className="resourceHeader"><div><small>PERMISSION VERIFICATION</small><h2>Effective permissions</h2><p>Admin: full access. Organizer: assigned event management and result verification/publishing. Judge: assigned programmes and score submission. Viewer: read-only assigned event.</p></div></div></div>
 </section></div></main>;
}
