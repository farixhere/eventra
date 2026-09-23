import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const teams = await sql`SELECT id, name, code, created_at FROM teams WHERE event_id = ${eventId} ORDER BY created_at DESC`;
    return Response.json({ teams });
  } catch (error) {
    console.error("GET /api/teams failed", error);
    return Response.json({ error: "Unable to load teams" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.eventId || !body.name?.trim()) return Response.json({ error: "Event and team name are required" }, { status: 400 });
    const sql = getDb();
    const rows = await sql`
      INSERT INTO teams (event_id, name, code)
      VALUES (${body.eventId}, ${body.name.trim()}, ${body.code?.trim() || null})
      RETURNING id, name, code, created_at
    `;
    return Response.json({ team: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/teams failed", error);
    if (error?.code === "23505") return Response.json({ error: "A team with that name already exists in this event" }, { status: 409 });
    return Response.json({ error: "Unable to create team" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM teams WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/teams failed", error);
    return Response.json({ error: "Unable to delete team" }, { status: 500 });
  }
}


export async function PATCH(request) {
  try {
    const body = await request.json();
    if (!body.id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    const rows = await sql`
      UPDATE teams
      SET name=COALESCE(NULLIF(TRIM(${body.name || ""}),''),name),
          code=CASE WHEN ${body.code === undefined} THEN code ELSE NULLIF(TRIM(${body.code || ""}),'') END,
          description=CASE WHEN ${body.description === undefined} THEN description ELSE NULLIF(TRIM(${body.description || ""}),'') END
      WHERE id=${body.id}
      RETURNING id,name,code,description,created_at
    `;
    if (!rows[0]) return Response.json({ error: "Team not found" }, { status: 404 });
    return Response.json({ team: rows[0] });
  } catch (error) {
    console.error("PATCH /api/teams failed", error);
    return Response.json({ error: "Unable to update team" }, { status: 500 });
  }
}
