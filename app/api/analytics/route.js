import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const [overview, registrationGrowth, programmeParticipation, scheduleProgress, resultProgress, certificateProgress] = await Promise.all([
      sql`SELECT
        (SELECT COUNT(*) FROM participants WHERE event_id=${eventId})::int AS participants,
        (SELECT COUNT(*) FROM teams WHERE event_id=${eventId})::int AS teams,
        (SELECT COUNT(*) FROM programmes WHERE event_id=${eventId})::int AS programmes,
        (SELECT COUNT(*) FROM registrations r JOIN programmes p ON p.id=r.programme_id WHERE p.event_id=${eventId})::int AS registrations,
        (SELECT COUNT(*) FROM schedules s JOIN programmes p ON p.id=s.programme_id WHERE p.event_id=${eventId})::int AS schedules,
        (SELECT COUNT(*) FROM schedules s JOIN programmes p ON p.id=s.programme_id WHERE p.event_id=${eventId} AND LOWER(COALESCE(s.status,'')) IN ('completed','complete','finished'))::int AS completed_programmes,
        (SELECT COUNT(*) FROM results r JOIN programmes p ON p.id=r.programme_id WHERE p.event_id=${eventId} AND r.published=true)::int AS published_results,
        (SELECT COUNT(*) FROM certificates WHERE event_id=${eventId})::int AS certificates,
        (SELECT COUNT(*) FROM id_cards WHERE event_id=${eventId})::int AS id_cards,
        (SELECT COUNT(*) FROM contact_messages WHERE event_id=${eventId} AND LOWER(COALESCE(status,'unread'))='unread')::int AS unread_messages`,
      sql`SELECT TO_CHAR(DATE_TRUNC('day',r.created_at),'YYYY-MM-DD') AS day, COUNT(*)::int AS count
          FROM registrations r JOIN programmes p ON p.id=r.programme_id WHERE p.event_id=${eventId}
          GROUP BY DATE_TRUNC('day',r.created_at) ORDER BY DATE_TRUNC('day',r.created_at)`,
      sql`SELECT p.name, COUNT(r.id)::int AS registrations
          FROM programmes p LEFT JOIN registrations r ON r.programme_id=p.id
          WHERE p.event_id=${eventId} GROUP BY p.id,p.name ORDER BY registrations DESC,p.name ASC LIMIT 12`,
      sql`SELECT COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE LOWER(COALESCE(s.status,'')) IN ('completed','complete','finished'))::int AS completed,
          COUNT(*) FILTER (WHERE LOWER(COALESCE(s.status,'')) IN ('cancelled','canceled'))::int AS cancelled
          FROM schedules s JOIN programmes p ON p.id=s.programme_id WHERE p.event_id=${eventId}`,
      sql`SELECT COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE r.published=true)::int AS published,
          COUNT(*) FILTER (WHERE r.published=false OR r.published IS NULL)::int AS draft
          FROM results r JOIN programmes p ON p.id=r.programme_id WHERE p.event_id=${eventId}`,
      sql`SELECT COUNT(*)::int AS certificates,
          (SELECT COUNT(*) FROM results r JOIN programmes p ON p.id=r.programme_id WHERE p.event_id=${eventId} AND r.published=true)::int AS eligible
          FROM certificates c WHERE c.event_id=${eventId}`
    ]);
    const o=overview[0]||{}, sp=scheduleProgress[0]||{}, rp=resultProgress[0]||{}, cp=certificateProgress[0]||{};
    const schedules=Number(o.schedules||0), completed=Number(o.completed_programmes||0);
    const results=Number(rp.total||0), published=Number(rp.published||0), eligible=Number(cp.eligible||0), generated=Number(cp.certificates||0);
    return NextResponse.json({
      overview:Object.fromEntries(Object.entries(o).map(([k,v])=>[k,Number(v||0)])),
      charts:{
        registration_growth:registrationGrowth,
        programme_participation:programmeParticipation,
        schedule_completion:{total:schedules,completed,cancelled:Number(sp.cancelled||0),percentage:schedules?Math.round(completed/schedules*100):0},
        result_publication:{total:results,published,draft:Number(rp.draft||0),percentage:results?Math.round(published/results*100):0},
        certificate_progress:{eligible,generated,pending:Math.max(eligible-generated,0),percentage:eligible?Math.min(100,Math.round(generated/eligible*100)):0}
      },
      generated_at:new Date().toISOString()
    });
  } catch(error) {
    console.error("GET /api/analytics failed",error);
    return NextResponse.json({error:"Unable to load analytics"},{status:500});
  }
}