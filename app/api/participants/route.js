import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const participants = await sql`
      SELECT p.id, p.name, p.email, p.phone, p.participant_code, p.team_id, t.name AS team_name, p.created_at
      FROM participants p
      LEFT JOIN teams t ON t.id = p.team_id
      WHERE p.event_id = ${eventId}
      ORDER BY p.created_at DESC
    `;
    return Response.json({ participants });
  } catch (error) {
    console.error("GET /api/participants failed", error);
    return Response.json({ error: "Unable to load participants" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.eventId || !body.name?.trim()) return Response.json({ error: "Event and participant name are required" }, { status: 400 });
    const sql = getDb();
    const code = body.participantCode?.trim() || `P-${Date.now().toString(36).toUpperCase()}`;
    const rows = await sql`
      INSERT INTO participants (event_id, team_id, name, email, phone, participant_code)
      VALUES (${body.eventId}, ${body.teamId || null}, ${body.name.trim()}, ${body.email?.trim() || null}, ${body.phone?.trim() || null}, ${code})
      RETURNING id, name, email, phone, participant_code, team_id, created_at
    `;
    return Response.json({ participant: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/participants failed", error);
    if (error?.code === "23505") return Response.json({ error: "That participant code already exists in this event" }, { status: 409 });
    return Response.json({ error: "Unable to create participant" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM participants WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/participants failed", error);
    return Response.json({ error: "Unable to delete participant" }, { status: 500 });
  }
}
