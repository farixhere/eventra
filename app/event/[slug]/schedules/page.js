import { getDb } from "../../../../lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SchedulesPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const filter = String(query?.day || "all");
  const sql = getDb();
  const events = await sql`SELECT id,name,slug,is_public FROM events WHERE slug=${slug} LIMIT 1`;
  if (!events.length) notFound();
  const event = events[0];
  if (!event.is_public) notFound();

  const schedules = await sql`
    SELECT s.id,s.starts_at,s.ends_at,s.status,p.name AS programme_name,p.category,v.name AS venue_name,v.location AS venue_location
    FROM schedules s JOIN programmes p ON p.id=s.programme_id
    LEFT JOIN venues v ON v.id=s.venue_id
    WHERE p.event_id=${event.id}
    ORDER BY s.starts_at
  `;
  const days = [...new Set(schedules.map(s => new Date(s.starts_at).toISOString().slice(0,10)))];
  const shown = filter === "all" ? schedules : schedules.filter(s => new Date(s.starts_at).toISOString().slice(0,10) === filter);

  return <main className="publicEvent">
    <nav className="publicNav"><a href={"/event/"+event.slug}>EVENTRA</a><div><a href={"/event/"+event.slug+"/results"}>Results</a><a href={"/event/"+event.slug+"/candidate"}>My Result</a><a href={"/event/"+event.slug+"/wall"}>Wall</a></div></nav>
    <section className="publicHero compactHero"><span className="publicKicker">SCHEDULE · {event.name.toUpperCase()}</span><h1>Event schedule.</h1><p>Search the running order and find where each programme happens.</p></section>
    <section className="publicSection">
      <div className="scheduleFilters"><a className={filter==="all"?"active":""} href={"?day=all"}>All</a>{days.map(d=><a className={filter===d?"active":""} href={"?day="+d} key={d}>{new Date(d+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}</a>)}</div>
      <div className="publicSchedule publicScheduleLight">
        {shown.map(s=><div className="publicScheduleRow" key={s.id}>
          <strong>{new Date(s.starts_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</strong>
          <div><h3>{s.programme_name}</h3><span>{s.venue_name || "Venue TBA"}{s.venue_location ? " · "+s.venue_location : ""} · {s.status}</span></div>
        </div>)}
        {!shown.length && <p className="publicEmpty">No scheduled events for this filter.</p>}
      </div>
    </section>
    <footer className="publicFooter"><strong>EVENTRA</strong><span>Festival management, made simple.</span></footer>
  </main>;
}
