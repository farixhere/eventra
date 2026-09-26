import {parseUserToken} from "../../../../lib/auth";
export async function GET(request){
 const u=await parseUserToken(request.cookies.get("eventra_session")?.value,process.env.EVENTRA_ADMIN_PASSWORD);
 if(!u)return Response.json({error:"Authentication required"},{status:401});
 return Response.json({user:{id:u.id,email:u.email,name:u.name,globalRole:u.globalRole}});
}