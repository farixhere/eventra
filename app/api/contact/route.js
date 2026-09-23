import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const messages = await sql`
      SELECT id, name, email, subject, message, status, created_at
      FROM contact_messages WHERE event_id=${eventId}
      ORDER BY created_at DESC
    `;
    return Response.json({ messages });
  } catch (error) {
    return Response.json({ error: "Unable to load contact messages" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if ((!body.eventId && !body.eventSlug) || !body.name?.trim() || !body.email?.trim() || !body.message?.trim()) {
      return Response.json({ error: "Event, name, email and message are required" }, { status: 400 });
    }
    const sql = getDb();
    const eventRows = body.eventId
      ? await sql`SELECT id, is_public FROM events WHERE id=${body.eventId} LIMIT 1`
      : await sql`SELECT id, is_public FROM events WHERE slug=${body.eventSlug} LIMIT 1`;
    if (!eventRows.length) return Response.json({ error: "Event not found" }, { status: 404 });
    if (!eventRows[0].is_public) return Response.json({ error: "This event is not public yet" }, { status: 403 });
    const rows = await sql`
      INSERT INTO contact_messages (event_id, name, email, subject, message)
      VALUES (${eventRows[0].id}, ${body.name.trim()}, ${body.email.trim()}, ${body.subject?.trim() || null}, ${body.message.trim()})
      RETURNING *
    `;
    return Response.json({ message: rows[0] }, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Unable to send message" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const body = await request.json();
  if (!body.id || !body.status) return Response.json({ error: "id and status are required" }, { status: 400 });
  const sql = getDb();
  const rows = await sql`UPDATE contact_messages SET status=${body.status} WHERE id=${body.id} RETURNING *`;
  if (!rows[0]) return Response.json({ error: "Message not found" }, { status: 404 });
  return Response.json({ message: rows[0] });
}


export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM contact_messages WHERE id=${id}`;
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Unable to delete contact message" }, { status: 500 });
  }
}
