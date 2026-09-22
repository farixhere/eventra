import { getDb } from "../../../lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }) {
  const { slug } = await params;
  const sql = getDb();
  const events = await sql`SELECT id, name, slug, description, starts_on, ends_on, location, status FROM events WHERE slug = ${slug} LIMIT 1`;
  if (!events.length) notFound();
  const event = events[0];

  const [programmes, schedules, announcements, results] = await Promise.all([
    sql`SELECT id, name, category, type, max_participants FROM programmes WHERE event_id = ${event.id} ORDER BY category NULLS LAST, name`,
    sql`SELECT s.id, s.starts_at, s.ends_at, p.name AS programme_name, p.category, v.name AS venue_name FROM schedules s JOIN programmes p ON p.id=s.programme_id LEFT JOIN venues v ON v.id=s.venue_id WHERE p.event_id=${event.id} ORDER BY s.starts_at LIMIT 12`,
    sql`SELECT id, title, body, published FROM announcements WHERE event_id=${event.id} AND published=true ORDER BY created_at DESC LIMIT 5`,
    sql`SELECT r.id,r.position,r.points,r.total_score,p.name AS programme_name,COALESCE(part.name,t.name) AS recipient_name,t.name AS team_name FROM results r JOIN programmes p ON p.id=r.programme_id LEFT JOIN participants part ON part.id=r.participant_id LEFT JOIN teams t ON t.id=r.team_id WHERE p.event_id=${event.id} AND r.published=true ORDER BY r.position,r.points DESC LIMIT 12`
  ]);

  return <main className="publicEvent">
    <nav className="publicNav"><a href="/">EVENTRA</a><div><a href="#programmes">Programmes</a><a href="#schedule">Schedule</a><a href="#results">Results</a></div></nav>
    <section className="publicHero">
      <span className="publicKicker">{event.status?.toUpperCase() || "EVENT"} · EVENTRA</span>
      <h1>{event.name}</h1>
      <p>{event.description || "A festival experience powered by Eventra."}</p>
      <div className="publicMeta"><span>📍 {event.location || "Venue to be announced"}</span><span>◷ {event.starts_on ? new Date(event.starts_on).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "Date to be announced"}{event.ends_on ? " — " + new Date(event.ends_on).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : ""}</span></div>
    </section>
    {announcements.length > 0 && <section className="publicSection"><div className="publicSectionTitle"><small>UPDATES</small><h2>Latest announcements</h2></div><div className="announcementGrid">{announcements.map(a=><article className="announcementCard" key={a.id}><small>ANNOUNCEMENT</small><h3>{a.title}</h3><p>{a.body}</p></article>)}</div></section>}
    <section id="programmes" className="publicSection"><div className="publicSectionTitle"><small>THE LINEUP</small><h2>Programmes</h2></div><div className="programmeGrid">{programmes.map(p=><article className="publicProgramme" key={p.id}><span>{p.category || "GENERAL"}</span><h3>{p.name}</h3><p>{p.type === "team" ? "Team event" : "Individual event"}</p></article>)}{!programmes.length && <p className="publicEmpty">Programmes will appear here once published.</p>}</div></section>
    <section id="schedule" className="publicSection publicDark"><div className="publicSectionTitle"><small>RUNNING ORDER</small><h2>Schedule</h2></div><div className="publicSchedule">{schedules.map(s=><div className="publicScheduleRow" key={s.id}><strong>{new Date(s.starts_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</strong><div><h3>{s.programme_name}</h3><span>{s.venue_name || "Venue TBA"} · {s.category || "General"}</span></div></div>)}{!schedules.length && <p className="publicEmpty">Schedule will appear here once it is published.</p>}</div></section>
    <section id="results" className="publicSection"><div className="publicSectionTitle"><small>LIVE RESULTS</small><h2>Results</h2></div><div className="publicResults">{results.map(r=><div className="publicResultRow" key={r.id}><strong>#{r.position}</strong><div><h3>{r.recipient_name}</h3><span>{r.programme_name}{r.team_name ? " · "+r.team_name : ""}</span></div><b>{r.points ?? 0}<small> pts</small></b></div>)}{!results.length && <p className="publicEmpty">Results will appear here once they are published.</p>}</div></section>
    <footer className="publicFooter"><strong>EVENTRA</strong><span>Festival management, made simple.</span></footer>
  </main>;
}
