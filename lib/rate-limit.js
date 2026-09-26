import { getDb } from "./db";

export async function consumeRateLimit(bucketKey,maxHits,windowSeconds){
  const sql=getDb();
  await sql.unsafe(`CREATE TABLE IF NOT EXISTS eventra_rate_limits(
    bucket_key text PRIMARY KEY,
    window_started_at timestamptz NOT NULL,
    hits integer NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  const rows=await sql`
    INSERT INTO eventra_rate_limits(bucket_key,window_started_at,hits,updated_at)
    VALUES(${bucketKey},now(),1,now())
    ON CONFLICT(bucket_key) DO UPDATE SET
      window_started_at=CASE WHEN eventra_rate_limits.window_started_at <= now()-make_interval(secs=>${windowSeconds})
        THEN now() ELSE eventra_rate_limits.window_started_at END,
      hits=CASE WHEN eventra_rate_limits.window_started_at <= now()-make_interval(secs=>${windowSeconds})
        THEN 1 ELSE eventra_rate_limits.hits+1 END,
      updated_at=now()
    RETURNING hits,extract(epoch from (window_started_at + make_interval(secs=>${windowSeconds}) - now())) AS retry_after
  `;
  return {allowed:Number(rows[0].hits)<=maxHits,retryAfter:Math.max(1,Math.ceil(Number(rows[0].retry_after||windowSeconds)))};
}
