import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const criteria = await sql`
      SELECT c.id, c.programme_id, c.name, c.max_score, c.sort_order, c.created_at,
             p.name AS programme_name
      FROM scoring_criteria c
      JOIN programmes p ON p.id = c.programme_id
      WHERE p.event_id = ${eventId}
      ORDER BY p.name ASC, c.sort_order ASC, c.created_at ASC
    `;
    return Response.json({ criteria });
  } catch (error) {
    console.error("GET /api/criteria failed", error);
    return Response.json({ error: "Unable to load scoring criteria" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.eventId || !body.programmeId || !body.name?.trim()) {
      return Response.json({ error: "Event, programme and criterion name are required" }, { status: 400 });
    }
    const maxScore = Number(body.maxScore);
    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      return Response.json({ error: "Maximum score must be greater than 0" }, { status: 400 });
    }
    const sql = getDb();
    const programme = await sql`SELECT id FROM programmes WHERE id = ${body.programmeId} AND event_id = ${body.eventId}`;
    if (!programme[0]) return Response.json({ error: "Programme not found" }, { status: 404 });
    const count = await sql`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM scoring_criteria WHERE programme_id = ${body.programmeId}`;
    const rows = await sql`
      INSERT INTO scoring_criteria (programme_id, name, max_score, sort_order)
      VALUES (${body.programmeId}, ${body.name.trim()}, ${maxScore}, ${Number(count[0].next_order)})
      RETURNING id, programme_id, name, max_score, sort_order, created_at
    `;
    return Response.json({ criterion: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/criteria failed", error);
    return Response.json({ error: "Unable to create scoring criterion" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM scoring_criteria WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/criteria failed", error);
    return Response.json({ error: "Unable to delete scoring criterion" }, { status: 500 });
  }
}
