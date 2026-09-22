import Link from "next/link";

const stats = [
  ["Active events", "04", "2 this month"],
  ["Participants", "1,284", "Across all events"],
  ["Programmes", "76", "12 today"],
  ["Results", "38", "Published"]
];

export default function Dashboard() {
  return (
    <main className="dashboardPage">
      <header className="dashNav"><Link className="brand" href="/">eventra<span>.</span></Link><div><span className="statusDot"></span> Workspace</div><Link href="/">← Website</Link></header>
      <div className="dashShell">
        <aside className="sideNav"><small>WORKSPACE</small><a className="selected">Overview</a><a>Events</a><a>Programmes</a><a>Participants</a><a>Schedules</a><a>Results</a><a>Certificates</a><small className="space">SYSTEM</small><a>Settings</a></aside>
        <section className="workspace"><div className="workspaceTop"><div><small>MONDAY, SEPTEMBER 22</small><h1>Good afternoon.</h1><p>Your event workspace is ready.</p></div><button>+ New event</button></div><div className="statGrid">{stats.map(([label,num,note]) => <div className="stat" key={label}><small>{label}</small><strong>{num}</strong><span>{note}</span></div>)}</div><div className="eventPanel"><div className="panelTop"><h2>Recent events</h2><button>View all →</button></div>{[["Verve '26","Live","September 28, 2026","1,284 participants"],["Campus Arts Fest","Planning","October 14, 2026","— participants"],["Tech Arena","Draft","November 02, 2026","— participants"]].map(([name,state,date,people]) => <div className="eventRow" key={name}><div><strong>{name}</strong><span>{date} · {people}</span></div><span className={"pill "+(state==="Live"?"live":"")}>{state}</span><span className="rowArrow">→</span></div>)}</div></section>
      </div>
    </main>
  );
}