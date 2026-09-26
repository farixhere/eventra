"use client";

import Link from "next/link";
import { useEffect } from "react";

const features = [
  ["01","LIVE COMMAND CENTER","Events, programmes, teams and participants in one live workspace."],
  ["02","REAL-TIME SCHEDULE","Keep the official timetable moving while everyone stays in sync."],
  ["03","RESULTS + PUBLISH","Enter results manually, verify them, then push them live."],
  ["04","CERTIFICATES","Turn participant data into organized certificate records and downloads."],
  ["05","PUBLIC EXPERIENCE","Give every festival a beautiful public home for schedules, results and updates."],
  ["06","BUILT FOR THE CHAOS","Announcements, media, downloads, analytics and operations without spreadsheet soup."]
];

export default function Home() {
  useEffect(() => {
    const items = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="landing">
      <div className="noise" />
      <nav className="neoNav">
        <Link href="/" className="neoBrand">eventra<span>↗</span></Link>
        <div className="neoNavLinks">
          <a href="#system">System</a><a href="#features">Features</a><a href="#flow">Flow</a>
          <Link href="/dashboard" className="neoNavCta">Open workspace <b>↗</b></Link>
        </div>
      </nav>

      <section className="neoHero">
        <div className="heroOrb orbOne"/><div className="heroOrb orbTwo"/>
        <div className="neoKicker"><span className="liveDot"/> FESTIVAL OPERATING SYSTEM <i>·</i> 2026</div>
        <h1>Make the event<br/><em>feel effortless.</em></h1>
        <p className="neoLead">Eventra turns the beautiful part of an event into the digital experience — and keeps the messy operational part under control.</p>
        <div className="neoHeroActions">
          <Link href="/dashboard" className="neoPrimary">Enter Eventra <span>→</span></Link>
          <a href="#system" className="neoGhost">See the system ↓</a>
        </div>
        <div className="heroTicker"><span>EVENTS</span><b>→</b><span>PROGRAMMES</span><b>→</b><span>RESULTS</span><b>→</b><span>CERTIFICATES</span><b>→</b><span>LIVE PUBLISHING</span></div>
      </section>

      <section className="commandPreview reveal" id="system">
        <div className="previewChrome"><span/><span/><span/><label>EVENTRA / COMMAND CENTER</label><small>● LIVE</small></div>
        <div className="previewGrid">
          <aside className="previewSide"><div className="miniLogo">e<span>.</span></div><small>WORKSPACE</small><b className="sel">◈ Overview</b><b>◫ Events</b><b>⌁ Programmes</b><b>◎ Participants</b><b>✦ Results</b><b>▣ Certificates</b><div className="sidePulse">● SYSTEM ONLINE</div></aside>
          <div className="previewMain">
            <div className="previewHead"><div><small>MONDAY · 22 SEPTEMBER</small><h3>Good afternoon, organizer.</h3></div><Link href="/dashboard">+ New event</Link></div>
            <div className="neoStats"><div><small>ACTIVE EVENTS</small><strong>04</strong><span>↗ 2 this month</span></div><div><small>PARTICIPANTS</small><strong>1,284</strong><span>Across all events</span></div><div><small>PROGRAMMES</small><strong>76</strong><span>12 running today</span></div></div>
            <div className="activityPanel"><div className="activityHead"><b>LIVE ACTIVITY</b><span>updated just now</span></div><div className="activityRow"><i className="aPurple"/> <div><b>Verve '26</b><span>Results published · Folk Dance</span></div><strong>LIVE</strong></div><div className="activityRow"><i className="aLime"/> <div><b>Campus Arts Fest</b><span>38 participants registered</span></div><strong>+38</strong></div><div className="activityRow"><i className="aOrange"/> <div><b>Tech Arena</b><span>Schedule updated · Main Hall</span></div><strong>SYNC</strong></div></div>
          </div>
        </div>
      </section>

      <section className="marqueeBand"><div>ONE WORKSPACE <b>✦</b> ONE SOURCE OF TRUTH <b>✦</b> ONE BEAUTIFUL PUBLIC EXPERIENCE <b>✦</b> ONE WORKSPACE <b>✦</b></div></section>

      <section className="neoFeatures" id="features">
        <div className="neoSectionHead reveal"><div><small>THE TOOLKIT</small><h2>Everything moves.<br/><em>Nothing gets lost.</em></h2></div><p>Designed around the real rhythm of festivals: prepare → run → verify → publish.</p></div>
        <div className="neoFeatureGrid">{features.map(([n,t,d],i)=><article className={"neoFeature reveal f"+i} key={n}><small>{n}</small><div className="featureIcon">{["↗","◫","✦","◇","◎","∞"][i]}</div><h3>{t}</h3><p>{d}</p><span className="featureArrow">↗</span></article>)}</div>
      </section>

      <section className="neoFlow" id="flow">
        <div className="flowIntro reveal"><small>THE RHYTHM</small><h2>From first setup<br/>to <em>final result.</em></h2></div>
        <div className="flowSteps">
          <article className="reveal"><b>01</b><div><small>SETUP</small><h3>Build the festival.</h3><p>Create the event, venues, teams, participants and programmes.</p></div></article>
          <article className="reveal"><b>02</b><div><small>OPERATE</small><h3>Run the day.</h3><p>Schedules, registrations, announcements and media stay connected.</p></div></article>
          <article className="reveal"><b>03</b><div><small>RESULTS</small><h3>Make it official.</h3><p>Enter marks, calculate positions and publish approved results.</p></div></article>
          <article className="reveal"><b>04</b><div><small>CELEBRATE</small><h3>Close the loop.</h3><p>Certificates, downloads and the public event story live in one place.</p></div></article>
        </div>
      </section>

      <section className="neoFinal reveal">
        <div className="finalGlow"/>
        <small>EVENTRA / READY WHEN YOU ARE</small>
        <h2>Your festival deserves<br/><em>more than a spreadsheet.</em></h2>
        <Link href="/dashboard" className="neoPrimary">Open the command center <span>→</span></Link>
      </section>

      <footer className="neoFooter"><Link href="/" className="neoBrand">eventra<span>↗</span></Link><span>Built for events that have somewhere to go.</span><span>© 2026</span></footer>
    </main>
  );
}
