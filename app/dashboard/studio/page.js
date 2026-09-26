import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import EventStudioClient from "./EventStudioClient";
import {COOKIE_NAME,parseUserToken} from "../../../lib/auth";
export const dynamic="force-dynamic";
export default async function EventStudioPage(){
 const user=await parseUserToken((await cookies()).get(COOKIE_NAME)?.value);
 if(!user) redirect("/dashboard/login?next=/dashboard/studio");
 return <EventStudioClient/>;
}