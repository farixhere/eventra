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

  if (!authenticated) redirect("/dashboard/login?next=/dashboard");

  return <DashboardClient />;
}
