import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const [counts, published, views] = await Promise.all([
      sql`SELECT
        (SELECT COUNT(*)::int FROM participants WHERE event_id=${eventId}) AS participants,
        (SELECT COUNT(*)::int FROM registrations r JOIN programmes p ON p.id=r.programme_id WHERE p.event_id=${eventId}) AS registrations,
        (SELECT COUNT(*)::int FROM programmes WHERE event_id=${eventId}) AS programmes,
        (SELECT COUNT(*)::int FROM schedules s JOIN programmes p ON p.id=s.programme_id WHERE p.event_id=${eventId}) AS schedules,
        (SELECT COUNT(*)::int FROM teams WHERE event_id=${eventId}) AS teams
      `,
      sql`SELECT COUNT(*)::int AS results FROM results r JOIN programmes p ON p.id=r.programme_id WHERE p.event_id=${eventId} AND r.published=true`,
      sql`SELECT COALESCE(page_views,0)::int AS page_views, COALESCE(certificate_downloads,0)::int AS certificate_downloads FROM event_analytics WHERE event_id=${eventId} LIMIT 1`
    ]);
    return Response.json({
      analytics: {
        ...counts[0],
        published_results: published[0]?.results || 0,
        page_views: views[0]?.page_views || 0,
        certificate_downloads: views[0]?.certificate_downloads || 0
      }
    });
  } catch (error) {
    return Response.json({ error: "Unable to load analytics" }, { status: 500 });
  }
}
