import { getDb } from "./db";

export async function checkScheduleConflicts(db,{eventId,programmeId,venueId,startsAt,endsAt,excludeId=null}){
  const zero="00000000-0000-0000-0000-000000000000";
  const ex=excludeId||zero;
  const venue=venueId?await db`SELECT s.id,p.name AS programme_name FROM schedules s JOIN programmes p ON p.id=s.programme_id WHERE p.event_id=${eventId} AND s.venue_id=${venueId} AND s.starts_at < ${endsAt} AND s.ends_at > ${startsAt} AND s.id <> ${ex}::uuid LIMIT 10`:[];
  const programme=await db`SELECT s.id FROM schedules s JOIN programmes p ON p.id=s.programme_id WHERE p.event_id=${eventId} AND s.programme_id=${programmeId} AND s.starts_at < ${endsAt} AND s.ends_at > ${startsAt} AND s.id <> ${ex}::uuid LIMIT 10`;
  const participants=await db`SELECT DISTINCT p.id,p.name,other.name AS conflicting_programme FROM registrations incoming JOIN participants p ON p.id=incoming.participant_id JOIN registrations existing ON existing.participant_id=p.id AND existing.status='registered' JOIN schedules s ON s.programme_id=existing.programme_id JOIN programmes other ON other.id=s.programme_id WHERE incoming.programme_id=${programmeId} AND incoming.status='registered' AND s.starts_at < ${endsAt} AND s.ends_at > ${startsAt} AND s.id <> ${ex}::uuid LIMIT 20`;
  return {venue,programme,participants,hasConflict:Boolean(venue.length||programme.length||participants.length)};
}

export async function teamLeaderboard(db,eventId){
 return db`SELECT t.id,t.name,t.code,COALESCE(SUM(CASE WHEN r.published THEN COALESCE(r.points,0) ELSE 0 END),0)::int AS points,COUNT(r.id) FILTER (WHERE r.published)::int AS published_results FROM teams t LEFT JOIN results r ON r.team_id=t.id WHERE t.event_id=${eventId} GROUP BY t.id,t.name,t.code ORDER BY points DESC,t.name ASC`;
}
