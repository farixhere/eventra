const COOKIE_NAME = "eventra_admin";
const TOKEN_VALUE = "eventra-admin";
function toBase64Url(bytes){let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
function fromBase64Url(value){const padded=value.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((value.length+3)%4);const binary=atob(padded);return Uint8Array.from(binary,char=>char.charCodeAt(0));}
async function signToken(secret){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const signature=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(TOKEN_VALUE));return toBase64Url(new Uint8Array(signature));}
export async function createAdminToken(secret){if(!secret)throw new Error("EVENTRA_ADMIN_PASSWORD is not configured");return TOKEN_VALUE+"."+await signToken(secret);}
export async function verifyAdminToken(token,secret){if(!token||!secret)return false;const parts=token.split(".");if(parts[0]!==TOKEN_VALUE||!parts[1])return false;try{const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["verify"]);return crypto.subtle.verify("HMAC",key,fromBase64Url(parts[1]),new TextEncoder().encode(TOKEN_VALUE));}catch{return false;}}
export {COOKIE_NAME};
