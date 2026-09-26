import {parseUserToken} from "../../../../lib/auth";
export async function GET(request){
 const u=await parseUserToken(request.cookies.get("eventra_session")?.value);
 if(!u)return Response.json({error:"Authentication required"},{status:401,headers:{"Cache-Control":"no-store"}});
 return Response.json({user:{id:u.id,email:u.email,name:u.name,globalRole:u.globalRole}},{headers:{"Cache-Control":"no-store"}});
}
