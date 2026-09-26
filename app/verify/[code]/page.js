import { notFound } from "next/navigation";
import { getDb } from "../../../lib/db";

export const dynamic="force-dynamic";

export default async function VerifyCertificatePage({params}){
  const {code}=await params;
  const sql=getDb();
  const rows=await sql`SELECT cv.verification_code,c.certificate_number,c.title,c.certificate_type,c.issued_at,COALESCE(p.name,t.name) AS recipient_name,e.name AS event_name FROM certificate_verifications cv JOIN certificates c ON c.id=cv.certificate_id LEFT JOIN participants p ON p.id=c.participant_id LEFT JOIN teams t ON t.id=c.team_id JOIN events e ON e.id=c.event_id WHERE cv.verification_code=${code} LIMIT 1`;
  if(!rows.length) notFound();
  const certificate=rows[0];
  await sql`UPDATE certificate_verifications SET last_verified_at=now(),verification_count=verification_count+1 WHERE verification_code=${code}`;
  return <main style={{minHeight:"100vh",padding:"48px 20px",fontFamily:"system-ui,sans-serif",background:"#f5f5f0",color:"#111"}}><section style={{maxWidth:720,margin:"0 auto",background:"#fff",padding:"40px",border:"1px solid #ddd",borderRadius:24}}><p style={{fontSize:12,fontWeight:800,letterSpacing:".14em"}}>EVENTRA · CERTIFICATE VERIFICATION</p><h1 style={{fontSize:42,margin:"18px 0 8px"}}>Certificate verified.</h1><p>This certificate record matches Eventra's official event data.</p><dl style={{display:"grid",gap:18,marginTop:32}}><div><dt>Recipient</dt><dd>{certificate.recipient_name||"—"}</dd></div><div><dt>Certificate</dt><dd>{certificate.title}</dd></div><div><dt>Number</dt><dd>{certificate.certificate_number}</dd></div><div><dt>Event</dt><dd>{certificate.event_name}</dd></div><div><dt>Type</dt><dd>{certificate.certificate_type}</dd></div></dl><a href="/" style={{display:"inline-block",marginTop:30}}>Powered by Eventra.</a></section></main>;
}
