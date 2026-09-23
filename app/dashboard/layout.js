import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifyAdminToken } from "../../lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const secret = process.env.EVENTRA_ADMIN_PASSWORD;

  if (!secret || !(await verifyAdminToken(token, secret))) {
    redirect("/dashboard/login?next=/dashboard");
  }

  return children;
}
