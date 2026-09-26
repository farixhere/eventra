import { getDb } from "../../../lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const date = (v, opts={day:"numeric",month:"short",year:"numeric"}) => v ? new Date(v).toLocaleDateString("en-IN",opts) : "TBA";
const time = v => v ? new Date(v).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "TBA";

export default async function EventPage({ params }) {
  const { slug } = await params;
  const sql = getDb();

  const ev = await sql`SELECT id,name,slug,description,tagline,start_date,end_date,location,status,
    logo_url,banner_url,primary_color,secondary_color,is_public,registration_open,registration_deadline,
    COALESCE(website_sections,'{}'::jsonb) AS website_sections
    FROM events WHERE slug=${slug} LIMIT 1`;
  if (!ev.length || !ev[0].is_public) notFound();
  const event=ev[0];

  const [programmes,schedules,announcements,results,participants,teams,media,downloads,festivalSettings,liveUpdates] = await Promise.all([
    sql`SELECT id,name,category,type,max_participants,description,status FROM programmes WHERE event_id=${event.id} ORDER BY category NULLS LAST,name LIMIT 18`,
    sql`SELECT s.id,s.starts_at,s.ends_at,s.status,p.name AS programme_name,p.category,v.name AS venue_name,v.location AS venue_location
      FROM schedules s JOIN programmes p ON p.id=s.programme_id LEFT JOIN venues v ON v.id=s.venue_id
      WHERE p.event_id=${event.id} ORDER BY s.starts_at LIMIT 12`,
    sql`SELECT id,title,body,created_at FROM announcements WHERE event_id=${event.id} AND published=true ORDER BY created_at DESC LIMIT 5`,
    sql`SELECT r.id,r.position,r.points,r.total_score,p.name AS programme_name,p.category,
      COALESCE(part.name,t.name) AS recipient_name,t.name AS team_name
      FROM results r JOIN programmes p ON p.id=r.programme_id
      LEFT JOIN participants part ON part.id=r.participant_id LEFT JOIN teams t ON t.id=r.team_id
      WHERE p.event_id=${event.id} AND r.published=true
      ORDER BY r.position NULLS LAST,r.points DESC,r.total_score DESC NULLS LAST LIMIT 10`,
    sql`SELECT id,name,participant_code FROM participants WHERE event_id=${event.id} ORDER BY name LIMIT 8`,
    sql`SELECT id,name,code FROM teams WHERE event_id=${event.id} ORDER BY name LIMIT 8`,
    sql`SELECT id,file_name,file_url,caption FROM media_assets WHERE event_id=${event.id} AND published=true ORDER BY created_at DESC LIMIT 8`,
    (async()=>{try{return await sql`SELECT id,title,description,file_url,file_type FROM downloads WHERE event_id=${event.id} AND published=true ORDER BY created_at DESC LIMIT 6`}catch{return []}})(), sql`SELECT * FROM festival_settings WHERE event_id=${event.id} LIMIT 1`, sql`SELECT id,title,message,update_type,created_at FROM live_updates WHERE event_id=${event.id} ORDER BY created_at DESC LIMIT 6`
  ]);

  const fs=festivalSettings[0]||{}, branding=fs.branding||{}, sections={programmes:true,schedule:true,results:true,gallery:true,announcements:true,downloads:true,participants:true,contact:true,...(event.website_sections||{}),...(fs.navigation||{})};\n  const dates=event.start_date ? date(event.start_date)+(event.end_date?" — "+date(event.end_date):"") : "Dates to be announced";
  const theme={"--event-primary":branding.primary||event.primary_color||"#d7ff3f","--event-secondary":branding.secondary||event.secondary_color||"#111111"};
  const hero=event.banner_url?{backgroundImage:`linear-gradient(90deg,rgba(8,8,8,.88),rgba(8,8,8,.5),rgba(8,8,8,.18)),url("${event.banner_url}")`}:undefined;

  return <main className="festivalSite publicEvent" style={theme}>
    <div className="festivalTopline"><span><i/> {event.status?.toUpperCase()||"LIVE EVENT"}</span><span>{dates}</span><span>{event.location||"Venue TBA"}</span></div>
    <nav className="festivalNav">
      <a className="festivalBrand" href={`/event/${event.slug}`}><span className="festivalBrandMark">{event.logo_url?<img src={event.logo_url} alt=""/>:"E"}</span><b>EVENTRA<span>.</span></b></a>
      <div className="festivalNavLinks">
        {sections.programmes&&<a href="#programmes">Programmes</a>}{sections.schedule&&<a href="#schedule">Schedule</a>}
        {sections.results&&<a href="#results">Results</a>}{sections.gallery&&<a href="#gallery">Gallery</a>}{sections.announcements&&<a href="#updates">Updates</a>}
      </div>
      <div className="festivalNavActions"><a className="festivalLookup" href={`/event/${event.slug}/candidate`}>Find result</a>{event.registration_open&&<a className="festivalRegister" href={`/event/${event.slug}/register`}>Register <span>↗</span></a>}</div>
    </nav>

    <section className="festivalHero" style={hero}><div className="festivalHeroNoise"/>
      <div className="festivalHeroInner"><div className="festivalHeroCopy">
        <div className="festivalEyebrow"><span>EVENTRA PRESENTS</span><b>{event.status||"FESTIVAL"}</b></div>
        {event.logo_url&&<img className="festivalHeroLogo" src={event.logo_url} alt=""/>}
        <h1>{event.name}</h1><p>{event.tagline||event.description||"A festival built for people, programmes and unforgettable moments."}</p>
        <div className="festivalHeroMeta"><span>◷ {dates}</span><span>⌖ {event.location||"Location TBA"}</span></div>
        <div className="festivalHeroActions">{event.registration_open&&<a className="festivalPrimary" href={`/event/${event.slug}/register`}>Join the festival <span>↗</span></a>}<a className="festivalGhost" href="#schedule">Explore schedule <span>↓</span></a></div>
      </div><div className="festivalHeroSide">
        <div className="heroLiveCard"><span className="heroLiveDot"/><small>THE FESTIVAL IS LIVE</small><strong>{programmes.length||"—"}</strong><span>featured programmes</span></div>
        <a className="heroResultCard" href={`/event/${event.slug}/candidate`}><small>CHEST NUMBER</small><strong>Find your result <span>→</span></strong><span>Search published results instantly</span></a>
      </div></div>
      <div className="festivalHeroScroll">SCROLL TO EXPLORE <span>↓</span></div>
    </section>

    {(liveUpdates.length||announcements.length)>0&&sections.announcements&&<section className="festivalTicker" id="updates"><div className="tickerLabel"><span>LIVE</span> UPDATES</div><div className="tickerTrack">{[...liveUpdates.map(u=><a href="#updates" key={"live-"+u.id}><b>{u.title}</b><span>{u.message||u.update_type}</span></a>),...announcements.map(a=><a href="#announcements" key={a.id}><b>{a.title}</b><span>{a.body}</span></a>)}</div></section>}
    <section className="festivalStats"><div><strong>{programmes.length}</strong><span>Programmes</span></div><div><strong>{participants.length}{participants.length===8?"+":""}</strong><span>Participants</span></div><div><strong>{teams.length}{teams.length===8?"+":""}</strong><span>Teams</span></div><div><strong>{schedules.length}{schedules.length===12?"+":""}</strong><span>Scheduled moments</span></div></section>

    {sections.programmes&&<section id="programmes" className="festivalSection programmeSection">
      <div className="festivalSectionHead"><div><span className="sectionNo">01 / THE LINEUP</span><h2>Something<br/><em>for everyone.</em></h2></div><p>Browse the programmes, categories and events that make {event.name} what it is.</p></div>
      <div className="festivalProgrammeGrid">{programmes.map((p,i)=><article className="festivalProgrammeCard" key={p.id}><div className="programmeNumber">{String(i+1).padStart(2,"0")}</div><div className="programmeCategory">{p.category||"GENERAL"}</div><h3>{p.name}</h3><p>{p.description||(p.type==="team"?"Team programme":"Individual programme")}</p><div className="programmeFoot"><span>{p.type==="team"?"TEAM":"INDIVIDUAL"}</span><span>{p.max_participants?"MAX "+p.max_participants:"OPEN"}</span></div></article>)}{!programmes.length&&<div className="festivalEmpty"><strong>Programmes are coming.</strong><span>The organiser has not published the lineup yet.</span></div>}</div>
    </section>}

    {sections.schedule&&<section id="schedule" className="festivalSection scheduleSection">
      <div className="festivalSectionHead lightHead"><div><span className="sectionNo">02 / RUNNING ORDER</span><h2>Don't miss<br/><em>a moment.</em></h2></div><a className="sectionArrow" href={`/event/${event.slug}/schedules`}>Open full schedule <span>↗</span></a></div>
      <div className="festivalScheduleBoard">{schedules.map((s,i)=><div className="festivalScheduleItem" key={s.id}><div className="scheduleIndex">{String(i+1).padStart(2,"0")}</div><div className="scheduleClock"><strong>{time(s.starts_at)}</strong><span>{s.ends_at?time(s.ends_at):"END TBA"}</span></div><div className="scheduleProgramme"><strong>{s.programme_name}</strong><span>{s.category||"Programme"} · {s.status||"scheduled"}</span></div><div className="scheduleVenue"><span>VENUE</span><strong>{s.venue_name||"TBA"}</strong><small>{s.venue_location||""}</small></div></div>)}{!schedules.length&&<div className="festivalEmpty festivalEmptyDark"><strong>The timetable is being prepared.</strong><span>Published schedule entries will appear here.</span></div>}</div>
    </section>}

    {sections.results&&<section id="results" className="festivalSection resultSection">
      <div className="festivalSectionHead"><div><span className="sectionNo">03 / OFFICIAL RESULTS</span><h2>Celebrate<br/><em>the winners.</em></h2></div><a className="sectionArrow" href={`/event/${event.slug}/results`}>View all results <span>↗</span></a></div>
      <div className="festivalResultsWall">{results.map((r,i)=><article className={`festivalResultCard ${i===0?"resultFeatured":""}`} key={r.id}><div className="resultMedal">{r.position?"#"+r.position:"—"}</div><div className="resultName"><small>{r.category||"RESULT"} · {r.programme_name}</small><strong>{r.recipient_name||"Unnamed entry"}</strong><span>{r.team_name||"Published result"}</span></div><div className="resultScore"><strong>{r.total_score??r.points??"—"}</strong><span>{r.total_score!=null?"SCORE":"POINTS"}</span></div></article>)}{!results.length&&<div className="festivalEmpty"><strong>Results will appear here.</strong><span>Only results published by organisers are shown publicly.</span></div>}</div>
      <div className="resultLookupBanner"><div><span>LOOKING FOR ONE PERSON?</span><strong>Find your result by chest number.</strong></div><a href={`/event/${event.slug}/candidate`}>Search result <span>→</span></a></div>
    </section>}

    {sections.gallery&&<section id="gallery" className="festivalSection gallerySection">
      <div className="festivalSectionHead"><div><span className="sectionNo">04 / FESTIVAL MEMORIES</span><h2>See the<br/><em>energy.</em></h2></div><a className="sectionArrow" href={`/event/${event.slug}/gallery`}>Open gallery <span>↗</span></a></div>
      <div className="festivalMosaic">{media.map((m,i)=><a className={`mosaicItem mosaic${i%5}`} key={m.id} href={m.file_url} target="_blank" rel="noreferrer"><img src={m.file_url} alt={m.caption||m.file_name}/><span>{m.caption||"Festival moment"}</span></a>)}{!media.length&&<div className="festivalEmpty"><strong>Gallery loading soon.</strong><span>Published festival media will live here.</span></div>}</div>
    </section>}

    {sections.announcements&&announcements.length>0&&<section id="announcements" className="festivalSection announcementSection">
      <div className="festivalSectionHead"><div><span className="sectionNo">05 / FROM THE ORGANISERS</span><h2>What's<br/><em>happening.</em></h2></div><a className="sectionArrow" href={`/event/${event.slug}/wall`}>Open festival wall <span>↗</span></a></div>
      <div className="festivalAnnouncementGrid">{announcements.map((a,i)=><article key={a.id} className={i===0?"announcementFeatured":""}><span>{date(a.created_at,{day:"numeric",month:"short"})}</span><h3>{a.title}</h3><p>{a.body}</p><a href={`/event/${event.slug}/wall`}>Read update →</a></article>)}</div>
    </section>}

    {sections.downloads&&<section className="festivalResourceStrip"><div><span className="sectionNo">06 / EVENT RESOURCES</span><h2>Everything you<br/>need, <em>one click away.</em></h2></div><div className="resourceLinks">{downloads.slice(0,3).map(f=><a key={f.id} href={f.file_url} target="_blank" rel="noreferrer"><small>{f.file_type||"FILE"}</small><strong>{f.title}</strong><span>Open ↗</span></a>)}{!downloads.length&&<a href={`/event/${event.slug}/downloads`}><small>EVENTRA</small><strong>Open event downloads</strong><span>Explore ↗</span></a>}<a href={`/event/${event.slug}/downloads`}><small>ALL RESOURCES</small><strong>Downloads & documents</strong><span>Open ↗</span></a></div></section>}

    <section className="festivalFinalCTA"><div className="finalCtaGlow"/><span>YOUR FESTIVAL, YOUR MOMENT.</span><h2>{event.registration_open?"Be part of it.":"Stay close to the action."}</h2><p>{event.registration_open?"Register now and get your place in the festival.":"Follow schedules, results and announcements as the organisers publish them."}</p><div>{event.registration_open&&<a className="festivalPrimary" href={`/event/${event.slug}/register`}>Register now <span>↗</span></a>}<a className="festivalGhost" href={`/event/${event.slug}/contact`}>Contact organisers <span>→</span></a></div></section>

    <footer className="festivalFooter"><div className="footerBrand"><span className="festivalBrandMark">{event.logo_url?<img src={event.logo_url} alt=""/>:"E"}</span><strong>{event.name}</strong></div><div className="footerLinks">{sections.schedule&&<a href={`/event/${event.slug}/schedules`}>Schedule</a>}{sections.results&&<a href={`/event/${event.slug}/results`}>Results</a>}{sections.gallery&&<a href={`/event/${event.slug}/gallery`}>Gallery</a>}{sections.downloads&&<a href={`/event/${event.slug}/downloads`}>Downloads</a>}<a href={`/event/${event.slug}/candidate`}>My Result</a>{sections.contact&&<a href={`/event/${event.slug}/contact`}>Contact</a>}</div><div className="footerBottom"><span>Powered by <b>Eventra.</b></span><span>{event.location||"Festival website"}</span></div></footer>
  </main>;
}