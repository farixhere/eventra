import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const leaderboard = await sql`
      SELECT
        t.id AS team_id,
        t.name AS team_name,
        t.code AS team_code,
        COALESCE(SUM(CASE WHEN r.published THEN COALESCE(r.points, 0) ELSE 0 END), 0) AS total_points,
        COUNT(DISTINCT CASE WHEN r.published THEN r.id END) AS result_count,
        COUNT(DISTINCT CASE WHEN r.published AND r.position = 1 THEN r.id END) AS first_places,
        COUNT(DISTINCT CASE WHEN r.published AND r.position = 2 THEN r.id END) AS second_places,
        COUNT(DISTINCT CASE WHEN r.published AND r.position = 3 THEN r.id END) AS third_places
      FROM teams t
      LEFT JOIN results r
        ON r.team_id = t.id
        OR r.participant_id IN (SELECT p.id FROM participants p WHERE p.team_id = t.id)
      WHERE t.event_id = ${eventId}
      GROUP BY t.id, t.name, t.code
      ORDER BY total_points DESC, first_places DESC, second_places DESC, third_places DESC, team_name ASC
    `;
    return Response.json({ leaderboard });
  } catch (error) {
    console.error("GET /api/leaderboard failed", error);
    return Response.json({ error: "Unable to load leaderboard" }, { status: 500 });
  }
}
