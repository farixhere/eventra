import { getDb } from "../../../lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const events = await sql`
      SELECT id, name, slug, description, start_date, end_date, location, status, created_at
      FROM events
      ORDER BY created_at DESC
    `;
    return Response.json({ events });
  } catch (error) {
    console.error("GET /api/events failed", error);
    return Response.json({ error: "Unable to load events" }, { status: 500 });
  }
}
