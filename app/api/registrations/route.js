import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const registrations = await sql`
      SELECT r.id, r.programme_id, r.participant_id, r.team_id, r.status, r.created_at,
             p.name AS participant_name, p.participant_code,
             t.name AS team_name,
             pr.name AS programme_name, pr.type AS programme_type
      FROM registrations r
      JOIN programmes pr ON pr.id = r.programme_id
      LEFT JOIN participants p ON p.id = r.participant_id
      LEFT JOIN teams t ON t.id = r.team_id
      WHERE pr.event_id = ${eventId}
      ORDER BY r.created_at DESC
    `;
    return Response.json({ registrations });
  } catch (error) {
    console.error("GET /api/registrations failed", error);
    return Response.json({ error: "Unable to load registrations" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.programmeId || (!body.participantId && !body.teamId)) {
      return Response.json({ error: "Programme and participant/team are required" }, { status: 400 });
    }
    const sql = getDb();
    const programme = await sql`SELECT id, event_id, type, max_participants FROM programmes WHERE id = ${body.programmeId}`;
    if (!programme[0]) return Response.json({ error: "Programme not found" }, { status: 404 });
    if (programme[0].type === "individual" && !body.participantId) return Response.json({ error: "Individual programmes require a participant" }, { status: 400 });
    if (programme[0].type === "team" && !body.teamId) return Response.json({ error: "Team programmes require a team" }, { status: 400 });
    if (programme[0].max_participants) {
      const count = await sql`SELECT COUNT(*)::int AS count FROM registrations WHERE programme_id = ${body.programmeId} AND status = 'registered'`;
      if (count[0].count >= programme[0].max_participants) return Response.json({ error: "This programme has reached its participant limit" }, { status: 409 });
    }
    const duplicate = await sql`SELECT id FROM registrations WHERE programme_id = ${body.programmeId} AND COALESCE(participant_id::text, '') = COALESCE(${body.participantId || null}::text, '') AND COALESCE(team_id::text, '') = COALESCE(${body.teamId || null}::text, '') AND status = 'registered'`;
    if (duplicate[0]) return Response.json({ error: "Already registered for this programme" }, { status: 409 });
    const rows = await sql`
      INSERT INTO registrations (programme_id, participant_id, team_id, status)
      VALUES (${body.programmeId}, ${body.participantId || null}, ${body.teamId || null}, 'registered')
      RETURNING id, programme_id, participant_id, team_id, status, created_at
    `;
    return Response.json({ registration: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/registrations failed", error);
    return Response.json({ error: "Unable to create registration" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM registrations WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/registrations failed", error);
    return Response.json({ error: "Unable to delete registration" }, { status: 500 });
  }
}
