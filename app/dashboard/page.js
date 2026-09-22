"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const emptyForm = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  location: ""
};

function formatDate(value) {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadEvents() {
    try {
      setLoading(true);
      const response = await fetch("/api/events", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load events");
      setEvents(data.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function createEvent(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create event");

      setEvents((current) => [data.event, ...current]);
      setForm(emptyForm);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const participantCount = 0;
  const programmeCount = 0;
  const resultCount = 0;

  return (
    <main className="dashboardPage">
      <header className="dashNav">
        <Link className="brand" href="/">eventra<span>.</span></Link>
        <div><span className="statusDot"></span> Workspace</div>
        <Link href="/">← Website</Link>
      </header>

      <div className="dashShell">
        <aside className="sideNav">
          <small>WORKSPACE</small>
          <a className="selected">Overview</a><a>Events</a><a>Programmes</a><a>Participants</a>
          <a>Schedules</a><a>Results</a><a>Certificates</a>
          <small className="space">SYSTEM</small><a>Settings</a>
        </aside>

        <section className="workspace">
          <div className="workspaceTop">
            <div>
              <small>MONDAY, SEPTEMBER 22</small>
              <h1>Good afternoon.</h1>
              <p>Your event workspace is ready.</p>
            </div>
            <button onClick={() => { setError(""); setOpen(true); }}>+ New event</button>
          </div>

          {error && <div className="formError">{error}</div>}

          <div className="statGrid">
            <div className="stat"><small>Active events</small><strong>{events.filter((event) => event.status === "live").length.toString().padStart(2, "0")}</strong><span>{events.length} total events</span></div>
            <div className="stat"><small>Participants</small><strong>{participantCount.toLocaleString()}</strong><span>Across all events</span></div>
            <div className="stat"><small>Programmes</small><strong>{programmeCount}</strong><span>Across all events</span></div>
            <div className="stat"><small>Results</small><strong>{resultCount}</strong><span>Published</span></div>
          </div>

          <div className="eventPanel">
            <div className="panelTop"><h2>Recent events</h2><button onClick={loadEvents}>Refresh →</button></div>
            {loading ? (
              <div className="eventEmpty">Loading your events…</div>
            ) : events.length === 0 ? (
              <div className="eventEmpty">
                <strong>No events yet.</strong>
                <span>Create your first event to start building Eventra.</span>
                <button onClick={() => setOpen(true)}>+ Create your first event</button>
              </div>
            ) : (
              events.map((event) => (
                <div className="eventRow" key={event.id}>
                  <div>
                    <strong>{event.name}</strong>
                    <span>{formatDate(event.start_date)} · {event.location || "Location not set"}</span>
                  </div>
                  <span className={"pill " + (event.status === "live" ? "live" : "")}>{event.status}</span>
                  <span className="rowArrow">→</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {open && (
        <div className="modalBackdrop" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <div className="eventModal">
            <div className="modalHeader">
              <div><small>NEW EVENT</small><h2>Create an event</h2></div>
              <button className="modalClose" onClick={() => setOpen(false)} aria-label="Close">×</button>
            </div>

            <form onSubmit={createEvent}>
              <label>Event name<input name="name" value={form.name} onChange={updateField} placeholder="e.g. Verve '27" required /></label>
              <label>Description<textarea name="description" value={form.description} onChange={updateField} placeholder="What is this event about?" rows="3" /></label>
              <div className="formGrid">
                <label>Start date<input type="date" name="startDate" value={form.startDate} onChange={updateField} /></label>
                <label>End date<input type="date" name="endDate" value={form.endDate} onChange={updateField} /></label>
              </div>
              <label>Location<input name="location" value={form.location} onChange={updateField} placeholder="Campus / venue / city" /></label>
              <div className="modalActions">
                <button type="button" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" disabled={saving}>{saving ? "Creating…" : "Create event →"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
