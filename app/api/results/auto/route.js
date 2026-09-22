import { getDb } from "../../../../lib/db";

const DEFAULT_POINTS = [10, 7, 5, 3, 2, 1];

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.eventId) return Response.json({ error: "eventId is required" }, { status: 400 });

    const sql = getDb();
    const programmes = await sql`
      SELECT id, name, type
      FROM programmes
      WHERE event_id = ${body.eventId}
      ORDER BY name ASC
    `;

    let created = 0;
    let skipped = 0;

    for (const programme of programmes) {
      const criteria = await sql`SELECT id FROM scoring_criteria WHERE programme_id = ${programme.id} ORDER BY sort_order ASC`;
      let rows;
      if (criteria.length) {
        rows = await sql`
          SELECT participant_id, team_id, AVG(judge_total)::numeric AS average_score
          FROM (
            SELECT s.judge_id, s.participant_id, s.team_id, SUM(s.score)::numeric AS judge_total
            FROM scores s
            WHERE s.programme_id = ${programme.id}
            GROUP BY s.judge_id, s.participant_id, s.team_id
          ) judged
          GROUP BY participant_id, team_id
          ORDER BY average_score DESC
        `;
      } else {
        rows = await sql`
          SELECT s.participant_id, s.team_id, AVG(s.score)::numeric AS average_score
          FROM scores s
          WHERE s.programme_id = ${programme.id}
          GROUP BY s.participant_id, s.team_id
          ORDER BY average_score DESC
        `;
      }

      if (!rows.length) continue;

      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const exists = await sql`
          SELECT id FROM results
          WHERE programme_id = ${programme.id}
            AND COALESCE(participant_id::text, '') = COALESCE(${row.participant_id}::text, '')
            AND COALESCE(team_id::text, '') = COALESCE(${row.team_id}::text, '')
        `;

        if (exists[0]) {
          skipped += 1;
          continue;
        }

        const pointRule = await sql`SELECT points FROM programme_point_rules WHERE programme_id = ${programme.id} AND position = ${index + 1}`;
        const points = pointRule[0] ? Number(pointRule[0].points) : (DEFAULT_POINTS[index] || 0);
        await sql`
          INSERT INTO results (programme_id, participant_id, team_id, position, total_score, points, published)
          VALUES (
            ${programme.id},
            ${row.participant_id || null},
            ${row.team_id || null},
            ${index + 1},
            ${Number(row.average_score)},
            ${points},
            false
          )
        `;
        created += 1;
      }
    }

    return Response.json({
      ok: true,
      created,
      skipped,
      message: created
        ? "Draft results generated from judge scores."
        : "No new draft results were generated."
    });
  } catch (error) {
    console.error("POST /api/results/auto failed", error);
    return Response.json({ error: "Unable to generate draft results" }, { status: 500 });
  }
}
