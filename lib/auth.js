import { getSessionUser, createSession } from "./session";

export const COOKIE_NAME="eventra_session";
export const TOKEN_TTL_SECONDS=60*60*8;

export async function createUserToken(user){
  return createSession(user.id);
}

export async function parseUserToken(token){
  return getSessionUser(token);
}

export async function verifyAdminToken(token){
  const u=await parseUserToken(token);
  return Boolean(u&&u.globalRole==="admin");
}
