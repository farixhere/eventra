import { getDb } from "../../../lib/db";

export async function GET(request) {
  const eventId = new URL(request.url).searchParams.get("eventId");
  if (!eventId) return Response.json({ error:"eventId is required" }, { status:400 });
  const sql=getDb();
  const announcements=await sql`SELECT id,title,body,published,created_at FROM announcements WHERE event_id=${eventId} ORDER BY created_at DESC`;
  return Response.json({announcements});
}
export async function POST(request) {
  const body=await request.json();
  if(!body.eventId || !body.title || !body.body) return Response.json({error:"eventId, title and body are required"},{status:400});
  const sql=getDb();
  const rows=await sql`INSERT INTO announcements(event_id,title,body,published) VALUES(${body.eventId},${body.title},${body.body},false) RETURNING *`;
  return Response.json({announcement:rows[0]},{status:201});
}
export async function PATCH(request) {
  const body=await request.json();
  if(!body.id) return Response.json({error:"id is required"},{status:400});
  const sql=getDb();
  const rows=await sql`UPDATE announcements SET title=COALESCE(${body.title},title), body=COALESCE(${body.body},body), published=COALESCE(${body.published},published) WHERE id=${body.id} RETURNING *`;
  if(!rows.length) return Response.json({error:"Announcement not found"},{status:404});
  return Response.json({announcement:rows[0]});
}
export async function DELETE(request) {
  const id=new URL(request.url).searchParams.get("id");
  if(!id) return Response.json({error:"id is required"},{status:400});
  const sql=getDb();
  await sql`DELETE FROM announcements WHERE id=${id}`;
  return Response.json({ok:true});
}
