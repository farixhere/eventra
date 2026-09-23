import { getDb } from "../../../lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }) {
  const { slug } = await params;
  const sql = getDb();
  const events = await sql`SELECT id,name,slug,description,tagline,start_date,end_date,location,status,logo_url,banner_url,primary_color,secondary_color,is_public,registration_open,registration_deadline FROM events WHERE slug=${slug} LIMIT 1`;
  if (!events.length) notFound();
  const event = events[0];

  const [programmes, schedules, announcements, results, participants, teams, venues, media] = await Promise.all([
    sql`SELECT id,name,category,type,max_participants,description,rules,status FROM programmes WHERE event_id=${event.id} ORDER BY category NULLS LAST,name`,
    sql`SELECT s.id,s.starts_at,s.ends_at,s.status,p.name AS programme_name,p.category,v.name AS venue_name FROM schedules s JOIN programmes p ON p.id=s.programme_id LEFT JOIN venues v ON v.id=s.venue_id WHERE p.event_id=${event.id} ORDER BY s.starts_at LIMIT 16`,
    sql`SELECT id,title,body,created_at FROM announcements WHERE event_id=${event.id} AND published=true ORDER BY created_at DESC LIMIT 6`,
    sql`SELECT r.id,r.position,r.points,r.total_score,p.name AS programme_name,COALESCE(part.name,t.name) AS recipient_name,t.name AS team_name FROM results r JOIN programmes p ON p.id=r.programme_id LEFT JOIN participants part ON part.id=r.participant_id LEFT JOIN teams t ON t.id=r.team_id WHERE p.event_id=${event.id} AND r.published=true ORDER BY r.position NULLS LAST,r.points DESC LIMIT 12`,
    sql`SELECT id,name,participant_code FROM participants WHERE event_id=${event.id} ORDER BY name LIMIT 12`,
    sql`SELECT id,name,code FROM teams WHERE event_id=${event.id} ORDER BY name LIMIT 12`,
    sql`SELECT id,name,location,capacity FROM venues WHERE event_id=${event.id} ORDER BY name LIMIT 12`,
    sql`SELECT id,file_name,file_url,file_type,category,caption FROM media_assets WHERE event_id=${event.id} AND published=true ORDER BY created_at DESC LIMIT 8`
  ]);

  const dateText = event.start_date ? new Date(event.start_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "Date to be announced";
  const endText = event.end_date ? " — " + new Date(event.end_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "";
  const theme = { "--event-primary": event.primary_color || "#d7ff3f", "--event-secondary": event.secondary_color || "#111111" };

  return <main className="publicEvent" style={theme}>
    <nav className="publicNav"><a href={"/event/"+event.slug}>EVENTRA<span>.</span></a><div>
      <a href="#programmes">Programmes</a><a href="#schedule">Schedule</a><a href="#results">Results</a><a href={"/event/"+event.slug+"/gallery"}>Gallery</a><a href={"/event/"+event.slug+"/contact"}>Contact</a>
    </div></nav>

    <section className="publicHero eventHeroRich" style={event.banner_url ? {backgroundImage:`linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.35)), url(${event.banner_url})`} : undefined}>
      <span className="publicKicker">{event.status?.toUpperCase() || "EVENT"} · EVENTRA</span>
      {event.logo_url && <img className="eventLogo" src={event.logo_url} alt="" />}
      <h1>{event.name}</h1>
      <p>{event.tagline || event.description || "A complete festival experience powered by Eventra."}</p>
      <div className="publicMeta"><span>📍 {event.location || "Venue to be announced"}</span><span>◷ {dateText}{endText}</span></div>
      <div className="publicQuickLinks"><a href={"/event/"+event.slug+"/results"}>Results ↗</a><a href={"/event/"+event.slug+"/candidate"}>My Result ↗</a><a href={"/event/"+event.slug+"/schedules"}>Full Schedule ↗</a><a href={"/event/"+event.slug+"/downloads"}>Downloads ↗</a><a href={"/event/"+event.slug+"/wall"}>Wall ↗</a>{event.registration_open && <a href={"/event/"+event.slug+"/register"}>Register ↗</a>}</div>
    </section>

    {announcements.length > 0 && <section className="publicSection"><div className="publicSectionTitle"><small>UPDATES</small><h2>Latest announcements</h2></div><div className="announcementGrid">{announcements.map(a=><article className="announcementCard" key={a.id}><small>{new Date(a.created_at).toLocaleDateString("en-IN")}</small><h3>{a.title}</h3><p>{a.body}</p></article>)}</div></section>}

    <section id="programmes" className="publicSection"><div className="publicSectionTitle"><small>THE LINEUP · {programmes.length}</small><h2>Programmes</h2></div><div className="programmeGrid">{programmes.map(p=><article className="publicProgramme" key={p.id}><span>{p.category || "GENERAL"}</span><h3>{p.name}</h3><p>{p.type === "team" ? "Team event" : "Individual event"}{p.max_participants ? " · Max "+p.max_participants : ""}</p>{p.description && <small>{p.description}</small>}</article>)}{!programmes.length && <p className="publicEmpty">Programmes will appear here once they are added.</p>}</div></section>

    <section className="publicSection publicSplit"><div><div className="publicSectionTitle"><small>PEOPLE · {participants.length}</small><h2>Participants</h2></div><div className="miniList">{participants.map(p=><div key={p.id}><strong>{p.name}</strong><span>{p.participant_code || "No chest number"}</span></div>)}{!participants.length && <p className="publicEmpty">No participants yet.</p>}</div></div><div><div className="publicSectionTitle"><small>GROUPS · {teams.length}</small><h2>Teams</h2></div><div className="miniList">{teams.map(t=><div key={t.id}><strong>{t.name}</strong><span>{t.code || "Team"}</span></div>)}{!teams.length && <p className="publicEmpty">No teams yet.</p>}</div></div></section>

    <section className="publicSection"><div className="publicSectionTitle"><small>LOCATIONS · {venues.length}</small><h2>Venues</h2></div><div className="programmeGrid">{venues.map(v=><article className="publicProgramme" key={v.id}><span>VENUE</span><h3>{v.name}</h3><p>{v.location || "Location not set"}{v.capacity ? " · Capacity "+v.capacity : ""}</p></article>)}{!venues.length && <p className="publicEmpty">No venues yet.</p>}</div></section>

    <section id="schedule" className="publicSection publicDark"><div className="publicSectionTitle"><small>RUNNING ORDER</small><h2>Schedule</h2></div><div className="publicSchedule">{schedules.map(s=><div className="publicScheduleRow" key={s.id}><strong>{new Date(s.starts_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</strong><div><h3>{s.programme_name}</h3><span>{s.venue_name || "Venue TBA"} · {s.status}</span></div></div>)}{!schedules.length && <p className="publicEmpty">Schedule will appear here once it is added.</p>}</div><a className="publicInlineLink" href={"/event/"+event.slug+"/schedules"}>View full schedule →</a></section>

    <section id="results" className="publicSection"><div className="publicSectionTitle"><small>LIVE RESULTS</small><h2>Results</h2></div><div className="publicResults">{results.map(r=><div className="publicResultRow" key={r.id}><strong>#{r.position ?? "—"}</strong><div><h3>{r.recipient_name || "Unnamed entry"}</h3><span>{r.programme_name}{r.team_name ? " · "+r.team_name : ""}</span></div><b>{r.total_score ?? r.points ?? 0}<small>{r.total_score != null ? " score" : " pts"}</small></b></div>)}{!results.length && <p className="publicEmpty">Results will appear here once they are published.</p>}</div><a className="publicInlineLink" href={"/event/"+event.slug+"/results"}>View all results →</a></section>

    {media.length > 0 && <section className="publicSection"><div className="publicSectionTitle"><small>MEMORIES · {media.length}</small><h2>Gallery</h2></div><div className="publicGalleryGrid">{media.map(item=><a key={item.id} href={item.file_url} target="_blank" rel="noreferrer" className="publicGalleryItem"><img src={item.file_url} alt={item.caption || item.file_name} /><span>{item.caption || item.file_name}</span></a>)}</div><a className="publicInlineLink" href={"/event/"+event.slug+"/gallery"}>Open gallery →</a></section>}

    <section className="publicSection publicCallout"><div><small>NEED HELP?</small><h2>Talk to the organisers.</h2><p>Send a message directly from the festival website.</p></div><a href={"/event/"+event.slug+"/contact"}>Contact organisers →</a></section>
    <footer className="publicFooter"><strong>EVENTRA<span>.</span></strong><span>Festival management, made simple.</span></footer>
  </main>;
}