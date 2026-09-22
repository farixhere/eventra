import { getDb } from "../../../lib/db";

export async function GET(request) {
  const eventId = new URL(request.url).searchParams.get("eventId");
  if (!eventId) return Response.json({ error:"eventId is required" }, { status:400 });
  const sql=getDb();
  const downloads=await sql`SELECT id,title,description,file_url,file_type,published,created_at FROM downloads WHERE event_id=${eventId} ORDER BY created_at DESC`;
  return Response.json({downloads});
}
export async function POST(request) {
  const body=await request.json();
  if(!body.eventId || !body.title || !body.fileUrl) return Response.json({error:"eventId, title and fileUrl are required"},{status:400});
  const sql=getDb();
  const rows=await sql`INSERT INTO downloads(event_id,title,description,file_url,file_type,published) VALUES(${body.eventId},${body.title},${body.description||null},${body.fileUrl},${body.fileType||"FILE"},false) RETURNING *`;
  return Response.json({download:rows[0]},{status:201});
}
export async function PATCH(request) {
  const body=await request.json();
  if(!body.id) return Response.json({error:"id is required"},{status:400});
  const sql=getDb();
  const rows=await sql`UPDATE downloads SET title=COALESCE(${body.title},title), description=COALESCE(${body.description},description), file_url=COALESCE(${body.fileUrl},file_url), file_type=COALESCE(${body.fileType},file_type), published=COALESCE(${body.published},published) WHERE id=${body.id} RETURNING *`;
  if(!rows.length) return Response.json({error:"Download not found"},{status:404});
  return Response.json({download:rows[0]});
}
export async function DELETE(request) {
  const id=new URL(request.url).searchParams.get("id");
  if(!id) return Response.json({error:"id is required"},{status:400});
  const sql=getDb();
  await sql`DELETE FROM downloads WHERE id=${id}`;
  return Response.json({ok:true});
}
