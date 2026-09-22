import { getDb } from "../../../../lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CandidatePage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const chest = String(query?.chest || "").trim();
  const sql = getDb();
  const events = await sql`SELECT id,name,slug FROM events WHERE slug=${slug} LIMIT 1`;
  if (!events.length) notFound();
  const event = events[0];

  let participant = null;
  let results = [];
  if (chest) {
    const found = await sql`SELECT id,name,participant_code,team_id FROM participants WHERE event_id=${event.id} AND participant_code=${chest} LIMIT 1`;
    participant = found[0] || null;
    if (participant) {
      results = await sql`
        SELECT r.position,r.total_score,r.points,p.name AS programme_name
        FROM results r JOIN programmes p ON p.id=r.programme_id
        WHERE r.participant_id=${participant.id} AND r.published=true
        ORDER BY p.name,r.position NULLS LAST
      `;
    }
  }

  return <main className="publicEvent">
    <nav className="publicNav"><a href={"/event/"+event.slug}>EVENTRA</a><div><a href={"/event/"+event.slug+"/results"}>Results</a><a href={"/event/"+event.slug+"/schedules"}>Schedules</a><a href={"/event/"+event.slug+"/wall"}>Wall</a></div></nav>
    <section className="publicHero compactHero">
      <span className="publicKicker">MY RESULT · {event.name.toUpperCase()}</span>
      <h1>Find your result.</h1>
      <p>Enter your chest number / participant code to see published results.</p>
      <form className="publicSearch" method="get">
        <input name="chest" value={chest} placeholder="Enter chest number..." aria-label="Chest number" />
        <button type="submit">Search</button>
      </form>
    </section>
    <section className="publicSection">
      {chest && !participant && <div className="publicNotice">No participant found for <strong>{chest}</strong>.</div>}
      {participant && <div className="candidateCard">
        <small>PARTICIPANT</small><h2>{participant.name}</h2><span>Chest No. {participant.participant_code}</span>
      </div>}
      {participant && <div className="publicResults candidateResults">
        {results.map((r,i)=><div className="publicResultRow" key={i}><strong>#{r.position ?? "—"}</strong><div><h3>{r.programme_name}</h3><span>Published result</span></div><b>{r.total_score ?? r.points ?? 0}<small>{r.total_score != null ? " score" : " pts"}</small></b></div>)}
        {!results.length && <p className="publicEmpty">No published results for this participant yet.</p>}
      </div>}
    </section>
    <footer className="publicFooter"><strong>EVENTRA</strong><span>Festival management, made simple.</span></footer>
  </main>;
}
