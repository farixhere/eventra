import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();

    // Final results are the official position/prize record.
    const results = await sql`
      SELECT r.id, r.programme_id, r.participant_id, r.team_id, r.position, r.total_score, r.points, r.published,
             r.created_at, p.name AS programme_name, p.type AS programme_type,
             COALESCE(part.name, team.name) AS entry_name, team.name AS team_name
      FROM results r
      JOIN programmes p ON p.id = r.programme_id
      LEFT JOIN participants part ON part.id = r.participant_id
      LEFT JOIN teams team ON team.id = r.team_id
      WHERE p.event_id = ${eventId}
      ORDER BY r.published DESC, r.position ASC, r.created_at ASC
    `;

    return Response.json({ results });
  } catch (error) {
    console.error("GET /api/results failed", error);
    return Response.json({ error: "Unable to load results" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.eventId || !body.programmeId) return Response.json({ error: "Event and programme are required" }, { status: 400 });
    const position = Number(body.position);
    if (!Number.isInteger(position) || position < 1) return Response.json({ error: "Position must be a positive whole number" }, { status: 400 });
    const sql = getDb();
    const programmes = await sql`SELECT id, event_id, type FROM programmes WHERE id = ${body.programmeId} AND event_id = ${body.eventId}`;
    if (!programmes[0]) return Response.json({ error: "Programme not found" }, { status: 404 });
    const programme = programmes[0];
    const participantId = body.participantId || null;
    const teamId = body.teamId || null;
    if (programme.type === "team" && !teamId) return Response.json({ error: "Select a team for this programme" }, { status: 400 });
    if (programme.type === "individual" && !participantId) return Response.json({ error: "Select a participant for this programme" }, { status: 400 });
    const duplicate = await sql`SELECT id FROM results WHERE programme_id = ${body.programmeId} AND COALESCE(participant_id::text, '') = COALESCE(${participantId}::text, '') AND COALESCE(team_id::text, '') = COALESCE(${teamId}::text, '')`;
    if (duplicate[0]) return Response.json({ error: "A result already exists for this entry" }, { status: 409 });
    const rows = await sql`
      INSERT INTO results (programme_id, participant_id, team_id, position, total_score, points, published)
      VALUES (${body.programmeId}, ${participantId}, ${teamId}, ${position}, ${body.totalScore === "" || body.totalScore == null ? null : Number(body.totalScore)}, ${body.points === "" || body.points == null ? 0 : Number(body.points)}, ${Boolean(body.published)})
      RETURNING id, programme_id, participant_id, team_id, position, total_score, points, published, created_at
    `;
    return Response.json({ result: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/results failed", error);
    return Response.json({ error: "Unable to create result" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    if (!body.id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    const rows = await sql`
      UPDATE results
      SET published = ${Boolean(body.published)}
      WHERE id = ${body.id}
      RETURNING id, programme_id, participant_id, team_id, position, total_score, points, published, created_at
    `;
    if (!rows[0]) return Response.json({ error: "Result not found" }, { status: 404 });
    return Response.json({ result: rows[0] });
  } catch (error) {
    console.error("PATCH /api/results failed", error);
    return Response.json({ error: "Unable to update result" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM results WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/results failed", error);
    return Response.json({ error: "Unable to delete result" }, { status: 500 });
  }
}
