import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const {parseUserToken}=await import("../../../lib/auth");
    const user=await parseUserToken(request.cookies.get("eventra_session")?.value,process.env.EVENTRA_ADMIN_PASSWORD);
    if(!user)return Response.json({error:"Authentication required"},{status:401});
    const programmes = user.globalRole==="admin"||user.globalRole==="organizer"
      ? await sql`SELECT id,name,category,type,max_participants,created_at FROM programmes WHERE event_id=${eventId} ORDER BY created_at DESC`
      : await sql`SELECT DISTINCT p.id,p.name,p.category,p.type,p.max_participants,p.created_at FROM programmes p JOIN judge_assignments ja ON ja.programme_id=p.id WHERE p.event_id=${eventId} AND lower(ja.email)=lower(${user.email}) AND ja.active=true ORDER BY p.created_at DESC`;
    return Response.json({programmes});
  } catch (error) {
    console.error("GET /api/programmes failed", error);
    return Response.json({ error: "Unable to load programmes" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.eventId || !body.name?.trim()) return Response.json({ error: "Event and programme name are required" }, { status: 400 });
    if (!["individual", "team"].includes(body.type)) return Response.json({ error: "Programme type must be individual or team" }, { status: 400 });
    const sql = getDb();
    const rows = await sql`
      INSERT INTO programmes (event_id, name, category, type, max_participants)
      VALUES (${body.eventId}, ${body.name.trim()}, ${body.category?.trim() || null}, ${body.type}, ${body.maxParticipants ? Number(body.maxParticipants) : null})
      RETURNING id, name, category, type, max_participants, created_at
    `;
    return Response.json({ programme: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/programmes failed", error);
    return Response.json({ error: "Unable to create programme" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    await sql`DELETE FROM programmes WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/programmes failed", error);
    return Response.json({ error: "Unable to delete programme" }, { status: 500 });
  }
}


export async function PATCH(request) {
  try {
    const body = await request.json();
    if (!body.id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    const rows = await sql`
      UPDATE programmes
      SET name=COALESCE(NULLIF(TRIM(${body.name || ""}),''),name),
          category=COALESCE(${body.category === undefined ? null : (body.category?.trim() || null)},category),
          type=COALESCE(${body.type || null},type),
          max_participants=CASE WHEN ${body.maxParticipants === undefined} THEN max_participants ELSE NULLIF(${body.maxParticipants || ""},'')::integer END
      WHERE id=${body.id}
      RETURNING id,name,category,type,max_participants,created_at
    `;
    if (!rows[0]) return Response.json({ error: "Programme not found" }, { status: 404 });
    return Response.json({ programme: rows[0] });
  } catch (error) {
    console.error("PATCH /api/programmes failed", error);
    return Response.json({ error: "Unable to update programme" }, { status: 500 });
  }
}
