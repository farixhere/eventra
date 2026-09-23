import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const participants = await sql`
      SELECT p.id, p.name, p.email, p.phone, p.participant_code, p.team_id, t.name AS team_name, p.created_at
      FROM participants p
      LEFT JOIN teams t ON t.id = p.team_id
      WHERE p.event_id = ${eventId}
      ORDER BY p.created_at DESC
    `;
    return Response.json({ participants });
  } catch (error) {
    console.error("GET /api/participants failed", error);
    return Response.json({ error: "Unable to load participants" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.eventId || !body.name?.trim()) return Response.json({ error: "Event and participant name are required" }, { status: 400 });
    const sql = getDb();
    const code = body.participantCode?.trim() || `P-${Date.now().toString(36).toUpperCase()}`;
    const rows = await sql`
      INSERT INTO participants (event_id, team_id, name, email, phone, participant_code)
      VALUES (${body.eventId}, ${body.teamId || null}, ${body.name.trim()}, ${body.email?.trim() || null}, ${body.phone?.trim() || null}, ${code})
      RETURNING id, name, email, phone, participant_code, team_id, created_at
    `;
    return Response.json({ participant: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/participants failed", error);
    if (error?.code === "23505") return Response.json({ error: "That participant code already exists in this event" }, { status: 409 });
    return Response.json({ error: "Unable to create participant" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM participants WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/participants failed", error);
    return Response.json({ error: "Unable to delete participant" }, { status: 500 });
  }
}


export async function PATCH(request) {
  try {
    const body = await request.json();
    if (!body.id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    const rows = await sql`
      UPDATE participants
      SET name=COALESCE(NULLIF(TRIM(${body.name || ""}),''),name),
          email=CASE WHEN ${body.email === undefined} THEN email ELSE NULLIF(TRIM(${body.email || ""}),'') END,
          phone=CASE WHEN ${body.phone === undefined} THEN phone ELSE NULLIF(TRIM(${body.phone || ""}),'') END,
          team_id=CASE WHEN ${body.teamId === undefined} THEN team_id ELSE ${body.teamId || null} END,
          school_college=CASE WHEN ${body.schoolCollege === undefined} THEN school_college ELSE NULLIF(TRIM(${body.schoolCollege || ""}),'') END,
          class_year=CASE WHEN ${body.classYear === undefined} THEN class_year ELSE NULLIF(TRIM(${body.classYear || ""}),'') END,
          profile_picture_url=CASE WHEN ${body.profilePictureUrl === undefined} THEN profile_picture_url ELSE NULLIF(TRIM(${body.profilePictureUrl || ""}),'') END,
          status=COALESCE(${body.status || null},status),
          address=CASE WHEN ${body.address === undefined} THEN address ELSE NULLIF(TRIM(${body.address || ""}),'') END,
          custom_fields=COALESCE(${body.customFields === undefined ? null : JSON.stringify(body.customFields)},custom_fields)
      WHERE id=${body.id}
      RETURNING id,name,email,phone,participant_code,team_id,school_college,class_year,profile_picture_url,status,address,custom_fields,created_at
    `;
    if (!rows[0]) return Response.json({ error: "Participant not found" }, { status: 404 });
    return Response.json({ participant: rows[0] });
  } catch (error) {
    console.error("PATCH /api/participants failed", error);
    return Response.json({ error: "Unable to update participant" }, { status: 500 });
  }
}
