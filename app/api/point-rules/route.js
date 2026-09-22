import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const rules = await sql`
      SELECT r.id, r.programme_id, r.position, r.points, r.created_at, p.name AS programme_name
      FROM programme_point_rules r
      JOIN programmes p ON p.id = r.programme_id
      WHERE p.event_id = ${eventId}
      ORDER BY p.name ASC, r.position ASC
    `;
    return Response.json({ rules });
  } catch (error) {
    console.error("GET /api/point-rules failed", error);
    return Response.json({ error: "Unable to load point rules" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.eventId || !body.programmeId) return Response.json({ error: "Event and programme are required" }, { status: 400 });
    const position = Number(body.position);
    const points = Number(body.points);
    if (!Number.isInteger(position) || position < 1) return Response.json({ error: "Position must be a positive whole number" }, { status: 400 });
    if (!Number.isFinite(points) || points < 0) return Response.json({ error: "Points must be a non-negative number" }, { status: 400 });
    const sql = getDb();
    const programme = await sql`SELECT id FROM programmes WHERE id = ${body.programmeId} AND event_id = ${body.eventId}`;
    if (!programme[0]) return Response.json({ error: "Programme not found" }, { status: 404 });
    const rows = await sql`
      INSERT INTO programme_point_rules (programme_id, position, points)
      VALUES (${body.programmeId}, ${position}, ${points})
      ON CONFLICT (programme_id, position) DO UPDATE SET points = EXCLUDED.points
      RETURNING id, programme_id, position, points, created_at
    `;
    return Response.json({ rule: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/point-rules failed", error);
    return Response.json({ error: "Unable to save point rule" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM programme_point_rules WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/point-rules failed", error);
    return Response.json({ error: "Unable to delete point rule" }, { status: 500 });
  }
}
