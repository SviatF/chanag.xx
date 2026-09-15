const PUBLIC_ORIGIN="https://panchvani.com";
const MAX_INPUT_LENGTH=700;
const MAX_PATH_LENGTH=512;
const BLOCKED_PREFIXES=["/admin","/api","/_next"] as const;
const BLOCKED_EXACT=new Set(["/robots.txt","/favicon.ico","/sitemap.xml"]);

function blockedPath(pathname:string){
  const decoded=decodeURIComponent(pathname).toLowerCase();
  if(BLOCKED_EXACT.has(decoded))return true;
  if(decoded.startsWith("/sitemap"))return true;
  return BLOCKED_PREFIXES.some(prefix=>decoded===prefix||decoded.startsWith(`${prefix}/`));
}

export function normalizeSeoRevalidationPath(value:unknown){
  if(typeof value!=="string")throw new Error("A Panchvani URL or path is required.");
  const raw=value.trim();
  if(!raw||raw.length>MAX_INPUT_LENGTH)throw new Error("A valid Panchvani URL or path is required.");
  if(/[\u0000-\u001f\u007f]/.test(raw)||raw.includes("\\"))throw new Error("The revalidation target contains invalid characters.");
  if(raw.startsWith("//"))throw new Error("Protocol-relative URLs are not allowed.");

  let target:URL;
  try{target=raw.startsWith("/")?new URL(raw,PUBLIC_ORIGIN):new URL(raw);}catch{throw new Error("The revalidation target is not a valid URL or path.");}
  if(target.origin!==PUBLIC_ORIGIN)throw new Error("Only https://panchvani.com pages can be revalidated.");

  let pathname=target.pathname.replace(/\/{2,}/g,"/");
  if(pathname.length>1)pathname=pathname.replace(/\/+$/g,"");
  if(!pathname.startsWith("/")||pathname.length>MAX_PATH_LENGTH)throw new Error("The revalidation path is invalid or too long.");
  try{if(blockedPath(pathname))throw new Error("Admin, API, framework and sitemap routes cannot be revalidated from SEO Command Center.");}
  catch(error){if(error instanceof URIError)throw new Error("The revalidation path contains invalid URL encoding.");throw error;}
  return pathname||"/";
}

export const SEO_REVALIDATION_ORIGIN=PUBLIC_ORIGIN;
