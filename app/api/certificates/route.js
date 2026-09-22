import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const certificates = await sql`
      SELECT r.id, r.programme_id, r.participant_id, r.team_id, r.position, r.total_score, r.points,
             p.name AS programme_name, p.type AS programme_type,
             COALESCE(part.name, team.name) AS recipient_name,
             COALESCE(part.email, '') AS recipient_email,
             team.name AS team_name,
             e.name AS event_name
      FROM results r
      JOIN programmes p ON p.id = r.programme_id
      JOIN events e ON e.id = p.event_id
      LEFT JOIN participants part ON part.id = r.participant_id
      LEFT JOIN teams team ON team.id = r.team_id
      WHERE p.event_id = ${eventId} AND r.published = true
      ORDER BY r.position ASC, recipient_name ASC
    `;
    return Response.json({ certificates });
  } catch (error) {
    console.error("GET /api/certificates failed", error);
    return Response.json({ error: "Unable to load certificates" }, { status: 500 });
  }
}
