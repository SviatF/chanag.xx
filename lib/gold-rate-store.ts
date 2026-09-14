const STORAGE_KEY="panchvani:gold-rate:pipeline:v1";

function namespaceId(){
  return process.env.GOLD_RATE_KV_NAMESPACE_ID??process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID??null;
}

function apiToken(){
  return process.env.GOLD_RATE_KV_API_TOKEN??process.env.CLOUDFLARE_API_TOKEN??null;
}

export function getGoldRateStoreStatus(){
  const namespace=namespaceId();
  const token=apiToken();
  const required={
    CLOUDFLARE_ACCOUNT_ID:Boolean(process.env.CLOUDFLARE_ACCOUNT_ID),
    GOLD_RATE_KV_API_TOKEN:Boolean(token),
    GOLD_RATE_KV_NAMESPACE_ID:Boolean(namespace),
  };
  const missing=Object.entries(required).filter(([,configured])=>!configured).map(([name])=>name);
  return {
    configured:Object.values(required).every(Boolean),
    required,
    missing,
    namespaceId:namespace,
    storageKey:STORAGE_KEY,
    usingDedicatedToken:Boolean(process.env.GOLD_RATE_KV_API_TOKEN),
    usingSharedSeoNamespace:!process.env.GOLD_RATE_KV_NAMESPACE_ID&&Boolean(process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID),
  };
}

function endpoint(){
  const account=process.env.CLOUDFLARE_ACCOUNT_ID;
  const namespace=namespaceId();
  if(!account||!namespace)throw new Error("Gold Rate KV storage is not configured.");
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/storage/kv/namespaces/${encodeURIComponent(namespace)}/values/${encodeURIComponent(STORAGE_KEY)}`;
}

function headers(contentType=false){
  const token=apiToken();
  if(!token)throw new Error("GOLD_RATE_KV_API_TOKEN (or fallback CLOUDFLARE_API_TOKEN) is not configured.");
  return {
    authorization:`Bearer ${token}`,
    ...(contentType?{"content-type":"application/json"}:{}),
  };
}

export async function readGoldRatePipelineState<T=unknown>():Promise<T|null>{
  if(!getGoldRateStoreStatus().configured)return null;
  const response=await fetch(endpoint(),{headers:headers(),cache:"no-store"});
  if(response.status===404)return null;
  if(!response.ok){
    const text=await response.text();
    throw new Error(`Cloudflare KV gold-rate read failed (${response.status}): ${text.slice(0,240)}`);
  }
  const raw=await response.text();
  if(!raw.trim())return null;
  try{return JSON.parse(raw) as T;}
  catch{throw new Error("Cloudflare KV gold-rate payload is not valid JSON.");}
}

export async function writeGoldRatePipelineState(value:unknown){
  if(!getGoldRateStoreStatus().configured)throw new Error("Gold Rate KV storage is not configured.");
  const response=await fetch(endpoint(),{
    method:"PUT",
    headers:headers(true),
    body:JSON.stringify(value),
    cache:"no-store",
  });
  if(!response.ok){
    const text=await response.text();
    throw new Error(`Cloudflare KV gold-rate write failed (${response.status}): ${text.slice(0,240)}`);
  }
}
