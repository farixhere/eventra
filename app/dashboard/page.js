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
const emptyJudge = { name: "", email: "" };

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
  const [judges, setJudges] = useState([]);
  const [scheduleForm, setScheduleForm] = useState(emptySchedule);
  const [resultForm, setResultForm] = useState(emptyResult);
  const [judgeForm, setJudgeForm] = useState(emptyJudge);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [venueForm, setVenueForm] = useState(emptyVenue);
  const [teamForm, setTeamForm] = useState(emptyTeam);
  const [participantForm, setParticipantForm] = useState(emptyParticipant);
  const [programmeForm, setProgrammeForm] = useState(emptyProgramme);
  const [registrationForm, setRegistrationForm] = useState(emptyRegistration);
  const [open, setOpen] = useState(false);
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
      if (section === "judges") setJudges(data.judges || []);
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

  async function createEvent(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(eventForm) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create event");
      setEvents((current) => [data.event, ...current]); setSelectedId(data.event.id); setEventForm(emptyEvent); setOpen(false); setSection("events");
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
    if (!window.confirm('Delete "' + name + '"? This will also delete its venues, teams, participants, programmes, schedules, judges, scores, results, and announcements.')) return;
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
  const judgeCount = judges.length;
  const nav = [["events","Events"],["venues","Venues"],["teams","Teams"],["participants","Participants"],["programmes","Programmes"],["registrations","Registrations"],["schedules","Schedules"],["judges","Judges"],["results","Results"],["certificates","Certificates"]];

  return (
    <main className="dashboardPage">
      <header className="dashNav"><Link className="brand" href="/">eventra<span>.</span></Link><div><span className="statusDot"></span> Workspace</div><Link href="/">← Website</Link></header>
      <div className="dashShell">
        <aside className="sideNav"><small>WORKSPACE</small>{nav.map(([key,label]) => <button key={key} className={section === key ? "selected" : ""} onClick={() => setSection(key)}>{label}</button>)}<small className="space">SYSTEM</small><button>Settings</button></aside>
        <section className="workspace">
          <div className="workspaceTop"><div><small>EVENT WORKSPACE</small><h1>{selectedEvent(events, selectedId)?.name || "Good afternoon."}</h1><p>{selectedEvent(events, selectedId) ? formatDate(selectedEvent(events, selectedId).start_date) + " · " + (selectedEvent(events, selectedId).location || "Location not set") : "Your event workspace is ready."}</p></div><button onClick={() => { setError(""); setOpen(true); }}>+ New event</button></div>
          {error && <div className="formError">{error}</div>}
          <div className="statGrid"><div className="stat"><small>Active events</small><strong>{events.filter((event) => event.status === "live").length.toString().padStart(2,"0")}</strong><span>{events.length} total events</span></div><div className="stat"><small>Participants</small><strong>{participantCount.toLocaleString()}</strong><span>In selected event</span></div><div className="stat"><small>Programmes</small><strong>{programmeCount}</strong><span>Coming next</span></div><div className="stat"><small>Results</small><strong>{resultCount}</strong><span>Published</span></div></div>
          {events.length > 0 && <div className="eventSelector"><label>MANAGING EVENT<select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label></div>}

          {section === "events" && <div className="eventPanel"><div className="panelTop"><h2>Recent events</h2><button onClick={loadEvents}>Refresh →</button></div>{loading ? <div className="eventEmpty">Loading your events…</div> : events.length === 0 ? <div className="eventEmpty"><strong>No events yet.</strong><span>Create your first event to start building Eventra.</span><button onClick={() => setOpen(true)}>+ Create your first event</button></div> : events.map((event) => <button className={"eventRow eventRowButton " + (event.id === selectedId ? "eventRowActive" : "")} key={event.id} onClick={() => setSelectedId(event.id)}><div><strong>{event.name}</strong><span>{formatDate(event.start_date)} · {event.location || "Location not set"}</span></div><span className={"pill " + (event.status === "live" ? "live" : "")}>{event.status}</span><span className="eventDelete" role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); removeEvent(event.id, event.name); }}>Delete</span><span className="rowArrow">→</span></button>)}</div>}

          {section !== "events" && !selectedEvent(events, selectedId) && <div className="eventEmpty"><strong>Create an event first.</strong><span>Resources belong to an event.</span></div>}

          {section === "venues" && selectedEvent(events, selectedId) && <ResourcePanel title="Venues" count={venues.length} hint="Where programmes happen." loading={loadingSection}><form className="inlineForm" onSubmit={(e) => { e.preventDefault(); createResource("venues", venueForm, () => setVenueForm(emptyVenue)); }}><input value={venueForm.name} onChange={(e) => setVenueForm({...venueForm,name:e.target.value})} placeholder="Venue name" required /><input value={venueForm.location} onChange={(e) => setVenueForm({...venueForm,location:e.target.value})} placeholder="Building / location" /><input type="number" min="1" value={venueForm.capacity} onChange={(e) => setVenueForm({...venueForm,capacity:e.target.value})} placeholder="Capacity" /><button disabled={saving}>+ Add venue</button></form><ResourceList items={venues} kind="venues" empty="No venues added yet." onDelete={removeResource} render={(item) => <><strong>{item.name}</strong><span>{item.location || "Location not set"} {item.capacity ? "· " + item.capacity + " capacity" : ""}</span></>} /></ResourcePanel>}

          {section === "teams" && selectedEvent(events, selectedId) && <ResourcePanel title="Teams" count={teams.length} hint="Groups competing in this event." loading={loadingSection}><form className="inlineForm" onSubmit={(e) => { e.preventDefault(); createResource("teams", teamForm, () => setTeamForm(emptyTeam)); }}><input value={teamForm.name} onChange={(e) => setTeamForm({...teamForm,name:e.target.value})} placeholder="Team name" required /><input value={teamForm.code} onChange={(e) => setTeamForm({...teamForm,code:e.target.value})} placeholder="Short code (optional)" /><button disabled={saving}>+ Add team</button></form><ResourceList items={teams} kind="teams" empty="No teams added yet." onDelete={removeResource} render={(item) => <><strong>{item.name}</strong><span>{item.code || "No code"}</span></>} /></ResourcePanel>}

          {section === "programmes" && selectedEvent(events, selectedId) && <ResourcePanel title="Programmes" count={programmes.length} hint="Competitions and activities in this event." loading={loadingSection}>
            <form className="programmeForm" onSubmit={(e) => { e.preventDefault(); createResource("programmes", programmeForm, () => setProgrammeForm(emptyProgramme)); }}>
              <input value={programmeForm.name} onChange={(e) => setProgrammeForm({...programmeForm,name:e.target.value})} placeholder="Programme name" required />
              <input value={programmeForm.category} onChange={(e) => setProgrammeForm({...programmeForm,category:e.target.value})} placeholder="Category" />
              <select value={programmeForm.type} onChange={(e) => setProgrammeForm({...programmeForm,type:e.target.value})}><option value="individual">Individual</option><option value="team">Team</option></select>
              <input type="number" min="1" value={programmeForm.maxParticipants} onChange={(e) => setProgrammeForm({...programmeForm,maxParticipants:e.target.value})} placeholder="Max participants" />
              <button disabled={saving}>+ Add programme</button>
            </form>
            <ResourceList items={programmes} kind="programmes" empty="No programmes added yet." onDelete={removeResource} render={(item) => <><strong>{item.name}</strong><span>{item.category || "General"} · {item.type} {item.max_participants ? "· max " + item.max_participants : ""}</span></>} />
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

          {section === "judges" && selectedEvent(events, selectedId) && <ResourcePanel title="Judges" count={judges.length} hint="Officials who can score programmes in this event." loading={loadingSection}>
            <form className="judgeForm" onSubmit={(e) => { e.preventDefault(); createResource("judges", judgeForm, () => setJudgeForm(emptyJudge)); }}>
              <input value={judgeForm.name} onChange={(e) => setJudgeForm({...judgeForm,name:e.target.value})} placeholder="Judge name" required />
              <input type="email" value={judgeForm.email} onChange={(e) => setJudgeForm({...judgeForm,email:e.target.value})} placeholder="Email (optional)" />
              <button disabled={saving}>{saving ? "Adding…" : "+ Add judge"}</button>
            </form>
            <ResourceList items={judges} kind="judges" empty="No judges added yet." onDelete={removeResource} render={(item) => <><strong>{item.name}</strong><span>{item.email || "No email added"}</span></>} />
          </ResourcePanel>}

          {section === "results" && selectedEvent(events, selectedId) && <div className="resultPanel">
            <div className="resultHeader"><div><small>EVENT MANAGEMENT</small><h2>Results</h2><p>Record positions, scores and publish the final standings.</p></div><div className="resultHeaderMeta"><strong>{resultCount.toString().padStart(2,"0")}</strong><span>published</span></div></div>
            <form className="resultForm" onSubmit={(e) => { e.preventDefault(); createResource("results", resultForm, () => setResultForm(emptyResult)); }}>
              <div className="resultField"><label>Programme</label><select value={resultForm.programmeId} onChange={(e) => { const programmeId=e.target.value; setResultForm({...resultForm,programmeId,participantId:"",teamId:""}); }} required><option value="">Choose programme</option>{programmes.map((p)=><option key={p.id} value={p.id}>{p.name} · {p.type}</option>)}</select></div>
              <div className="resultField"><label>Entry</label>{programmes.find((p)=>p.id===resultForm.programmeId)?.type === "team" ? <select value={resultForm.teamId} onChange={(e)=>setResultForm({...resultForm,teamId:e.target.value})} required><option value="">Choose team</option>{teams.map((t)=><option key={t.id} value={t.id}>{t.name}</option>)}</select> : <select value={resultForm.participantId} onChange={(e)=>setResultForm({...resultForm,participantId:e.target.value})} required><option value="">Choose participant</option>{participants.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select>}</div>
              <div className="resultField"><label>Position</label><input type="number" min="1" value={resultForm.position} onChange={(e)=>setResultForm({...resultForm,position:e.target.value})} placeholder="1" required /></div>
              <div className="resultField"><label>Total score</label><input type="number" min="0" step="0.01" value={resultForm.totalScore} onChange={(e)=>setResultForm({...resultForm,totalScore:e.target.value})} placeholder="0" /></div>
              <div className="resultField"><label>Points</label><input type="number" min="0" step="0.01" value={resultForm.points} onChange={(e)=>setResultForm({...resultForm,points:e.target.value})} placeholder="0" /></div>
              <label className="resultPublish"><input type="checkbox" checked={resultForm.published} onChange={(e)=>setResultForm({...resultForm,published:e.target.checked})} /> Publish</label>
              <button disabled={saving}>{saving ? "Saving…" : "+ Add result"}</button>
            </form>
            {loadingSection ? <div className="eventEmpty">Loading results…</div> : !results.length ? <div className="eventEmpty"><strong>No results yet.</strong><span>Add a result after judging is complete for a programme.</span></div> : <div className="resultList">
              {results.map((item) => <div className="resultRow" key={item.id}>
                <div className="resultPosition"><strong>#{item.position}</strong><span>{item.published ? "Published" : "Draft"}</span></div>
                <div className="resultInfo"><strong>{item.entry_name}</strong><span>{item.programme_name}{item.team_name ? " · " + item.team_name : ""}</span></div>
                <div className="resultScore"><strong>{item.total_score ?? "—"}</strong><span>{item.points ?? "0"} pts</span></div>
                <button className="resultDelete" onClick={() => removeResource("results", item.id)}>Delete</button>
              </div>)}
            </div>}
          </div>}

          {section === "participants" && selectedEvent(events, selectedId) && <ResourcePanel title="Participants" count={participants.length} hint="People taking part in this event." loading={loadingSection}><form className="participantForm" onSubmit={(e) => { e.preventDefault(); createResource("participants", participantForm, () => setParticipantForm(emptyParticipant)); }}><input value={participantForm.name} onChange={(e) => setParticipantForm({...participantForm,name:e.target.value})} placeholder="Full name" required /><input type="email" value={participantForm.email} onChange={(e) => setParticipantForm({...participantForm,email:e.target.value})} placeholder="Email (optional)" /><input value={participantForm.phone} onChange={(e) => setParticipantForm({...participantForm,phone:e.target.value})} placeholder="Phone (optional)" /><select value={participantForm.teamId} onChange={(e) => setParticipantForm({...participantForm,teamId:e.target.value})}><option value="">No team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select><input value={participantForm.participantCode} onChange={(e) => setParticipantForm({...participantForm,participantCode:e.target.value})} placeholder="Code (auto if blank)" /><button disabled={saving}>+ Add participant</button></form><ResourceList items={participants} kind="participants" empty="No participants added yet." onDelete={removeResource} render={(item) => <><strong>{item.name}</strong><span>{item.participant_code} {item.team_name ? "· " + item.team_name : "· No team"}</span></>} /></ResourcePanel>}
        </section>
      </div>

      {open && <div className="modalBackdrop" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}><div className="eventModal"><div className="modalHeader"><div><small>NEW EVENT</small><h2>Create an event</h2></div><button className="modalClose" onClick={() => setOpen(false)} aria-label="Close">×</button></div><form onSubmit={createEvent}><label>Event name<input name="name" value={eventForm.name} onChange={(e) => setEventForm({...eventForm,name:e.target.value})} placeholder="e.g. Verve '27" required /></label><label>Description<textarea name="description" value={eventForm.description} onChange={(e) => setEventForm({...eventForm,description:e.target.value})} placeholder="What is this event about?" rows="3" /></label><div className="formGrid"><label>Start date<input type="date" name="startDate" value={eventForm.startDate} onChange={(e) => setEventForm({...eventForm,startDate:e.target.value})} /></label><label>End date<input type="date" name="endDate" value={eventForm.endDate} onChange={(e) => setEventForm({...eventForm,endDate:e.target.value})} /></label></div><label>Location<input name="location" value={eventForm.location} onChange={(e) => setEventForm({...eventForm,location:e.target.value})} placeholder="Campus / venue / city" /></label><div className="modalActions"><button type="button" onClick={() => setOpen(false)}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Creating…" : "Create event →"}</button></div></form></div></div>}
    </main>
  );
}

function selectedEvent(events, id) { return events.find((event) => event.id === id) || null; }
function ResourcePanel({ title, count, hint, loading, children }) { return <div className="resourcePanel"><div className="resourceHeader"><div><small>EVENT MANAGEMENT</small><h2>{title}</h2><p>{hint}</p></div><span className="resourceCount">{count}</span></div>{children}{loading && <div className="eventEmpty">Loading…</div>}</div>; }
function ResourceList({ items, kind, empty, onDelete, render }) { if (!items.length) return <div className="eventEmpty">{empty}</div>; return <div className="resourceList">{items.map((item) => <div className="resourceRow" key={item.id}><div>{render(item)}</div><button onClick={() => onDelete(kind, item.id)}>Delete</button></div>)}</div>; }
