import { getDb } from "../../../lib/db";

function makeNumber() {
  return "CARD-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const cards = await sql`
      SELECT c.*, p.name AS participant_name, p.participant_code
      FROM id_cards c JOIN participants p ON p.id=c.participant_id
      WHERE c.event_id=${eventId} ORDER BY c.created_at DESC
    `;
    return Response.json({ cards });
  } catch (error) {
    return Response.json({ error: "Unable to load ID cards" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.eventId || !body.participantId) return Response.json({ error: "Event and participant are required" }, { status: 400 });
    const sql = getDb();
    const number = body.cardNumber?.trim() || makeNumber();
    const rows = await sql`
      INSERT INTO id_cards (event_id, participant_id, card_number, file_url)
      VALUES (${body.eventId}, ${body.participantId}, ${number}, ${body.fileUrl || null})
      RETURNING *
    `;
    return Response.json({ card: rows[0] }, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Unable to create ID card" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  const sql = getDb();
  await sql`DELETE FROM id_cards WHERE id=${id}`;
  return Response.json({ ok: true });
}
