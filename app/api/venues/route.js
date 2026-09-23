import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const venues = await sql`SELECT id, name, location, capacity, created_at FROM venues WHERE event_id = ${eventId} ORDER BY created_at DESC`;
    return Response.json({ venues });
  } catch (error) {
    console.error("GET /api/venues failed", error);
    return Response.json({ error: "Unable to load venues" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.eventId || !body.name?.trim()) return Response.json({ error: "Event and venue name are required" }, { status: 400 });
    const sql = getDb();
    const rows = await sql`
      INSERT INTO venues (event_id, name, location, capacity)
      VALUES (${body.eventId}, ${body.name.trim()}, ${body.location?.trim() || null}, ${body.capacity ? Number(body.capacity) : null})
      RETURNING id, name, location, capacity, created_at
    `;
    return Response.json({ venue: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/venues failed", error);
    return Response.json({ error: "Unable to create venue" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM venues WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/venues failed", error);
    return Response.json({ error: "Unable to delete venue" }, { status: 500 });
  }
}


export async function PATCH(request) {
  try {
    const body = await request.json();
    if (!body.id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    const rows = await sql`
      UPDATE venues
      SET name=COALESCE(NULLIF(TRIM(${body.name || ""}),''),name),
          location=CASE WHEN ${body.location === undefined} THEN location ELSE NULLIF(TRIM(${body.location || ""}),'') END,
          capacity=CASE WHEN ${body.capacity === undefined} THEN capacity ELSE NULLIF(${body.capacity || ""},'')::integer END
      WHERE id=${body.id}
      RETURNING id,name,location,capacity,created_at
    `;
    if (!rows[0]) return Response.json({ error: "Venue not found" }, { status: 404 });
    return Response.json({ venue: rows[0] });
  } catch (error) {
    console.error("PATCH /api/venues failed", error);
    return Response.json({ error: "Unable to update venue" }, { status: 500 });
  }
}
