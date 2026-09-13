const STORAGE_KEY="panchvani:seo-command-tasks:v1";

export type SeoTaskStatus="observation"|"review_ready"|"closed"|"snoozed";
export type SeoTaskResult="positive"|"neutral"|"negative"|"low_data"|null;

export type SeoTaskBaseline={
  impressions:number;
  clicks:number;
  ctr:number;
  position:number;
};

export type SeoCommandTask={
  id:string;
  url:string;
  query:string;
  actionType:string;
  recommendation:string;
  status:SeoTaskStatus;
  baseline:SeoTaskBaseline;
  completedAt:string;
  verifyAt:string;
  result:SeoTaskResult;
  reviewerNote:string;
  commitSha:string|null;
  closedAt?:string;
  snoozedUntil?:string;
  updatedAt:string;
};

export type SeoTaskMap=Record<string,SeoCommandTask>;

export function getSeoTaskStoreStatus(){
  const required={
    CLOUDFLARE_ACCOUNT_ID:Boolean(process.env.CLOUDFLARE_ACCOUNT_ID),
    CLOUDFLARE_API_TOKEN:Boolean(process.env.CLOUDFLARE_API_TOKEN),
    SEO_OPPORTUNITY_KV_NAMESPACE_ID:Boolean(process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID),
  };
  return {configured:Object.values(required).every(Boolean),required,storageKey:STORAGE_KEY};
}

function endpoint(){
  const account=process.env.CLOUDFLARE_ACCOUNT_ID;
  const namespace=process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID;
  if(!account||!namespace)throw new Error("SEO task KV storage is not configured.");
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/storage/kv/namespaces/${encodeURIComponent(namespace)}/values/${encodeURIComponent(STORAGE_KEY)}`;
}

function headers(contentType=false){
  const token=process.env.CLOUDFLARE_API_TOKEN;
  if(!token)throw new Error("CLOUDFLARE_API_TOKEN is not configured.");
  return {authorization:`Bearer ${token}`,...(contentType?{"content-type":"application/json"}:{})};
}

export async function readSeoTaskMap():Promise<SeoTaskMap>{
  if(!getSeoTaskStoreStatus().configured)return {};
  const response=await fetch(endpoint(),{headers:headers(),cache:"no-store"});
  if(response.status===404)return {};
  if(!response.ok){const text=await response.text();throw new Error(`Cloudflare KV SEO task read failed (${response.status}): ${text.slice(0,240)}`);}
  const raw=await response.text();
  if(!raw.trim())return {};
  try{const parsed=JSON.parse(raw) as SeoTaskMap;return parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?parsed:{};}catch{throw new Error("Cloudflare KV SEO task payload is not valid JSON.");}
}

export async function writeSeoTaskMap(map:SeoTaskMap){
  if(!getSeoTaskStoreStatus().configured)throw new Error("SEO task KV storage is not configured.");
  const response=await fetch(endpoint(),{method:"PUT",headers:headers(true),body:JSON.stringify(map),cache:"no-store"});
  if(!response.ok){const text=await response.text();throw new Error(`Cloudflare KV SEO task write failed (${response.status}): ${text.slice(0,240)}`);}
}

export function seoTaskId(url:string,query:string){return `seo:${url.trim()}::${query.trim().toLowerCase()}`;}
