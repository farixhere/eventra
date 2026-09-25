import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const slug = new URL(request.url).searchParams.get("slug");
    if (!slug) return Response.json({ error: "slug is required" }, { status: 400 });
    const sql = getDb();
    const events = await sql`SELECT id,name,slug,description,tagline,start_date,end_date,location,is_public,registration_open,registration_deadline,primary_color,secondary_color FROM events WHERE slug=${slug} LIMIT 1`;
    if (!events.length) return Response.json({ error: "Event not found" }, { status: 404 });
    const event = events[0];
    if (!event.is_public) return Response.json({ error: "This event is not public yet" }, { status: 403 });
    const programmes = await sql`SELECT id,name,category,type,max_participants FROM programmes WHERE event_id=${event.id} ORDER BY category NULLS LAST,name`;
    const counts = await sql`SELECT programme_id,COUNT(*)::int AS count FROM registrations WHERE status='registered' AND programme_id IN (SELECT id FROM programmes WHERE event_id=${event.id}) GROUP BY programme_id`;
    const countMap = Object.fromEntries(counts.map(x => [x.programme_id, x.count]));
    return Response.json({ event, programmes: programmes.map(p => ({ ...p, registered_count: countMap[p.id] || 0 })) });
  } catch (error) {
    console.error("GET /api/public-registration failed", error);
    return Response.json({ error: "Unable to load registration details" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.slug || !body.name?.trim()) return Response.json({ error: "Event and name are required" }, { status: 400 });
    const sql = getDb();
    const events = await sql`SELECT id,is_public,registration_open,registration_deadline FROM events WHERE slug=${body.slug} LIMIT 1`;
    if (!events.length) return Response.json({ error: "Event not found" }, { status: 404 });
    const event = events[0];
    if (!event.is_public) return Response.json({ error: "This event is not public yet" }, { status: 403 });
    if (!event.registration_open) return Response.json({ error: "Registration is currently closed" }, { status: 403 });
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) return Response.json({ error: "Registration deadline has passed" }, { status: 403 });

    let code = body.participantCode?.trim() || null;
    if (code) {
      const exists = await sql`SELECT id FROM participants WHERE event_id=${event.id} AND participant_code=${code}`;
      if (exists.length) return Response.json({ error: "That participant code is already in use" }, { status: 409 });
    }
    if (!code) code = "P" + String(Date.now()).slice(-6);

    let programme = null;
    if (body.programmeId) {
      const rows = await sql`SELECT id,event_id,type,max_participants FROM programmes WHERE id=${body.programmeId} AND event_id=${event.id} LIMIT 1`;
      if (!rows.length) return Response.json({ error: "Selected programme is not available for this event" }, { status: 400 });
      programme = rows[0];
      if (programme.type !== "individual") return Response.json({ error: "Team programmes are registered by the organiser. Please contact the event team." }, { status: 400 });
      if (programme.max_participants) {
        const count = await sql`SELECT COUNT(*)::int AS count FROM registrations WHERE programme_id=${programme.id} AND status='registered'`;
        if (count[0].count >= programme.max_participants) return Response.json({ error: "That programme has reached its registration limit" }, { status: 409 });
      }
    }

    let participant;
    if (body.email?.trim()) {
      const existing = await sql`SELECT id,name,email,phone,participant_code FROM participants WHERE event_id=${event.id} AND lower(email)=lower(${body.email.trim()}) LIMIT 1`;
      participant = existing[0] || null;
    }
    if (!participant) {
      const rows = await sql`INSERT INTO participants(event_id,name,email,phone,participant_code) VALUES(${event.id},${body.name.trim()},${body.email?.trim() || null},${body.phone?.trim() || null},${code}) RETURNING id,name,email,phone,participant_code`;
      participant = rows[0];
      await sql`INSERT INTO event_analytics(event_id,total_participants) VALUES(${event.id},1) ON CONFLICT(event_id) DO UPDATE SET total_participants=event_analytics.total_participants+1,last_updated=now()`;
    }

    let registration = null;
    if (programme) {
      const duplicate = await sql`SELECT id FROM registrations WHERE programme_id=${programme.id} AND participant_id=${participant.id} AND status='registered'`;
      if (duplicate.length) return Response.json({ error: "You are already registered for that programme" }, { status: 409 });
      const rows = await sql`INSERT INTO registrations(programme_id,participant_id,status) VALUES(${programme.id},${participant.id},'registered') RETURNING id,programme_id,participant_id,status`;
      registration = rows[0];
    }
    return Response.json({ participant, registration }, { status: 201 });
  } catch (error) {
    console.error("POST /api/public-registration failed", error);
    return Response.json({ error: "Unable to register right now. Please try again." }, { status: 500 });
  }
}
