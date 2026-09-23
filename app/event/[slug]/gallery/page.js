import { getDb } from "../../../../lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function GalleryPage({ params }) {
  const { slug } = await params;
  const sql = getDb();
  const events = await sql`SELECT id,name,slug,is_public FROM events WHERE slug=${slug} LIMIT 1`;
  if (!events.length) notFound();
  const event = events[0];
  if (!event.is_public) notFound();
  const media = await sql`SELECT id,file_name,file_url,file_type,category,caption FROM media_assets WHERE event_id=${event.id} AND published=true ORDER BY created_at DESC`;

  return <main className="publicEvent">
    <nav className="publicNav"><a href={"/event/"+event.slug}>EVENTRA<span>.</span></a><div><a href={"/event/"+event.slug+"/results"}>Results</a><a href={"/event/"+event.slug+"/schedules"}>Schedules</a><a href={"/event/"+event.slug+"/wall"}>Wall</a><a href={"/event/"+event.slug+"/contact"}>Contact</a></div></nav>
    <section className="publicHero compactHero"><span className="publicKicker">GALLERY · {event.name.toUpperCase()}</span><h1>Festival memories.</h1><p>Photos, posters and media published by the organisers.</p></section>
    <section className="publicSection"><div className="publicGalleryGrid">{media.map(item=><a key={item.id} href={item.file_url} target="_blank" rel="noreferrer" className="publicGalleryItem"><img src={item.file_url} alt={item.caption || item.file_name} /><span>{item.caption || item.file_name}</span></a>)}{!media.length && <p className="publicEmpty">No media has been published yet.</p>}</div></section>
    <footer className="publicFooter"><strong>EVENTRA<span>.</span></strong><span>Festival management, made simple.</span></footer>
  </main>;
}
