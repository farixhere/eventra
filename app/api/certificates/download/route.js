import { getDb } from "../../../../lib/db";

export async function GET(request){
 try{
  const code=new URL(request.url).searchParams.get("code");
  if(!code)return new Response("Verification code required",{status:400});
  const rows=await getDb()`SELECT c.certificate_number,c.title,c.certificate_type,c.issued_at,c.file_url,e.name AS event_name,COALESCE(p.name,t.name) AS recipient_name,pr.name AS programme_name,r.position,r.total_score
    FROM certificate_verifications cv JOIN certificates c ON c.id=cv.certificate_id JOIN events e ON e.id=c.event_id
    LEFT JOIN participants p ON p.id=c.participant_id LEFT JOIN teams t ON t.id=c.team_id
    LEFT JOIN results r ON r.id=c.result_id LEFT JOIN programmes pr ON pr.id=r.programme_id
    WHERE cv.verification_code=${code} LIMIT 1`;
  if(!rows[0])return new Response("Certificate not found",{status:404});
  const c=rows[0],esc=(v)=>String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  if(c.file_url)return Response.redirect(c.file_url,302);
  const position=c.position?'<p>Position: <b>'+esc(c.position)+'</b></p>':"";
  const score=c.total_score!=null?'<p>Score: <b>'+esc(c.total_score)+'</b></p>':"";
  const html='<!doctype html><html><head><meta charset="utf-8"><title>'+esc(c.title)+'</title><style>body{font-family:Georgia,serif;background:#f4f1ea;padding:40px}.cert{max-width:900px;margin:auto;background:#fff;border:12px solid #111;padding:70px;text-align:center;box-shadow:0 15px 50px #0002}h1{font-size:48px;margin:0 0 20px}h2{font-size:34px;margin:25px 0}p{font-size:20px}.meta{margin-top:40px;font-family:Arial,sans-serif;font-size:14px}</style></head><body><main class="cert"><h1>'+esc(c.title)+'</h1><p>This certifies that</p><h2>'+esc(c.recipient_name)+'</h2><p>has received this certificate for <b>'+esc(c.programme_name||c.certificate_type)+'</b> at <b>'+esc(c.event_name)+'</b>.</p>'+position+score+'<div class="meta">Certificate No. '+esc(c.certificate_number)+' · Issued '+esc(c.issued_at)+'<br>Verification code: '+esc(code)+'</div></main><script>window.print()</script></body></html>';
  return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
 }catch(e){return new Response("Unable to generate certificate",{status:500})}
}
