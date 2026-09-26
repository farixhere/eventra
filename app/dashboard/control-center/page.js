import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifyAdminToken } from "../../../lib/auth";
import ControlCenterClient from "./ControlCenterClient";

export const dynamic = "force-dynamic";

export default async function ControlCenterPage() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const ok = await verifyAdminToken(token, process.env.EVENTRA_ADMIN_PASSWORD);
  if (!ok) redirect("/admin-login?next=/dashboard/control-center");
  return <ControlCenterClient />;
}
