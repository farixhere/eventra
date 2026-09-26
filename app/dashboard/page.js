import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { COOKIE_NAME, verifyAdminToken } from "../../lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const authenticated = await verifyAdminToken(
    token,
    process.env.EVENTRA_ADMIN_PASSWORD
  );

  if (!authenticated) redirect("/admin-login?next=/dashboard");

  return <><div style={{position:"fixed",right:20,top:20,zIndex:50}}><a href="/dashboard/control-center" style={{display:"inline-block",padding:"10px 14px",borderRadius:999,background:"#d7ff3f",color:"#0b0b0b",fontWeight:700,textDecoration:"none"}}>Control Center ↗</a></div><DashboardClient /></>
}
