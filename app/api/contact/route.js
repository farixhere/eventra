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
    if (!body.eventId || !body.name?.trim() || !body.email?.trim() || !body.message?.trim()) {
      return Response.json({ error: "Name, email and message are required" }, { status: 400 });
    }
    const sql = getDb();
    const rows = await sql`
      INSERT INTO contact_messages (event_id, name, email, subject, message)
      VALUES (${body.eventId}, ${body.name.trim()}, ${body.email.trim()}, ${body.subject?.trim() || null}, ${body.message.trim()})
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
