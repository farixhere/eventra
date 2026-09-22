import { getDb } from "../../../../lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DownloadsPage({ params }) {
  const { slug } = await params;
  const sql = getDb();
  const events = await sql`SELECT id,name,slug FROM events WHERE slug=${slug} LIMIT 1`;
  if (!events.length) notFound();
  const event = events[0];

  let files = [];
  try {
    files = await sql`SELECT id,title,description,file_url,file_type FROM downloads WHERE event_id=${event.id} AND published=true ORDER BY created_at DESC`;
  } catch (_) {}

  return <main className="publicEvent">
    <nav className="publicNav"><a href={"/event/"+event.slug}>EVENTRA</a><div><a href={"/event/"+event.slug+"/results"}>Results</a><a href={"/event/"+event.slug+"/schedules"}>Schedules</a><a href={"/event/"+event.slug+"/wall"}>Wall</a></div></nav>
    <section className="publicHero compactHero"><span className="publicKicker">DOWNLOADS · {event.name.toUpperCase()}</span><h1>Event resources.</h1><p>Results, documents, media and other files published by the organisers.</p></section>
    <section className="publicSection"><div className="downloadGrid">
      {files.map(f=><a className="downloadCard" href={f.file_url} target="_blank" rel="noreferrer" key={f.id}><small>{f.file_type || "FILE"}</small><h3>{f.title}</h3><p>{f.description || "Open resource"}</p><span>Open ↗</span></a>)}
      {!files.length && <p className="publicEmpty">No download files are available yet.</p>}
    </div></section>
    <footer className="publicFooter"><strong>EVENTRA</strong><span>Festival management, made simple.</span></footer>
  </main>;
}
