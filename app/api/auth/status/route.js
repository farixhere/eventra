import { getAuthStatus } from "../../../../lib/accounts";

export async function GET() {
  try {
    const status = await getAuthStatus();
    return Response.json({ ok: true, auth: status }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("auth.status", error);
    return Response.json({ ok: false, error: "Authentication status unavailable." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}