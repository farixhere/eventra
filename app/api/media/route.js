import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });
    const sql = getDb();
    const media = await sql`
      SELECT id, file_name, file_url, file_type, file_size, category, caption, published, created_at
      FROM media_assets WHERE event_id = ${eventId}
      ORDER BY created_at DESC
    `;
    return Response.json({ media });
  } catch (error) {
    return Response.json({ error: "Unable to load media" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.eventId || !body.fileName?.trim() || !body.fileUrl?.trim()) {
      return Response.json({ error: "Event, file name and file URL are required" }, { status: 400 });
    }
    const sql = getDb();
    const rows = await sql`
      INSERT INTO media_assets (event_id, file_name, file_url, file_type, file_size, category, caption, published)
      VALUES (${body.eventId}, ${body.fileName.trim()}, ${body.fileUrl.trim()}, ${body.fileType || "image"}, ${body.fileSize ? Number(body.fileSize) : null}, ${body.category || "gallery"}, ${body.caption?.trim() || null}, ${Boolean(body.published)})
      RETURNING *
    `;
    return Response.json({ media: rows[0] }, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Unable to create media item" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    if (!body.id) return Response.json({ error: "id is required" }, { status: 400 });
    const sql = getDb();
    const rows = await sql`
      UPDATE media_assets SET
        file_name = COALESCE(${body.fileName}, file_name),
        file_url = COALESCE(${body.fileUrl}, file_url),
        category = COALESCE(${body.category}, category),
        caption = COALESCE(${body.caption}, caption),
        published = COALESCE(${body.published}, published)
      WHERE id = ${body.id}
      RETURNING *
    `;
    if (!rows[0]) return Response.json({ error: "Media item not found" }, { status: 404 });
    return Response.json({ media: rows[0] });
  } catch (error) {
    return Response.json({ error: "Unable to update media item" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  const sql = getDb();
  await sql`DELETE FROM media_assets WHERE id = ${id}`;
  return Response.json({ ok: true });
}
