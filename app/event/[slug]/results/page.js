import { getDb } from "../../../../lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }) {
  const { slug } = await params;
  const sql = getDb();
  const events = await sql`SELECT id,name,slug FROM events WHERE slug=${slug} LIMIT 1`;
  if (!events.length) notFound();
  const event = events[0];

  const rows = await sql`
    SELECT r.id,r.position,r.total_score,r.points,p.name AS programme_name,p.category,
           COALESCE(part.name,t.name) AS recipient_name,t.name AS team_name
    FROM results r
    JOIN programmes p ON p.id=r.programme_id
    LEFT JOIN participants part ON part.id=r.participant_id
    LEFT JOIN teams t ON t.id=r.team_id
    WHERE p.event_id=${event.id} AND r.published=true
    ORDER BY p.category NULLS LAST,p.name,r.position NULLS LAST,r.points DESC,r.total_score DESC NULLS LAST
  `;

  const categories = [...new Set(rows.map(r => r.category || "General"))];

  return <main className="publicEvent">
    <nav className="publicNav"><a href={"/event/"+event.slug}>EVENTRA</a><div>
      <a href={"/event/"+event.slug+"/results"}>Results</a>
      <a href={"/event/"+event.slug+"/candidate"}>My Result</a>
      <a href={"/event/"+event.slug+"/schedules"}>Schedules</a>
      <a href={"/event/"+event.slug+"/wall"}>Wall</a>
    </div></nav>
    <section className="publicHero compactHero">
      <span className="publicKicker">RESULTS · {event.name.toUpperCase()}</span>
      <h1>Published Results</h1>
      <p>Published results only. Unpublished entries stay inside the organiser dashboard until they are released.</p>
    </section>
    <section className="publicSection">
      {categories.map(category => {
        const items = rows.filter(r => (r.category || "General") === category);
        return <div className="publicResultGroup" key={category}>
          <div className="publicSectionTitle"><small>{category.toUpperCase()}</small><h2>{category}</h2></div>
          <div className="publicResults">
            {items.map(r => <div className="publicResultRow" key={r.id}>
              <strong>#{r.position ?? "—"}</strong>
              <div><h3>{r.recipient_name || "Unnamed entry"}</h3><span>{r.programme_name}{r.team_name ? " · " + r.team_name : ""}</span></div>
              <b>{r.total_score ?? r.points ?? 0}<small>{r.total_score != null ? " score" : " pts"}</small></b>
            </div>)}
          </div>
        </div>;
      })}
      {!rows.length && <p className="publicEmpty">No published results yet.</p>}
    </section>
    <footer className="publicFooter"><strong>EVENTRA</strong><span>Festival management, made simple.</span></footer>
  </main>;
}
