"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const emptyEvent = { name: "", description: "", startDate: "", endDate: "", location: "" };
const emptyVenue = { name: "", location: "", capacity: "" };
const emptyTeam = { name: "", code: "" };
const emptyParticipant = { name: "", email: "", phone: "", participantCode: "", teamId: "" };
const emptyProgramme = { name: "", category: "", type: "individual", maxParticipants: "" };
const emptyRegistration = { programmeId: "", participantId: "", teamId: "" };
const emptySchedule = { programmeId: "", venueId: "", startsAt: "", endsAt: "" };
const emptyResult = { programmeId: "", participantId: "", teamId: "", position: "", totalScore: "", points: "", published: false };
const emptyAnnouncement = { title: "", body: "" };
const emptyDownload = { title: "", description: "", fileUrl: "", fileType: "FILE" };
const emptyMedia = { fileName: "", fileUrl: "", fileType: "image", category: "gallery", caption: "" };

function formatDate(value) {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "2-digit", year: "numeric" }).format(new Date(value));
}

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [section, setSection] = useState("events");
  const [venues, setVenues] = useState([]);
  const [teams, setTeams] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [results, setResults] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [idCards, setIdCards] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [media, setMedia] = useState([]);
  const [messages, setMessages] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncement);
  const [downloadForm, setDownloadForm] = useState(emptyDownload);
  const [mediaForm, setMediaForm] = useState(emptyMedia);
  const [scheduleForm, setScheduleForm] = useState(emptySchedule);
  const [resultForm, setResultForm] = useState(emptyResult);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [venueForm, setVenueForm] = useState(emptyVenue);
  const [teamForm, setTeamForm] = useState(emptyTeam);
  const [participantForm, setParticipantForm] = useState(emptyParticipant);
  const [programmeForm, setProgrammeForm] = useState(emptyProgramme);
  const [registrationForm, setRegistrationForm] = useState(emptyRegistration);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [resultFormOpen, setResultFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingSection, setLoadingSection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadEvents() {
    try {
      setLoading(true);
      const response = await fetch("/api/events", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load events");
      const nextEvents = data.events || [];
      setEvents(nextEvents);
      if (!selectedId && nextEvents[0]) setSelectedId(nextEvents[0].id);
      if (selectedId && !nextEvents.some((event) => event.id === selectedId)) setSelectedId(nextEvents[0]?.id || "");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function loadSectionData(eventId = selectedId) {
    if (!eventId || section === "events") return;
    try {
      setLoadingSection(true);
      const response = await fetch("/api/" + section + "?eventId=" + eventId, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load " + section);
      if (section === "registrations") {
        const [programmesResponse, participantsResponse, teamsResponse] = await Promise.all([
          fetch("/api/programmes?eventId=" + eventId, { cache: "no-store" }),
          fetch("/api/participants?eventId=" + eventId, { cache: "no-store" }),
          fetch("/api/teams?eventId=" + eventId, { cache: "no-store" })
        ]);
        const [programmesData, participantsData, teamsData] = await Promise.all([programmesResponse.json(), participantsResponse.json(), teamsResponse.json()]);
        if (!programmesResponse.ok || !participantsResponse.ok || !teamsResponse.ok) throw new Error("Unable to load registration options");
        setProgrammes(programmesData.programmes || []);
        setParticipants(participantsData.participants || []);
        setTeams(teamsData.teams || []);
      }
      if (section === "venues") setVenues(data.venues || []);
      if (section === "teams") setTeams(data.teams || []);
      if (section === "participants") setParticipants(data.participants || []);
      if (section === "programmes") setProgrammes(data.programmes || []);
      if (section === "registrations") setRegistrations(data.registrations || []);
      if (section === "certificates") setCertificates(data.certificates || []);
      if (section === "id-cards") {
        setIdCards(data.cards || []);
        const participantsResponse = await fetch("/api/participants?eventId=" + eventId, { cache: "no-store" });
        const participantsData = await participantsResponse.json();
        if (!participantsResponse.ok) throw new Error(participantsData.error || "Unable to load ID card participants");
        setParticipants(participantsData.participants || []);
      }
      if (section === "announcements") setAnnouncements(data.announcements || []);
      if (section === "downloads") setDownloads(data.downloads || []);
      if (section === "media") setMedia(data.media || []);
      if (section === "contact") setMessages(data.messages || []);
      if (section === "results") {
        setResults(data.results || []);
        const [programmesResponse, participantsResponse, teamsResponse] = await Promise.all([
          fetch("/api/programmes?eventId=" + eventId, { cache: "no-store" }),
          fetch("/api/participants?eventId=" + eventId, { cache: "no-store" }),
          fetch("/api/teams?eventId=" + eventId, { cache: "no-store" })
        ]);
        const [programmesData, participantsData, teamsData] = await Promise.all([programmesResponse.json(), participantsResponse.json(), teamsResponse.json()]);
        if (!programmesResponse.ok || !participantsResponse.ok || !teamsResponse.ok) throw new Error("Unable to load result options");
        setProgrammes(programmesData.programmes || []);
        setParticipants(participantsData.participants || []);
        setTeams(teamsData.teams || []);
      }
      if (section === "schedules") {
        setSchedules(data.schedules || []);
        const [programmesResponse, venuesResponse] = await Promise.all([
          fetch("/api/programmes?eventId=" + eventId, { cache: "no-store" }),
          fetch("/api/venues?eventId=" + eventId, { cache: "no-store" })
        ]);
        const [programmesData, venuesData] = await Promise.all([programmesResponse.json(), venuesResponse.json()]);
        if (!programmesResponse.ok || !venuesResponse.ok) throw new Error("Unable to load schedule options");
        setProgrammes(programmesData.programmes || []);
        setVenues(venuesData.venues || []);
      }
    } catch (err) { setError(err.message); }
    finally { setLoadingSection(false); }
  }

  useEffect(() => { loadEvents(); }, []);
  useEffect(() => { loadSectionData(); }, [section, selectedId]);

  async function editEvent(item) {
    const name = window.prompt("Event name", item.name);
    if (name === null) return;
    const location = window.prompt("Location", item.location || "");
    if (location === null) return;
    const tagline = window.prompt("Tagline", item.tagline || "");
    if (tagline === null) return;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/events", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, name, location, tagline }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update event");
      await loadEvents();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  async function createEvent(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(eventForm) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create event");
      setEvents((current) => [data.event, ...current]); setSelectedId(data.event.id); setEventForm(emptyEvent); setEventModalOpen(false); setSection("events");
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  async function createResource(kind, form, reset) {
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/" + kind, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, eventId: selectedId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create " + kind.slice(0, -1));
      reset();
      await loadSectionData();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  async function removeEvent(id, name) {
    if (!window.confirm('Delete "' + name + '"? This will also delete all data belonging to the event.')) return;
    setError("");
    try {
      const response = await fetch("/api/events?id=" + id, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete event");
      const nextEvents = events.filter((event) => event.id !== id);
      setEvents(nextEvents);
      setSelectedId(nextEvents[0]?.id || "");
      setSection("events");
    } catch (err) { setError(err.message); }
  }


  async function togglePublished(kind, id, published) {
    setError("");
    try {
      const response = await fetch("/api/" + kind, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, published: !published }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update publication");
      await loadSectionData();
    } catch (err) { setError(err.message); }
  }

  async function printIdCard(card) {
    const participant = participants.find((item) => item.id === card.participant_id);
    const event = selectedEvent(events, selectedId);
    const popup = window.open("", "_blank", "width=800,height=600");
    if (!popup) return;
    popup.document.write("<!doctype html><html><head><title>ID Card - " + (participant?.name || card.participant_name || "Participant") + "</title><style>body{font-family:Arial,sans-serif;background:#111;color:#fff;padding:40px}.card{width:620px;margin:auto;padding:36px;border-radius:28px;background:#f5f5f0;color:#111;box-shadow:0 20px 60px #0005}.brand{font-size:14px;letter-spacing:3px;text-transform:uppercase}.name{font-size:42px;font-weight:800;margin:50px 0 10px}.meta{font-size:18px;line-height:1.7}.number{margin-top:35px;padding-top:20px;border-top:1px solid #bbb;font-family:monospace}.print{margin:30px auto;display:block;padding:14px 22px;border:0;border-radius:999px;background:#d7ff3f;font-weight:800}@media print{body{background:#fff;padding:0}.print{display:none}}</style></head><body><div class="card"><div class="brand">" + (event?.name || "EVENTRA") + "</div><div class="name">" + (participant?.name || card.participant_name || "Participant") + "</div><div class="meta">Participant ID: " + (participant?.participant_code || card.participant_code || "—") + "</div><div class="number">CARD " + card.card_number + "</div></div><button class="print" onclick="window.print()">Print / Save as PDF</button></body></html>");
    popup.document.close();
  }

  async function editResource(kind, item) {
    const fields = kind === "venues"
      ? { name: window.prompt("Venue name", item.name) ?? item.name, location: window.prompt("Location", item.location || "") ?? (item.location || ""), capacity: window.prompt("Capacity", item.capacity || "") ?? (item.capacity || "") }
      : kind === "teams"
        ? { name: window.prompt("Team name", item.name) ?? item.name, code: window.prompt("Team code", item.code || "") ?? (item.code || "") }
        : kind === "participants"
          ? { name: window.prompt("Participant name", item.name) ?? item.name, email: window.prompt("Email", item.email || "") ?? (item.email || ""), phone: window.prompt("Phone", item.phone || "") ?? (item.phone || "") }
          : kind === "programmes"
            ? { name: window.prompt("Programme name", item.name) ?? item.name, category: window.prompt("Category", item.category || "") ?? (item.category || ""), maxParticipants: window.prompt("Maximum participants", item.max_participants || "") ?? (item.max_participants || "") }
            : null;
    if (!fields) return;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/" + kind, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, ...fields }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update " + kind);
      await loadSectionData();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  async function removeResource(kind, id) {
    if (!window.confirm("Delete this " + kind.slice(0, -1) + "?")) return;
    setError("");
    try {
      const response = await fetch("/api/" + kind + "?id=" + id, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete item");
      await loadSectionData();
    } catch (err) { setError(err.message); }
  }

  const participantCount = participants.length;
  const programmeCount = programmes.length;
  const resultCount = results.filter((item) => item.published).length;
  const registrationCount = registrations.length;
  const scheduleCount = schedules.length;
  const certificateCount = certificates.length;
  const idCardCount = idCards.length;
  const nav = [["events","Events"],["venues","Venues"],["teams","Teams"],["participants","Participants"],["programmes","Programmes"],["registrations","Registrations"],["schedules","Schedules"],["results","Results"],["certificates","Certificates"],["id-cards","ID Cards"],["announcements","Announcements"],["downloads","Downloads"],["media","Gallery"],["contact","Contact"]];

  return (
    <main className="dashboardPage">
      <div className="dashShell">
        <aside className="sideNav">
  <div className="sideBrand"><Link href="/" className="sideBrandLogo">eventra<span>.</span></Link></div>
  <div className="sideBrand"><span className="sideBrandMark">e</span><div><strong>Eventra</strong><small>EVENT CONTROL</small></div></div>
  <small>EVENT SETUP</small>
  {nav.slice(0,5).map(([key,label]) => <button key={key} className={section === key ? "selected" : ""} onClick={() => setSection(key)}><span>{label}</span>{key === "events" ? <b>⌂</b> : key === "venues" ? <b>⌁</b> : key === "teams" ? <b>◌</b> : key === "participants" ? <b>◎</b> : <b>▦</b>}</button>)}
  <small className="space">OPERATIONS</small>
  {nav.slice(5,7).map(([key,label]) => <button key={key} className={section === key ? "selected" : ""} onClick={() => setSection(key)}><span>{label}</span><b>{key === "registrations" ? "↳" : key === "schedules" ? "◷" : "✦"}</b></button>)}
  <small className="space">RESULTS & DOCUMENTS</small>
  {nav.slice(7).map(([key,label]) => <button key={key} type="button" className={section === key ? "selected" : ""} onClick={() => setSection(key)}><span>{label}</span><b>{key === "results" ? "◈" : key === "certificates" ? "▤" : key === "id-cards" ? "▣" : "□"}</b></button>)}
  <div className="sideBottom"><button>⚙ <span>Settings</span></button><Link href="/">↗ <span>View website</span></Link><button type="button" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/admin-login"; }}>↪ <span>Sign out</span></button></div>
</aside>
        <section className="workspace">
          <div className="workspaceTop">
  <div className="workspaceTitle">
    <div className="workspaceEyebrow"><span className="livePulse"></span> EVENT CONTROL CENTER</div>
    <h1>{selectedEvent(events, selectedId)?.name || "Welcome to Eventra"}</h1>
    <p>{selectedEvent(events, selectedId) ? formatDate(selectedEvent(events, selectedId).start_date) + " · " + (selectedEvent(events, selectedId).location || "Location not set") : "Create an event and start building your festival."}</p>
  </div>
  <div className="workspaceActions">
    {selectedEvent(events, selectedId) && <a href={"/event/" + selectedEvent(events, selectedId).slug} target="_blank" rel="noreferrer">View public site ↗</a>}
    <button onClick={() => { setError(""); setEventModalOpen(true); }}>+ New event</button>
    {selectedEvent(events, selectedId) && <button onClick={async()=>{setSaving(true);setError("");try{const event=selectedEvent(events,selectedId);const response=await fetch("/api/events",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:event.id,isPublic:!event.is_public,status:!event.is_public?"live":"draft"})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to update publication");setEvents(events.map(x=>x.id===event.id?data.event:x));}catch(err){setError(err.message)}finally{setSaving(false)}}}>{selectedEvent(events,selectedId).is_public?"Unpublish site":"Publish site"} ↗</button>}
  </div>
</div>
          {error && <div className="formError">{error}</div>}
          <div className="statGrid">
  <div className="stat statAccent"><small>Events</small><strong>{events.length.toString().padStart(2,"0")}</strong><span>{events.filter((event) => event.status === "live").length} live now</span></div>
  <div className="stat"><small>Participants</small><strong>{participantCount.toLocaleString()}</strong><span>Registered in event</span></div>
  <div className="stat"><small>Programmes</small><strong>{programmeCount}</strong><span>Programmes & activities</span></div>
  <div className="stat"><small>Published results</small><strong>{resultCount}</strong><span>Ready for public view</span></div>
</div>
{selectedEvent(events, selectedId) && <div className="commandStrip">
  <div><span className="commandIcon">✦</span><div><strong>Event command center</strong><span>Manage the festival from setup to published information.</span></div></div>
  <div className="commandActions">
    <button onClick={() => setSection("programmes")}>+ Programme</button>
    <button onClick={() => setSection("participants")}>+ Participant</button>
    <button onClick={() => setSection("schedules")}>Build schedule →</button>
  </div>
</div>}
          {events.length > 0 && <div className="eventSelector"><label>MANAGING EVENT<select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label></div>}

          {section === "events" && <div className="eventPanel"><div className="panelTop"><div><small>YOUR FESTIVALS</small><h2>Recent events</h2></div><button onClick={loadEvents}>Refresh →</button></div>{loading ? <div className="eventEmpty">Loading your events…</div> : events.length === 0 ? <div className="eventEmpty"><strong>No events yet.</strong><span>Create your first event to start building Eventra.</span><button onClick={() => setEventModalOpen(true)}>+ Create your first event</button></div> : events.map((event) => <div className={"eventRow eventRowButton " + (event.id === selectedId ? "eventRowActive" : "")} key={event.id} onClick={() => setSelectedId(event.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedId(event.id); }}><div><strong>{event.name}</strong><span>{formatDate(event.start_date)} · {event.location || "Location not set"}</span></div><span className={"pill " + (event.status === "live" ? "live" : "")}>{event.status}</span><a className="eventPublicLink" href={"/event/" + event.slug} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>View site ↗</a><button type="button" className="eventEdit" onClick={(e) => { e.stopPropagation(); editEvent(event); }}>Edit</button><button type="button" className="eventDelete" role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); removeEvent(event.id, event.name); }}>Delete</button><span className="rowArrow">→</span></div>)}</div>}

          {section !== "events" && !selectedEvent(events, selectedId) && <div className="eventEmpty"><strong>Create an event first.</strong><span>Resources belong to an event.</span></div>}

          {section === "venues" && selectedEvent(events, selectedId) && <ResourcePanel title="Venues" count={venues.length} hint="Where programmes happen." loading={loadingSection}><form className="inlineForm" onSubmit={(e) => { e.preventDefault(); createResource("venues", venueForm, () => setVenueForm(emptyVenue)); }}><input value={venueForm.name} onChange={(e) => setVenueForm({...venueForm,name:e.target.value})} placeholder="Venue name" required /><input value={venueForm.location} onChange={(e) => setVenueForm({...venueForm,location:e.target.value})} placeholder="Building / location" /><input type="number" min="1" value={venueForm.capacity} onChange={(e) => setVenueForm({...venueForm,capacity:e.target.value})} placeholder="Capacity" /><button disabled={saving}>+ Add venue</button></form><ResourceList items={venues} kind="venues" empty="No venues added yet." onDelete={removeResource} onEdit={editResource} render={(item) => <><strong>{item.name}</strong><span>{item.location || "Location not set"} {item.capacity ? "· " + item.capacity + " capacity" : ""}</span></>} /></ResourcePanel>}

          {section === "teams" && selectedEvent(events, selectedId) && <ResourcePanel title="Teams" count={teams.length} hint="Groups participating in this event." loading={loadingSection}><form className="inlineForm" onSubmit={(e) => { e.preventDefault(); createResource("teams", teamForm, () => setTeamForm(emptyTeam)); }}><input value={teamForm.name} onChange={(e) => setTeamForm({...teamForm,name:e.target.value})} placeholder="Team name" required /><input value={teamForm.code} onChange={(e) => setTeamForm({...teamForm,code:e.target.value})} placeholder="Short code (optional)" /><button disabled={saving}>+ Add team</button></form><ResourceList items={teams} kind="teams" empty="No teams added yet." onDelete={removeResource} onEdit={editResource} render={(item) => <><strong>{item.name}</strong><span>{item.code || "No code"}</span></>} /></ResourcePanel>}

          {section === "programmes" && selectedEvent(events, selectedId) && <ResourcePanel title="Programmes" count={programmes.length} hint="Programmes and activities in this event." loading={loadingSection}>
            <form className="programmeForm" onSubmit={(e) => { e.preventDefault(); createResource("programmes", programmeForm, () => setProgrammeForm(emptyProgramme)); }}>
              <input value={programmeForm.name} onChange={(e) => setProgrammeForm({...programmeForm,name:e.target.value})} placeholder="Programme name" required />
              <input value={programmeForm.category} onChange={(e) => setProgrammeForm({...programmeForm,category:e.target.value})} placeholder="Category" />
              <select value={programmeForm.type} onChange={(e) => setProgrammeForm({...programmeForm,type:e.target.value})}><option value="individual">Individual</option><option value="team">Team</option></select>
              <input type="number" min="1" value={programmeForm.maxParticipants} onChange={(e) => setProgrammeForm({...programmeForm,maxParticipants:e.target.value})} placeholder="Max participants" />
              <button disabled={saving}>+ Add programme</button>
            </form>
            <ResourceList items={programmes} kind="programmes" empty="No programmes added yet." onDelete={removeResource} onEdit={editResource} render={(item) => <><strong>{item.name}</strong><span>{item.category || "General"} · {item.type} {item.max_participants ? "· max " + item.max_participants : ""}</span></>} />
          </ResourcePanel>}

          {section === "registrations" && selectedEvent(events, selectedId) && <ResourcePanel title="Registrations" count={registrations.length} hint="Connect participants or teams to programmes." loading={loadingSection}>
            <form className="registrationForm" onSubmit={(e) => { e.preventDefault(); createResource("registrations", registrationForm, () => setRegistrationForm(emptyRegistration)); }}>
              <select value={registrationForm.programmeId} onChange={(e) => { const programmeId=e.target.value; const programme=programmes.find((p)=>p.id===programmeId); setRegistrationForm({...registrationForm,programmeId,participantId:"",teamId:""}); }} required>
                <option value="">Select programme</option>{programmes.map((p)=><option key={p.id} value={p.id}>{p.name} · {p.type}</option>)}
              </select>
              {programmes.find((p)=>p.id===registrationForm.programmeId)?.type === "team" ? (
                <select value={registrationForm.teamId} onChange={(e)=>setRegistrationForm({...registrationForm,teamId:e.target.value})} required><option value="">Select team</option>{teams.map((t)=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
              ) : (
                <select value={registrationForm.participantId} onChange={(e)=>setRegistrationForm({...registrationForm,participantId:e.target.value})} required><option value="">Select participant</option>{participants.map((p)=><option key={p.id} value={p.id}>{p.name} · {p.participant_code}</option>)}</select>
              )}
              <button disabled={saving || !registrationForm.programmeId}>+ Register</button>
            </form>
            <ResourceList items={registrations} kind="registrations" empty="No registrations yet." onDelete={removeResource} render={(item) => <><strong>{item.programme_name}</strong><span>{item.programme_type === "team" ? item.team_name : item.participant_name} · {item.status}</span></>} />
          </ResourcePanel>}

          {section === "schedules" && selectedEvent(events, selectedId) && <div className="schedulePanel">
            <div className="scheduleHeader"><div><small>EVENT MANAGEMENT</small><h2>Schedule</h2><p>Build the running order for your event.</p></div><div className="scheduleHeaderMeta"><strong>{scheduleCount.toString().padStart(2,"0")}</strong><span>scheduled</span></div></div>
            <form className="scheduleForm" onSubmit={(e) => { e.preventDefault(); createResource("schedules", scheduleForm, () => setScheduleForm(emptySchedule)); }}>
              <div className="scheduleField"><label>Programme</label><select value={scheduleForm.programmeId} onChange={(e) => setScheduleForm({...scheduleForm,programmeId:e.target.value})} required><option value="">Choose programme</option>{programmes.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="scheduleField"><label>Venue</label><select value={scheduleForm.venueId} onChange={(e) => setScheduleForm({...scheduleForm,venueId:e.target.value})}><option value="">No venue</option>{venues.map((v)=><option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
              <div className="scheduleField"><label>Starts</label><input type="datetime-local" value={scheduleForm.startsAt} onChange={(e) => setScheduleForm({...scheduleForm,startsAt:e.target.value})} required /></div>
              <div className="scheduleField"><label>Ends</label><input type="datetime-local" value={scheduleForm.endsAt} onChange={(e) => setScheduleForm({...scheduleForm,endsAt:e.target.value})} required /></div>
              <button disabled={saving}>{saving ? "Adding…" : "+ Add to schedule"}</button>
            </form>
            {loadingSection ? <div className="eventEmpty">Loading schedule…</div> : !schedules.length ? <div className="eventEmpty"><strong>No schedule entries yet.</strong><span>Add your first programme to start building the event timetable.</span></div> : <div className="scheduleList">
              {schedules.map((item) => <div className="scheduleRow" key={item.id}>
                <div className="scheduleTime"><strong>{new Date(item.starts_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</strong><span>{new Date(item.ends_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span></div>
                <div className="scheduleInfo"><strong>{item.programme_name}</strong><span>{item.venue_name || "Venue not assigned"}{item.programme_category ? " · " + item.programme_category : ""}</span></div>
                <button className="scheduleDelete" onClick={() => removeResource("schedules", item.id)}>Delete</button>
              </div>)}
            </div>}
          </div>}

          {section === "certificates" && selectedEvent(events, selectedId) && <div className="certificatePanel">
            <div className="certificateHeader"><div><small>EVENT DOCUMENTS</small><h2>Certificates</h2><p>Prepare certificates from published event results.</p></div><div className="certificateHeaderMeta"><strong>{certificateCount.toString().padStart(2,"0")}</strong><span>eligible</span></div></div>
            {loadingSection ? <div className="eventEmpty">Loading certificates…</div> : !certificates.length ? <div className="eventEmpty"><strong>No certificates ready yet.</strong><span>Publish results first. Eligible participants and teams will appear here.</span></div> : <div className="certificateList">
              {certificates.map((item) => <div className="certificateRow" key={item.id}>
                <div className="certificateBadge">CERT</div>
                <div className="certificateInfo"><strong>{item.recipient_name}</strong><span>{item.programme_name}{item.team_name ? " · " + item.team_name : ""} · Position #{item.position}</span></div>
                <div className="certificateScore"><strong>{item.points ?? 0}</strong><span>points</span></div>
                <button className="certificateAction" type="button" onClick={async () => { setSaving(true); setError(""); try { const response = await fetch("/api/certificates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: selectedId, resultId: item.result_id, participantId: item.participant_id, teamId: item.team_id, title: item.programme_name + " — " + (item.recipient_name || "Participant"), certificateType: item.position === 1 ? "winner" : "achievement" }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to prepare certificate"); await loadSectionData(); } catch (err) { setError(err.message); } finally { setSaving(false); } }}>{item.certificate_number ? "Prepared" : "Prepare"}</button>
              </div>)}
            </div>}
          </div>}

          {section === "id-cards" && selectedEvent(events, selectedId) && <ResourcePanel title="ID Cards" count={idCards.length} hint="Create organiser-issued ID card records for event participants." loading={loadingSection}>
            <form className="inlineForm" onSubmit={(e) => { e.preventDefault(); createResource("id-cards", { participantId: e.currentTarget.participantId.value }, () => e.currentTarget.reset()); }}>
              <select name="participantId" required defaultValue="">
                <option value="">Select participant</option>
                {participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name} · {participant.participant_code}</option>)}
              </select>
              <button disabled={saving || !participants.length}>{saving ? "Creating…" : "+ Create ID card"}</button>
            </form>
            {!loadingSection && !idCards.length ? <div className="eventEmpty"><strong>No ID cards yet.</strong><span>Select a participant above to create the first organiser-issued ID card.</span></div> : <div className="resourceList">{idCards.map((card) => <div className="resourceRow" key={card.id}><div><strong>{card.participant_name}</strong><span>{card.card_number} · {card.participant_code}</span></div><div className="resourceActions"><button onClick={() => printIdCard(card)}>Print</button><button onClick={() => removeResource("id-cards", card.id)}>Delete</button></div></div>)}</div>}
          </ResourcePanel>}

          {section === "results" && selectedEvent(events, selectedId) && <div className="resultPanel">
            <div className="resultHeader"><div><small>MANUAL RESULTS</small><h2>Results</h2><p>Enter the final result yourself. Nothing is calculated automatically.</p></div><div className="resultHeaderTools"><div className="resultHeaderMeta"><strong>{resultCount.toString().padStart(2,"0")}</strong><span>published</span></div><button type="button" className="resultManualButton" onClick={() => setResultFormOpen((value) => !value)}>+ Manual result</button></div></div>
            {resultFormOpen && <form className="resultForm" onSubmit={async (e) => { e.preventDefault(); setSaving(true); setError(""); try { const response = await fetch("/api/results", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...resultForm, eventId: selectedId, published: false }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to create result"); setResultForm(emptyResult); setResultFormOpen(false); await loadSectionData(); } catch (err) { setError(err.message); } finally { setSaving(false); } }}>
              <div className="resultField"><label>Programme</label><select value={resultForm.programmeId} onChange={(e) => { const programmeId=e.target.value; setResultForm({...resultForm,programmeId,participantId:"",teamId:""}); }} required><option value="">Choose programme</option>{programmes.map((p)=><option key={p.id} value={p.id}>{p.name} · {p.type}</option>)}</select></div>
              <div className="resultField"><label>Entry</label>{programmes.find((p)=>p.id===resultForm.programmeId)?.type === "team" ? <select value={resultForm.teamId} onChange={(e)=>setResultForm({...resultForm,teamId:e.target.value})} required><option value="">Choose team</option>{teams.map((t)=><option key={t.id} value={t.id}>{t.name}</option>)}</select> : <select value={resultForm.participantId} onChange={(e)=>setResultForm({...resultForm,participantId:e.target.value})} required><option value="">Choose participant</option>{participants.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select>}</div>
              <div className="resultField"><label>Position</label><input type="number" min="1" value={resultForm.position} onChange={(e)=>setResultForm({...resultForm,position:e.target.value})} placeholder="1" required /></div>
              <div className="resultField"><label>Final score <span className="resultOptional">optional</span></label><input type="number" min="0" step="0.01" value={resultForm.totalScore} onChange={(e)=>setResultForm({...resultForm,totalScore:e.target.value})} placeholder="0" /></div>
              <div className="resultField"><label>Points <span className="resultOptional">optional</span></label><input type="number" min="0" step="0.01" value={resultForm.points} onChange={(e)=>setResultForm({...resultForm,points:e.target.value})} placeholder="0" /></div>
              <button disabled={saving}>{saving ? "Saving…" : "Save result"}</button>
            </form>}
            {loadingSection ? <div className="eventEmpty">Loading results…</div> : !results.length ? <div className="eventEmpty"><strong>No results yet.</strong><span>Click “Manual result” to add an official result, then publish it when ready.</span></div> : <div className="resultList">
              {results.map((item) => <div className="resultRow" key={item.id}>
                <div className="resultPosition"><strong>#{item.position}</strong><span>{item.published ? "Published" : "Draft"}</span></div>
                <div className="resultInfo"><strong>{item.entry_name}</strong><span>{item.programme_name}{item.team_name ? " · " + item.team_name : ""}</span></div>
                <div className="resultScore"><strong>{item.total_score ?? "—"}</strong><span>{item.points ?? "0"} pts</span></div>
                {!item.published && <button className="resultPublishButton" onClick={async () => { setSaving(true); setError(""); try { const response = await fetch("/api/results", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, published: true }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to publish result"); await loadSectionData(); } catch (err) { setError(err.message); } finally { setSaving(false); } }}>Publish</button>}
                {item.published && <span className="resultPublishedLabel">Live on website</span>}
                <button className="resultDelete" onClick={() => removeResource("results", item.id)}>Delete</button>
              </div>)}
            </div>}
          </div>}

          {section === "announcements" && selectedEvent(events, selectedId) && <ResourcePanel title="Announcements" count={announcements.length} hint="Publish updates to the live event wall." loading={loadingSection}>
            <form className="inlineForm" onSubmit={(e)=>{e.preventDefault();createResource("announcements",announcementForm,()=>setAnnouncementForm(emptyAnnouncement));}}>
              <input value={announcementForm.title} onChange={e=>setAnnouncementForm({...announcementForm,title:e.target.value})} placeholder="Announcement title" required />
              <input value={announcementForm.body} onChange={e=>setAnnouncementForm({...announcementForm,body:e.target.value})} placeholder="Write the announcement" required />
              <button disabled={saving}>+ Add announcement</button>
            </form>
            <ResourceList items={announcements} kind="announcements" empty="No announcements yet." onDelete={removeResource} onPublish={togglePublished} render={item=><><strong>{item.title}</strong><span>{item.published ? "Published" : "Draft"} · {item.body}</span></>} />
          </ResourcePanel>}

          {section === "downloads" && selectedEvent(events, selectedId) && <ResourcePanel title="Downloads" count={downloads.length} hint="Publish files and resources on the event website." loading={loadingSection}>
            <form className="inlineForm" onSubmit={(e)=>{e.preventDefault();createResource("downloads",downloadForm,()=>setDownloadForm(emptyDownload));}}>
              <input value={downloadForm.title} onChange={e=>setDownloadForm({...downloadForm,title:e.target.value})} placeholder="File title" required />
              <input value={downloadForm.fileUrl} onChange={e=>setDownloadForm({...downloadForm,fileUrl:e.target.value})} placeholder="File URL" required />
              <input value={downloadForm.description} onChange={e=>setDownloadForm({...downloadForm,description:e.target.value})} placeholder="Description" />
              <button disabled={saving}>+ Add file</button>
            </form>
            <ResourceList items={downloads} kind="downloads" empty="No downloads yet." onDelete={removeResource} onPublish={togglePublished} render={item=><><strong>{item.title}</strong><span>{item.published ? "Published" : "Draft"} · {item.file_type || "FILE"}</span></>} />
          </ResourcePanel>}

          {section === "media" && selectedEvent(events, selectedId) && <ResourcePanel title="Gallery" count={media.length} hint="Add media by URL, then publish it to the public gallery." loading={loadingSection}>
            <form className="inlineForm" onSubmit={(e)=>{e.preventDefault();createResource("media",mediaForm,()=>setMediaForm(emptyMedia));}}>
              <input value={mediaForm.fileName} onChange={e=>setMediaForm({...mediaForm,fileName:e.target.value})} placeholder="File name" required />
              <input value={mediaForm.fileUrl} onChange={e=>setMediaForm({...mediaForm,fileUrl:e.target.value})} placeholder="Image / media URL" required />
              <input value={mediaForm.caption} onChange={e=>setMediaForm({...mediaForm,caption:e.target.value})} placeholder="Caption" />
              <button disabled={saving}>+ Add media</button>
            </form>
            <ResourceList items={media} kind="media" empty="No media yet." onDelete={removeResource} onPublish={togglePublished} render={item=><><strong>{item.file_name}</strong><span>{item.published ? "Published" : "Draft"} · {item.caption || "No caption"}</span></>} />
          </ResourcePanel>}

          {section === "contact" && selectedEvent(events, selectedId) && <ResourcePanel title="Contact inbox" count={messages.length} hint="Review messages sent from the public event website." loading={loadingSection}>
            <ResourceList items={messages} kind="contact" empty="No contact messages yet." onDelete={removeResource} render={item=><><strong>{item.subject || "No subject"} · {item.name}</strong><span>{item.email} · {item.status} · {item.message}</span></>} />
          </ResourcePanel>}

          {section === "participants" && selectedEvent(events, selectedId) && <ResourcePanel title="Participants" count={participants.length} hint="People taking part in this event." loading={loadingSection}><form className="participantForm" onSubmit={(e) => { e.preventDefault(); createResource("participants", participantForm, () => setParticipantForm(emptyParticipant)); }}><input value={participantForm.name} onChange={(e) => setParticipantForm({...participantForm,name:e.target.value})} placeholder="Full name" required /><input type="email" value={participantForm.email} onChange={(e) => setParticipantForm({...participantForm,email:e.target.value})} placeholder="Email (optional)" /><input value={participantForm.phone} onChange={(e) => setParticipantForm({...participantForm,phone:e.target.value})} placeholder="Phone (optional)" /><select value={participantForm.teamId} onChange={(e) => setParticipantForm({...participantForm,teamId:e.target.value})}><option value="">No team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select><input value={participantForm.participantCode} onChange={(e) => setParticipantForm({...participantForm,participantCode:e.target.value})} placeholder="Code (auto if blank)" /><button disabled={saving}>+ Add participant</button></form><ResourceList items={participants} kind="participants" empty="No participants added yet." onDelete={removeResource} render={(item) => <><strong>{item.name}</strong><span>{item.participant_code} {item.team_name ? "· " + item.team_name : "· No team"}</span></>} /></ResourcePanel>}
        </section>
      </div>

      {eventModalOpen && <div className="modalBackdrop" onMouseDown={(event) => event.target === event.currentTarget && setEventModalOpen(false)}><div className="eventModal"><div className="modalHeader"><div><small>NEW EVENT</small><h2>Create an event</h2></div><button className="modalClose" onClick={() => setEventModalOpen(false)} aria-label="Close">×</button></div><form onSubmit={createEvent}><label>Event name<input name="name" value={eventForm.name} onChange={(e) => setEventForm({...eventForm,name:e.target.value})} placeholder="e.g. Verve '27" required /></label><label>Description<textarea name="description" value={eventForm.description} onChange={(e) => setEventForm({...eventForm,description:e.target.value})} placeholder="What is this event about?" rows="3" /></label><div className="formGrid"><label>Start date<input type="date" name="startDate" value={eventForm.startDate} onChange={(e) => setEventForm({...eventForm,startDate:e.target.value})} /></label><label>End date<input type="date" name="endDate" value={eventForm.endDate} onChange={(e) => setEventForm({...eventForm,endDate:e.target.value})} /></label></div><label>Location<input name="location" value={eventForm.location} onChange={(e) => setEventForm({...eventForm,location:e.target.value})} placeholder="Campus / venue / city" /></label><div className="modalActions"><button type="button" onClick={() => setEventModalOpen(false)}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Creating…" : "Create event →"}</button></div></form></div></div>}
    </main>
  );
}

function selectedEvent(events, id) { return events.find((event) => event.id === id) || null; }
function ResourcePanel({ title, count, hint, loading, children }) { return <div className="resourcePanel"><div className="resourceHeader"><div><small>EVENT MANAGEMENT</small><h2>{title}</h2><p>{hint}</p></div><span className="resourceCount">{count}</span></div>{children}{loading && <div className="eventEmpty">Loading…</div>}</div>; }
function ResourceList({ items, kind, empty, onDelete, onPublish, onEdit, render }) {
  if (!items.length) return <div className="eventEmpty">{empty}</div>;
  return <div className="resourceList">{items.map((item) => <div className="resourceRow" key={item.id}><div>{render(item)}</div><div className="resourceActions">{onEdit && <button onClick={() => onEdit(kind, item)}>Edit</button>}{typeof item.published === "boolean" && onPublish && <button onClick={() => onPublish(kind, item.id, item.published)}>{item.published ? "Unpublish" : "Publish"}</button>}<button onClick={() => onDelete(kind, item.id)}>Delete</button></div></div>)}</div>;
}
