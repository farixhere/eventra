import { getDb } from "../../../lib/db";

function makeSlug(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const eventFields = "id,name,slug,description,start_date,end_date,location,status,tagline,logo_url,banner_url,website_theme,primary_color,secondary_color,is_public,registration_open,registration_deadline,created_at";


export async function GET() {
  try {
    const sql = getDb();
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS website_sections jsonb NOT NULL DEFAULT '{}'::jsonb`;
    const events = await sql`SELECT id,name,slug,description,start_date,end_date,location,status,tagline,logo_url,banner_url,website_theme,primary_color,secondary_color,is_public,registration_open,registration_deadline,COALESCE(website_sections,'{}'::jsonb) AS website_sections,created_at FROM events ORDER BY created_at DESC`;
    return Response.json({ events });
  } catch (error) {
    console.error("GET /api/events failed", error);
    return Response.json({ error: "Unable to load events" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = body.name?.trim();
    if (!name) return Response.json({ error: "Event name is required" }, { status: 400 });
    const sql = getDb();
    const organizerRows = await sql`INSERT INTO organizers (email, name) VALUES ('owner@eventra.local', 'Eventra Organizer') ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`;
    const baseSlug = makeSlug(name) || "event";
    const slug = `${baseSlug}-${Date.now().toString(36)}`;
    const rows = await sql`INSERT INTO events (organizer_id,name,slug,description,start_date,end_date,location,status,tagline,logo_url,banner_url,website_theme,primary_color,secondary_color,is_public,registration_open,registration_deadline) VALUES (${organizerRows[0].id},${name},${slug},${body.description?.trim() || null},${body.startDate || null},${body.endDate || null},${body.location?.trim() || null},'draft',${body.tagline?.trim() || null},${body.logoUrl?.trim() || null},${body.bannerUrl?.trim() || null},${body.websiteTheme || "eventra"},${body.primaryColor || "#d7ff3f"},${body.secondaryColor || "#111111"},${Boolean(body.isPublic)},${Boolean(body.registrationOpen)},${body.registrationDeadline || null}) RETURNING id,name,slug,description,start_date,end_date,location,status,tagline,logo_url,banner_url,website_theme,primary_color,secondary_color,is_public,registration_open,registration_deadline,created_at`;
    return Response.json({ event: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/events failed", error);
    return Response.json({ error: "Unable to create event" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    if (!body.id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    if (body.websiteSections && typeof body.websiteSections === "object") {
      await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS website_sections jsonb NOT NULL DEFAULT '{}'::jsonb`;
    }
    const rows = await sql`UPDATE events SET name=COALESCE(${body.name?.trim() || null},name), description=COALESCE(${body.description?.trim() || null},description), start_date=COALESCE(${body.startDate || null},start_date), end_date=COALESCE(${body.endDate || null},end_date), location=COALESCE(${body.location?.trim() || null},location), tagline=COALESCE(${body.tagline?.trim() || null},tagline), logo_url=COALESCE(${body.logoUrl?.trim() || null},logo_url), banner_url=COALESCE(${body.bannerUrl?.trim() || null},banner_url), website_theme=COALESCE(${body.websiteTheme || null},website_theme), primary_color=COALESCE(${body.primaryColor || null},primary_color), secondary_color=COALESCE(${body.secondaryColor || null},secondary_color), is_public=COALESCE(${typeof body.isPublic === "boolean" ? body.isPublic : null},is_public), registration_open=COALESCE(${typeof body.registrationOpen === "boolean" ? body.registrationOpen : null},registration_open), registration_deadline=COALESCE(${body.registrationDeadline || null},registration_deadline), website_sections=COALESCE(${body.websiteSections ? JSON.stringify(body.websiteSections) : null}::jsonb,website_sections), status=COALESCE(${body.status || null},status) WHERE id=${body.id} RETURNING id,name,slug,description,start_date,end_date,location,status,tagline,logo_url,banner_url,website_theme,primary_color,secondary_color,is_public,registration_open,registration_deadline,created_at`;
    if (!rows[0]) return Response.json({ error: "Event not found" }, { status: 404 });
    return Response.json({ event: rows[0] });
  } catch (error) {
    console.error("PATCH /api/events failed", error);
    return Response.json({ error: "Unable to update event" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    await sql.transaction([
      sql`DELETE FROM results WHERE programme_id IN (SELECT id FROM programmes WHERE event_id = ${id})`,
      sql`DELETE FROM schedules WHERE programme_id IN (SELECT id FROM programmes WHERE event_id = ${id})`,
      sql`DELETE FROM registrations WHERE programme_id IN (SELECT id FROM programmes WHERE event_id = ${id})`,
      sql`DELETE FROM certificates WHERE event_id = ${id}`,
      sql`DELETE FROM id_cards WHERE event_id = ${id}`,
      sql`DELETE FROM media_assets WHERE event_id = ${id}`,
      sql`DELETE FROM downloads WHERE event_id = ${id}`,
      sql`DELETE FROM announcements WHERE event_id = ${id}`,
      sql`DELETE FROM contact_messages WHERE event_id = ${id}`,
      sql`DELETE FROM event_analytics WHERE event_id = ${id}`,
      sql`DELETE FROM live_updates WHERE event_id = ${id}`,
      sql`DELETE FROM programmes WHERE event_id = ${id}`,
      sql`DELETE FROM participants WHERE event_id = ${id}`,
      sql`DELETE FROM teams WHERE event_id = ${id}`,
      sql`DELETE FROM venues WHERE event_id = ${id}`,
      sql`DELETE FROM events WHERE id = ${id}`
    ]);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/events failed", error);
    return Response.json({ error: "Unable to delete event" }, { status: 500 });
  }
}