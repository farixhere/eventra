import { getDb } from "../../../../lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WallPage({ params }) {
  const { slug } = await params;
  const sql = getDb();
  const events = await sql`SELECT id,name,slug,is_public FROM events WHERE slug=${slug} LIMIT 1`;
  if (!events.length) notFound();
  const event = events[0];
  if (!event.is_public) notFound();
  const posts = await sql`SELECT id,title,body,created_at FROM announcements WHERE event_id=${event.id} AND published=true ORDER BY created_at DESC`; const live = await sql`SELECT id,title,message,update_type,created_at FROM live_updates WHERE event_id=${event.id} ORDER BY created_at DESC LIMIT 20`;

  return <main className="publicEvent">
    <nav className="publicNav"><a href={"/event/"+event.slug}>EVENTRA</a><div><a href={"/event/"+event.slug+"/results"}>Results</a><a href={"/event/"+event.slug+"/candidate"}>My Result</a><a href={"/event/"+event.slug+"/schedules"}>Schedules</a></div></nav>
    <section className="publicHero compactHero"><span className="publicKicker">WALL · {event.name.toUpperCase()}</span><h1>Festival updates.</h1><p>Announcements and important notices published by the organisers.</p></section>
    <section className="publicSection"><div className="announcementGrid">{live.map(u=><article className="announcementCard" key={u.id}><small>LIVE · {new Date(u.created_at).toLocaleDateString("en-IN")}</small><h3>{u.title}</h3><p>{u.message||u.update_type}</p></article>)}
      {posts.map(p=><article className="announcementCard" key={p.id}><small>{new Date(p.created_at).toLocaleDateString("en-IN")}</small><h3>{p.title}</h3><p>{p.body}</p></article>)}
      {!posts.length && <p className="publicEmpty">No announcements published yet.</p>}
    </div></section>
    <footer className="publicFooter"><strong>EVENTRA</strong><span>Festival management, made simple.</span></footer>
  </main>;
}
