import type {OpportunityLifecycleRecord} from "./opportunity-lifecycle";

const STORAGE_KEY="panchvani:seo-opportunity-lifecycle:v1";

type LifecycleMap=Record<string,OpportunityLifecycleRecord>;

export function getOpportunityStoreStatus(){
  const required={
    CLOUDFLARE_ACCOUNT_ID:Boolean(process.env.CLOUDFLARE_ACCOUNT_ID),
    CLOUDFLARE_API_TOKEN:Boolean(process.env.CLOUDFLARE_API_TOKEN),
    SEO_OPPORTUNITY_KV_NAMESPACE_ID:Boolean(process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID)
  };
  return {
    configured:Object.values(required).every(Boolean),
    required,
    namespaceId:process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID??null,
    storageKey:STORAGE_KEY
  };
}

function endpoint(){
  const account=process.env.CLOUDFLARE_ACCOUNT_ID;
  const namespace=process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID;
  if(!account||!namespace)throw new Error("SEO opportunity KV storage is not configured.");
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/storage/kv/namespaces/${encodeURIComponent(namespace)}/values/${encodeURIComponent(STORAGE_KEY)}`;
}

function headers(contentType=false){
  const token=process.env.CLOUDFLARE_API_TOKEN;
  if(!token)throw new Error("CLOUDFLARE_API_TOKEN is not configured.");
  return {
    authorization:`Bearer ${token}`,
    ...(contentType?{"content-type":"application/json"}:{})
  };
}

export async function readOpportunityLifecycleMap():Promise<LifecycleMap>{
  if(!getOpportunityStoreStatus().configured)return {};
  const response=await fetch(endpoint(),{headers:headers(),cache:"no-store"});
  if(response.status===404)return {};
  if(!response.ok){
    const text=await response.text();
    throw new Error(`Cloudflare KV lifecycle read failed (${response.status}): ${text.slice(0,240)}`);
  }
  const raw=await response.text();
  if(!raw.trim())return {};
  try{
    const parsed=JSON.parse(raw) as LifecycleMap;
    return parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?parsed:{};
  }catch{
    throw new Error("Cloudflare KV lifecycle payload is not valid JSON.");
  }
}

export async function writeOpportunityLifecycleMap(map:LifecycleMap){
  if(!getOpportunityStoreStatus().configured)throw new Error("SEO opportunity KV storage is not configured.");
  const response=await fetch(endpoint(),{
    method:"PUT",
    headers:headers(true),
    body:JSON.stringify(map),
    cache:"no-store"
  });
  if(!response.ok){
    const text=await response.text();
    throw new Error(`Cloudflare KV lifecycle write failed (${response.status}): ${text.slice(0,240)}`);
  }
}
