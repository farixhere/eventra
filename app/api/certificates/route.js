import { getDb } from "../../../lib/db";

function makeNumber() {
  return "EVT-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const certificates = await sql`
      SELECT c.*, COALESCE(p.name,t.name) AS recipient_name, pr.name AS programme_name
      FROM certificates c
      LEFT JOIN participants p ON p.id=c.participant_id
      LEFT JOIN teams t ON t.id=c.team_id
      LEFT JOIN results r ON r.id=c.result_id
      LEFT JOIN programmes pr ON pr.id=r.programme_id
      WHERE c.event_id=${eventId}
      ORDER BY c.created_at DESC
    `;
    return Response.json({ certificates });
  } catch (error) {
    return Response.json({ error: "Unable to load certificates" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.eventId || !body.title) return Response.json({ error: "Event and certificate title are required" }, { status: 400 });
    const sql = getDb();
    const number = body.certificateNumber?.trim() || makeNumber();
    const rows = await sql`
      INSERT INTO certificates (event_id, result_id, participant_id, team_id, title, certificate_type, certificate_number, file_url)
      VALUES (${body.eventId}, ${body.resultId || null}, ${body.participantId || null}, ${body.teamId || null}, ${body.title.trim()}, ${body.certificateType || "participation"}, ${number}, ${body.fileUrl || null})
      RETURNING *
    `;
    return Response.json({ certificate: rows[0] }, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Unable to create certificate" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  const sql = getDb();
  await sql`DELETE FROM certificates WHERE id=${id}`;
  return Response.json({ ok: true });
}
