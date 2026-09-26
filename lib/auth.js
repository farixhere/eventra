const COOKIE_NAME = "eventra_admin";
const TOKEN_VALUE = "eventra-admin";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function toBase64Url(bytes){
  let binary="";
  for(const byte of bytes) binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}

function fromBase64Url(value){
  const padded=value.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((value.length+3)%4);
  const binary=atob(padded);
  return Uint8Array.from(binary,char=>char.charCodeAt(0));
}

async function signToken(secret,payload){
  const key=await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {name:"HMAC",hash:"SHA-256"},
    false,
    ["sign"]
  );
  const signature=await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return toBase64Url(new Uint8Array(signature));
}

export async function createAdminToken(secret){
  if(!secret) throw new Error("EVENTRA_ADMIN_PASSWORD is not configured");
  const expiresAt=Math.floor(Date.now()/1000)+TOKEN_TTL_SECONDS;
  const payload=TOKEN_VALUE+"."+expiresAt;
  return payload+"."+await signToken(secret,payload);
}

export async function verifyAdminToken(token,secret){
  if(!token||!secret)return false;
  const parts=token.split(".");
  if(parts.length!==3||parts[0]!==TOKEN_VALUE)return false;
  const expiresAt=Number(parts[1]);
  if(!Number.isSafeInteger(expiresAt)||expiresAt<=Math.floor(Date.now()/1000))return false;
  try{
    const payload=parts[0]+"."+parts[1];
    const key=await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      {name:"HMAC",hash:"SHA-256"},
      false,
      ["verify"]
    );
    return await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(parts[2]),
      new TextEncoder().encode(payload)
    );
  }catch{return false;}
}

export { COOKIE_NAME };
