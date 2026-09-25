import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

export async function GET(request) {
  try {
    const db = getDb();
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    const schedules = await db`
      SELECT s.id, s.programme_id, s.venue_id, s.starts_at, s.ends_at, s.status,
             p.name AS programme_name, p.category AS programme_category,
             v.name AS venue_name, v.location AS venue_location
      FROM schedules s
      JOIN programmes p ON p.id = s.programme_id
      LEFT JOIN venues v ON v.id = s.venue_id
      WHERE p.event_id = ${eventId}
      ORDER BY s.starts_at ASC NULLS LAST
    `;
    return NextResponse.json({ schedules });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to load schedules" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { eventId, programmeId, venueId, startsAt, endsAt, status = "scheduled" } = body;
    if (!eventId || !programmeId || !startsAt || !endsAt) return NextResponse.json({ error: "Programme, start time, and end time are required" }, { status: 400 });
    if (new Date(endsAt) <= new Date(startsAt)) return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });

    const programme = await db`SELECT id FROM programmes WHERE id = ${programmeId} AND event_id = ${eventId}`;
    if (!programme.length) return NextResponse.json({ error: "Programme does not belong to this event" }, { status: 400 });

    if (venueId) {
      const venue = await db`SELECT id FROM venues WHERE id = ${venueId} AND event_id = ${eventId}`;
      if (!venue.length) return NextResponse.json({ error: "Venue does not belong to this event" }, { status: 400 });
      const conflicts = await db`
        SELECT id FROM schedules
        WHERE venue_id = ${venueId}
          AND starts_at < ${endsAt}
          AND ends_at > ${startsAt}
        LIMIT 1
      `;
      if (conflicts.length) return NextResponse.json({ error: "This venue is already scheduled during that time" }, { status: 409 });
    }

    const programmeConflicts = await db`
      SELECT id FROM schedules
      WHERE programme_id = ${programmeId}
        AND starts_at < ${endsAt}
        AND ends_at > ${startsAt}
      LIMIT 1
    `;
    if (programmeConflicts.length) return NextResponse.json({ error: "This programme already has an overlapping schedule" }, { status: 409 });

    const rows = await db`
      INSERT INTO schedules (programme_id, venue_id, starts_at, ends_at, status)
      VALUES (${programmeId}, ${venueId || null}, ${startsAt}, ${endsAt}, ${status})
      RETURNING id, programme_id, venue_id, starts_at, ends_at, status
    `;
    return NextResponse.json({ schedule: rows[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to create schedule" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, eventId, programmeId, venueId = null, startsAt, endsAt, status = "scheduled" } = body;
    if (!id || !eventId || !programmeId || !startsAt || !endsAt) return NextResponse.json({ error: "Schedule, programme, start time, and end time are required" }, { status: 400 });
    if (new Date(endsAt) <= new Date(startsAt)) return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    const owns = await db`SELECT s.id FROM schedules s JOIN programmes p ON p.id=s.programme_id WHERE s.id=${id} AND p.event_id=${eventId}`;
    if (!owns.length) return NextResponse.json({ error: "Schedule does not belong to this event" }, { status: 404 });
    const venueConflicts = venueId ? await db`SELECT id FROM schedules WHERE id <> ${id} AND venue_id=${venueId} AND starts_at < ${endsAt} AND ends_at > ${startsAt} LIMIT 1` : [];
    if (venueConflicts.length) return NextResponse.json({ error: "Venue clash: another programme is already using this venue during that time." }, { status: 409 });
    const programmeConflicts = await db`SELECT id FROM schedules WHERE id <> ${id} AND programme_id=${programmeId} AND starts_at < ${endsAt} AND ends_at > ${startsAt} LIMIT 1`;
    if (programmeConflicts.length) return NextResponse.json({ error: "Programme clash: this programme already has an overlapping schedule." }, { status: 409 });
    const rows = await db`UPDATE schedules SET programme_id=${programmeId}, venue_id=${venueId}, starts_at=${startsAt}, ends_at=${endsAt}, status=${status} WHERE id=${id} RETURNING id,programme_id,venue_id,starts_at,ends_at,status`;
    return NextResponse.json({ schedule: rows[0] });
  } catch (error) {
    console.error("PATCH /api/schedules failed", error);
    return NextResponse.json({ error: "Unable to update schedule" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const db = getDb();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await db`DELETE FROM schedules WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/schedules failed", error);
    return NextResponse.json({ error: "Unable to delete schedule" }, { status: 500 });
  }
}
