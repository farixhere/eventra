import Link from "next/link";

const features = [
  { n: "01", title: "Build your event", text: "Create festivals, campus events and programmes with a clean organizer workspace." },
  { n: "02", title: "Manage programmes", text: "Keep programmes, participants, teams and venues organized in one system." },
  { n: "03", title: "Publish instantly", text: "Give every event a polished public page for schedules, results, announcements, gallery and downloads." },
  { n: "04", title: "Issue documents", text: "Prepare participant ID cards and certificate records from the same event data." },
  { n: "05", title: "Stay in control", text: "Keep drafts private, publish only approved information, and manage the event from one workspace." }
];

export default function Home() {
  return (
    <main>
      <nav className="nav">
        <Link className="brand" href="/">eventra<span>.</span></Link>
        <div className="navLinks">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <Link className="navButton" href="/dashboard">Open dashboard</Link><Link className="navButton" href="/dashboard/studio">Event Studio</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="eyebrow">EVENT MANAGEMENT, REBUILT</div>
        <h1>Run the event.<br /><em>Not the chaos.</em></h1>
        <p className="heroText">Eventra gives organizers one calm command center for festivals, participants, schedules, programmes, documents and published results.</p>
        <div className="heroActions">
          <Link className="primary" href="/dashboard">Start organizing <span>→</span></Link>
          <a className="secondary" href="#features">Explore Eventra</a>
        </div>
        <div className="heroMeta">
          <span><i /> Organizer-first</span>
          <span><i /> Mobile-ready</span>
          <span><i /> Built to scale</span>
        </div>
      </section>

      <section className="previewWrap" aria-label="Eventra dashboard preview">
        <div className="browser">
          <div className="browserTop"><span></span><span></span><span></span><b>eventra.app / dashboard</b></div>
          <div className="dashPreview">
            <aside><strong>eventra.</strong><small>WORKSPACE</small><div className="active">Overview</div><div>Events</div><div>Programmes</div><div>Participants</div><div>Results</div><div>Settings</div></aside>
            <div className="dashMain">
              <div className="dashHeading"><div><small>MONDAY, SEPTEMBER 22</small><h3>Good afternoon, organizer.</h3></div><button>+ New event</button></div>
              <div className="cards"><div><small>ACTIVE EVENTS</small><strong>04</strong><span>↑ 2 this month</span></div><div><small>PARTICIPANTS</small><strong>1,284</strong><span>Across all events</span></div><div><small>PROGRAMMES</small><strong>76</strong><span>12 running today</span></div></div>
              <div className="table"><div className="tableHead"><span>RECENT EVENTS</span><span>STATUS</span></div><div><b>Verve '26</b><span className="pill live">Live</span></div><div><b>Campus Arts Fest</b><span className="pill">Planning</span></div><div><b>Tech Arena</b><span className="pill">Draft</span></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="sectionIntro"><span>THE CORE</span><h2>Everything your event<br /><em>actually needs.</em></h2></div>
        <div className="featureGrid">{features.map(f => <article key={f.n}><small>{f.n}</small><h3>{f.title}</h3><p>{f.text}</p><span className="arrow">↗</span></article>)}</div>
      </section>

      <section className="how" id="how">
        <span>ONE WORKFLOW</span>
        <h2>From setup to <em>published results.</em></h2>
        <div className="steps"><div><b>01</b><strong>Create</strong><p>Set up your event and choose what you need.</p></div><div><b>02</b><strong>Operate</strong><p>Run programmes, participants, schedules and verified manual results.</p></div><div><b>03</b><strong>Publish</strong><p>Share a beautiful public event experience.</p></div></div>
      </section>

      <footer><span className="brand">eventra<span>.</span></span><span>Operate programmes, participants, schedules and event results.</span></footer>
    </main>
  );
}