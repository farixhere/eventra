import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import ControlCenterClient from "./ControlCenterClient";
import {COOKIE_NAME,parseUserToken} from "../../../lib/auth";
export const dynamic="force-dynamic";
export default async function ControlCenterPage(){
 const user=await parseUserToken((await cookies()).get(COOKIE_NAME)?.value);
 if(!user||user.globalRole!=="admin") redirect("/dashboard?error=control-center");
 return <ControlCenterClient/>;
}