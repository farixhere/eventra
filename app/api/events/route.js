import { getDb } from "../../../lib/db";

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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

export async function POST(request) {
  try {
    const body = await request.json();
    const name = body.name?.trim();
    const description = body.description?.trim() || null;
    const location = body.location?.trim() || null;
    const startDate = body.startDate || null;
    const endDate = body.endDate || null;

    if (!name) {
      return Response.json({ error: "Event name is required" }, { status: 400 });
    }

    const sql = getDb();
    const organizerRows = await sql`
      INSERT INTO organizers (email, name)
      VALUES ('owner@eventra.local', 'Eventra Organizer')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;

    const baseSlug = makeSlug(name) || "event";
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const rows = await sql`
      INSERT INTO events (
        organizer_id, name, slug, description, start_date, end_date, location, status
      )
      VALUES (
        ${organizerRows[0].id},
        ${name},
        ${slug},
        ${description},
        ${startDate},
        ${endDate},
        ${location},
        'draft'
      )
      RETURNING id, name, slug, description, start_date, end_date, location, status, created_at
    `;

    return Response.json({ event: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/events failed", error);
    return Response.json({ error: "Unable to create event" }, { status: 500 });
  }
}


export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });

    const sql = getDb();
    await sql.transaction([
      sql`DELETE FROM scores WHERE programme_id IN (SELECT id FROM programmes WHERE event_id = ${id})`,
      sql`DELETE FROM results WHERE programme_id IN (SELECT id FROM programmes WHERE event_id = ${id})`,
      sql`DELETE FROM schedules WHERE programme_id IN (SELECT id FROM programmes WHERE event_id = ${id})`,
      sql`DELETE FROM registrations WHERE programme_id IN (SELECT id FROM programmes WHERE event_id = ${id})`,
      sql`DELETE FROM announcements WHERE event_id = ${id}`,
      sql`DELETE FROM judges WHERE event_id = ${id}`,
      sql`DELETE FROM programmes WHERE event_id = ${id}`,
      sql`DELETE FROM participants WHERE event_id = ${id}`,
      sql`DELETE FROM teams WHERE event_id = ${id}`,
      sql`DELETE FROM venues WHERE event_id = ${id}`,
      sql`DELETE FROM events WHERE id = ${id}`
    ]);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/events failed", error);
    return Response.json({ error: "Unable to delete event" }, { status: 500 });
  }
}
