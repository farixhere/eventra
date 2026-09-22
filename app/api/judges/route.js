import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const judges = await sql`
      SELECT id, event_id, name, email, created_at
      FROM judges
      WHERE event_id = ${eventId}
      ORDER BY created_at ASC, name ASC
    `;
    return Response.json({ judges });
  } catch (error) {
    console.error("GET /api/judges failed", error);
    return Response.json({ error: "Unable to load judges" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.eventId || !body.name?.trim()) {
      return Response.json({ error: "Event and judge name are required" }, { status: 400 });
    }
    const sql = getDb();
    const events = await sql`SELECT id FROM events WHERE id = ${body.eventId}`;
    if (!events[0]) return Response.json({ error: "Event not found" }, { status: 404 });
    const email = body.email?.trim() || null;
    if (email) {
      const duplicate = await sql`SELECT id FROM judges WHERE event_id = ${body.eventId} AND LOWER(email) = LOWER(${email})`;
      if (duplicate[0]) return Response.json({ error: "A judge with this email already exists in the event" }, { status: 409 });
    }
    const rows = await sql`
      INSERT INTO judges (event_id, name, email)
      VALUES (${body.eventId}, ${body.name.trim()}, ${email})
      RETURNING id, event_id, name, email, created_at
    `;
    return Response.json({ judge: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/judges failed", error);
    return Response.json({ error: "Unable to create judge" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM judges WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/judges failed", error);
    return Response.json({ error: "Unable to delete judge" }, { status: 500 });
  }
}
