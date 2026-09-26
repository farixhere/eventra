import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

// Eventra is running in open-control mode: the dashboard is directly accessible.
export default function DashboardPage() {
  return (
    <>
      <div style={{position:"fixed",right:20,top:20,zIndex:50}}>
        <a href="/dashboard/control-center" style={{display:"inline-block",padding:"10px 14px",borderRadius:999,background:"#d7ff3f",color:"#0b0b0b",fontWeight:700,textDecoration:"none"}}>
          Control Center ↗
        </a>
      </div>
      <DashboardClient />
    </>
  );
}
