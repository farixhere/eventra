import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const scores = await sql`
      SELECT s.id, s.programme_id, s.judge_id, s.participant_id, s.team_id, s.score, s.notes, s.created_at,
             p.name AS programme_name, p.type AS programme_type,
             j.name AS judge_name,
             COALESCE(part.name, team.name) AS entry_name,
             team.name AS team_name
      FROM scores s
      JOIN programmes p ON p.id = s.programme_id
      JOIN judges j ON j.id = s.judge_id
      LEFT JOIN participants part ON part.id = s.participant_id
      LEFT JOIN teams team ON team.id = s.team_id
      WHERE p.event_id = ${eventId}
      ORDER BY p.name ASC, s.score DESC, s.created_at ASC
    `;
    return Response.json({ scores });
  } catch (error) {
    console.error("GET /api/scores failed", error);
    return Response.json({ error: "Unable to load scores" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.eventId || !body.programmeId || !body.judgeId) {
      return Response.json({ error: "Event, programme and judge are required" }, { status: 400 });
    }
    const score = Number(body.score);
    if (!Number.isFinite(score) || score < 0) {
      return Response.json({ error: "Score must be a valid non-negative number" }, { status: 400 });
    }
    const sql = getDb();
    const programmes = await sql`SELECT id, event_id, type FROM programmes WHERE id = ${body.programmeId} AND event_id = ${body.eventId}`;
    const judges = await sql`SELECT id FROM judges WHERE id = ${body.judgeId} AND event_id = ${body.eventId}`;
    if (!programmes[0]) return Response.json({ error: "Programme not found" }, { status: 404 });
    if (!judges[0]) return Response.json({ error: "Judge not found" }, { status: 404 });

    const participantId = body.participantId || null;
    const teamId = body.teamId || null;
    if (programmes[0].type === "team" && !teamId) return Response.json({ error: "Select a team" }, { status: 400 });
    if (programmes[0].type === "individual" && !participantId) return Response.json({ error: "Select a participant" }, { status: 400 });

    if (participantId) {
      const participant = await sql`SELECT id FROM participants WHERE id = ${participantId} AND event_id = ${body.eventId}`;
      if (!participant[0]) return Response.json({ error: "Participant not found" }, { status: 404 });
    }
    if (teamId) {
      const team = await sql`SELECT id FROM teams WHERE id = ${teamId} AND event_id = ${body.eventId}`;
      if (!team[0]) return Response.json({ error: "Team not found" }, { status: 404 });
    }

    const duplicate = await sql`
      SELECT id FROM scores
      WHERE programme_id = ${body.programmeId}
        AND judge_id = ${body.judgeId}
        AND COALESCE(participant_id::text, '') = COALESCE(${participantId}::text, '')
        AND COALESCE(team_id::text, '') = COALESCE(${teamId}::text, '')
    `;
    if (duplicate[0]) return Response.json({ error: "This judge has already scored this entry" }, { status: 409 });

    const rows = await sql`
      INSERT INTO scores (programme_id, judge_id, participant_id, team_id, score, notes)
      VALUES (${body.programmeId}, ${body.judgeId}, ${participantId}, ${teamId}, ${score}, ${body.notes?.trim() || null})
      RETURNING id, programme_id, judge_id, participant_id, team_id, score, notes, created_at
    `;
    return Response.json({ score: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/scores failed", error);
    return Response.json({ error: "Unable to save score" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM scores WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/scores failed", error);
    return Response.json({ error: "Unable to delete score" }, { status: 500 });
  }
}
