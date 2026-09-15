const STORAGE_KEY="panchvani:seo-command-tasks:v1";

export type SeoTaskStatus="observation"|"review_ready"|"closed"|"snoozed";
export type SeoTaskResult="positive"|"neutral"|"negative"|"low_data"|null;

export type SeoTaskBaseline={
  impressions:number;
  clicks:number;
  ctr:number;
  position:number;
};

export type SeoTaskOutcome={
  measuredAt:string;
  measurementSnapshotAt:string;
  metric:SeoTaskBaseline;
  impressionsChangePct:number|null;
  clicksChangePct:number|null;
  ctrDeltaPoints:number;
  positionImprovement:number|null;
  score:number;
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
  revalidatedAt?:string;
  revalidatedPath?:string;
  measuredAt?:string;
  measurementSnapshotAt?:string;
  outcome?:SeoTaskOutcome;
  closedAt?:string;
  snoozedUntil?:string;
  updatedAt:string;
};

export type SeoTaskMap=Record<string,SeoCommandTask>;
export type SeoTaskKvBinding={
  get(key:string):Promise<string|null>;
  put(key:string,value:string):Promise<void>;
};

type GlobalWithSeoTaskKv=typeof globalThis&{__PANCHVANI_SEO_TASK_KV__?:SeoTaskKvBinding|null};

function currentRuntimeBinding(){
  return (globalThis as GlobalWithSeoTaskKv).__PANCHVANI_SEO_TASK_KV__??null;
}

export function setSeoTaskKvBinding(binding:SeoTaskKvBinding|null|undefined){
  (globalThis as GlobalWithSeoTaskKv).__PANCHVANI_SEO_TASK_KV__=binding??null;
}

function namespaceId(){
  return process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID??process.env.GSC_SNAPSHOT_KV_NAMESPACE_ID??null;
}

export function getSeoTaskStoreStatus(){
  const namespace=namespaceId();
  if(currentRuntimeBinding()){
    return {
      configured:true,
      mode:"binding" as const,
      required:{SEO_TASK_KV_BINDING:true},
      namespaceId:namespace,
      storageKey:STORAGE_KEY,
      usingSharedGscNamespace:!process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID,
      usingNativeBinding:true,
    };
  }
  const required={
    CLOUDFLARE_ACCOUNT_ID:Boolean(process.env.CLOUDFLARE_ACCOUNT_ID),
    CLOUDFLARE_API_TOKEN:Boolean(process.env.CLOUDFLARE_API_TOKEN),
    SEO_OPPORTUNITY_KV_NAMESPACE_ID:Boolean(namespace),
  };
  return {
    configured:Object.values(required).every(Boolean),
    mode:"rest" as const,
    required,
    namespaceId:namespace,
    storageKey:STORAGE_KEY,
    usingSharedGscNamespace:!process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID&&Boolean(process.env.GSC_SNAPSHOT_KV_NAMESPACE_ID),
    usingNativeBinding:false,
  };
}

function endpoint(){
  const account=process.env.CLOUDFLARE_ACCOUNT_ID;
  const namespace=namespaceId();
  if(!account||!namespace)throw new Error("SEO task KV storage is not configured.");
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/storage/kv/namespaces/${encodeURIComponent(namespace)}/values/${encodeURIComponent(STORAGE_KEY)}`;
}

function headers(contentType=false){
  const token=process.env.CLOUDFLARE_API_TOKEN;
  if(!token)throw new Error("CLOUDFLARE_API_TOKEN is not configured.");
  return {authorization:`Bearer ${token}`,...(contentType?{"content-type":"application/json"}:{})};
}

export async function readSeoTaskMap():Promise<SeoTaskMap>{
  const binding=currentRuntimeBinding();
  if(binding){
    const raw=await binding.get(STORAGE_KEY);
    if(!raw?.trim())return {};
    try{const parsed=JSON.parse(raw) as SeoTaskMap;return parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?parsed:{};}catch{throw new Error("Cloudflare KV SEO task payload is not valid JSON.");}
  }
  if(!getSeoTaskStoreStatus().configured)return {};
  const response=await fetch(endpoint(),{headers:headers(),cache:"no-store"});
  if(response.status===404)return {};
  if(!response.ok){const text=await response.text();throw new Error(`Cloudflare KV SEO task read failed (${response.status}): ${text.slice(0,240)}`);}
  const raw=await response.text();
  if(!raw.trim())return {};
  try{const parsed=JSON.parse(raw) as SeoTaskMap;return parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?parsed:{};}catch{throw new Error("Cloudflare KV SEO task payload is not valid JSON.");}
}

export async function writeSeoTaskMap(map:SeoTaskMap){
  const binding=currentRuntimeBinding();
  if(binding){
    await binding.put(STORAGE_KEY,JSON.stringify(map));
    return;
  }
  if(!getSeoTaskStoreStatus().configured)throw new Error("SEO task KV storage is not configured.");
  const response=await fetch(endpoint(),{method:"PUT",headers:headers(true),body:JSON.stringify(map),cache:"no-store"});
  if(!response.ok){const text=await response.text();throw new Error(`Cloudflare KV SEO task write failed (${response.status}): ${text.slice(0,240)}`);}
}

export function seoTaskId(url:string,query:string){return `seo:${url.trim()}::${query.trim().toLowerCase()}`;}
