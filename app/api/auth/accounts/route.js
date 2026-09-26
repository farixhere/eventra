import { getDb } from "../../../../lib/db";
import { hashPassword } from "../../../../lib/accounts";
import { parseUserToken } from "../../../../lib/auth";
import { auditLog, safeChanges } from "../../../../lib/audit";
import { revokeAccountSessions } from "../../../../lib/session";

async function admin(request) {
  const u = await parseUserToken(request.cookies.get("eventra_session")?.value);
  return u && u.globalRole === "admin";
}
const allowedRoles = new Set(["admin","organizer","judge","participant","team-mgr"]);

export async function GET(request) {
  try {
    if (!await admin(request)) return Response.json({error:"Admin access required"},{status:403});
    const accounts = await getDb().unsafe(
      `SELECT u.id,u.email,u.display_name,u.active,u.created_at,u.updated_at,
              COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::text[]) AS roles
         FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id
        GROUP BY u.id ORDER BY u.created_at DESC`
    );
    return Response.json({accounts});
  } catch (e) { return Response.json({error:"Unable to load accounts"},{status:500}); }
}

export async function POST(request) {
  try {
    if (!await admin(request)) return Response.json({error:"Admin access required"},{status:403});
    const b = await request.json();
    const email = String(b.email||"").trim().toLowerCase();
    const password = String(b.password||"");
    const role = String(b.globalRole||"participant").toLowerCase();
    if (!email.includes("@") || password.length<8 || !allowedRoles.has(role))
      return Response.json({error:"Valid email, an 8+ character password, and a supported role are required"},{status:400});
    const sql = getDb();
    const roleRow = await sql.unsafe("SELECT id FROM roles WHERE name=$1 LIMIT 1",[role]);
    if (!roleRow[0]) return Response.json({error:"Role not found"},{status:400});
    const rows = await sql.unsafe(
      `INSERT INTO users(email,display_name,password_hash,active) VALUES(lower($1),$2,$3,true)
       RETURNING id,email,display_name,active,created_at`,
      [email,b.name?.trim()||email.split("@")[0],await hashPassword(password)]
    );
    await sql.unsafe("INSERT INTO user_roles(user_id,role_id) VALUES($1,$2)",[rows[0].id,roleRow[0].id]);
    await auditLog(request,{action:"user.created",entityType:"user",entityId:rows[0].id,changes:safeChanges({email,name:rows[0].display_name,globalRole:role})});
    return Response.json({account:{...rows[0],roles:[role]}},{status:201});
  } catch(e) {
    return Response.json({error:String(e?.message||"").toLowerCase().includes("duplicate")?"Account already exists":"Unable to create account"},{status:400});
  }
}

export async function PATCH(request) {
  try {
    if (!await admin(request)) return Response.json({error:"Admin access required"},{status:403});
    const b = await request.json(), sql = getDb();
    if (!b.id) return Response.json({error:"id is required"},{status:400});
    const role = b.globalRole===undefined ? null : String(b.globalRole).toLowerCase();
    if (role && !allowedRoles.has(role)) return Response.json({error:"Unsupported role"},{status:400});
    if (b.password && String(b.password).length<8) return Response.json({error:"Password must be at least 8 characters"},{status:400});
    if (b.password) {
      await sql.unsafe("UPDATE users SET password_hash=$1,password_changed_at=now(),updated_at=now() WHERE id=$2",
        [await hashPassword(String(b.password)),b.id]);
      await revokeAccountSessions(b.id);
    }
    const rows = await sql.unsafe(
      `UPDATE users SET display_name=COALESCE($1,display_name),active=COALESCE($2,active),updated_at=now()
       WHERE id=$3 RETURNING id,email,display_name,active`,
      [b.name?.trim()||null,typeof b.active==="boolean"?b.active:null,b.id]
    );
    if (!rows[0]) return Response.json({error:"Account not found"},{status:404});
    if (role) {
      const roleRow = await sql.unsafe("SELECT id FROM roles WHERE name=$1 LIMIT 1",[role]);
      if (!roleRow[0]) return Response.json({error:"Role not found"},{status:400});
      await sql.unsafe("DELETE FROM user_roles WHERE user_id=$1",[b.id]);
      await sql.unsafe("INSERT INTO user_roles(user_id,role_id) VALUES($1,$2)",[b.id,roleRow[0].id]);
    }
    if (typeof b.active==="boolean" && !b.active) await revokeAccountSessions(b.id);
    await auditLog(request,{action:"user.updated",entityType:"user",entityId:rows[0].id,changes:safeChanges({name:b.name,globalRole:role,active:b.active,passwordChanged:Boolean(b.password)})});
    return Response.json({account:{...rows[0},...(role?{roles:[role]}:{})}});
  } catch(e) { return Response.json({error:"Unable to update account"},{status:400}); }
}
