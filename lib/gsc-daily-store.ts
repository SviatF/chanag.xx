import type {GscTrafficSnapshot} from "./gsc";
import type {GscSeoOsDataset} from "./gsc-seo-os";

const STORAGE_KEY="panchvani:gsc:daily-snapshot:v1";
const MEMORY_TTL_MS=60*60*1000;

export type GscDailySnapshot={
  version:1;
  refreshedAt:string;
  // Latest day Google currently reports as final. This may be earlier than the
  // requested range when the fresh-data API marks recent rows as incomplete.
  finalDataThrough:string;
  // Latest completed Europe/Kyiv calendar day requested from GSC.
  requestedDataThrough?:string;
  // First date Google marks as incomplete when dataState="all" is used.
  firstIncompleteDate?:string|null;
  dataset:GscSeoOsDataset;
  traffic:GscTrafficSnapshot;
};

export type GscDailyStoreRead={snapshot:GscDailySnapshot|null;source:"MEMORY"|"KV"|"NONE";subrequests:number};
export type GscDailyKvBinding={
  get(key:string):Promise<string|null>;
  put(key:string,value:string):Promise<void>;
};

type GlobalWithGscKv=typeof globalThis&{__PANCHVANI_GSC_DAILY_KV__?:GscDailyKvBinding|null};

let memory:{expiresAt:number;snapshot:GscDailySnapshot}|null=null;

function currentRuntimeBinding(){
  return (globalThis as GlobalWithGscKv).__PANCHVANI_GSC_DAILY_KV__??null;
}

export function setGscDailyKvBinding(binding:GscDailyKvBinding|null|undefined){
  // Vinext can bundle the Worker entry and Next route graph as separate module copies.
  // Module-local state is therefore not a safe bridge for runtime bindings. globalThis
  // is isolate-wide and lets the API route and scheduled handler see the same KV binding.
  (globalThis as GlobalWithGscKv).__PANCHVANI_GSC_DAILY_KV__=binding??null;
}

function namespaceId(){
  return process.env.GSC_SNAPSHOT_KV_NAMESPACE_ID??process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID??null;
}

export function getGscDailyStoreStatus(){
  const namespace=namespaceId();
  if(currentRuntimeBinding()){
    return {
      configured:true,
      mode:"binding" as const,
      required:{GSC_SNAPSHOT_KV_BINDING:true},
      namespaceId:namespace,
      storageKey:STORAGE_KEY,
      usingSharedSeoNamespace:false,
      usingNativeBinding:true,
    };
  }
  const required={
    CLOUDFLARE_ACCOUNT_ID:Boolean(process.env.CLOUDFLARE_ACCOUNT_ID),
    CLOUDFLARE_API_TOKEN:Boolean(process.env.CLOUDFLARE_API_TOKEN),
    GSC_SNAPSHOT_KV_NAMESPACE_ID:Boolean(namespace),
  };
  return {
    configured:Object.values(required).every(Boolean),
    mode:"rest" as const,
    required,
    namespaceId:namespace,
    storageKey:STORAGE_KEY,
    usingSharedSeoNamespace:!process.env.GSC_SNAPSHOT_KV_NAMESPACE_ID&&Boolean(process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID),
    usingNativeBinding:false,
  };
}

function endpoint(){
  const account=process.env.CLOUDFLARE_ACCOUNT_ID;
  const namespace=namespaceId();
  if(!account||!namespace)throw new Error("Daily GSC snapshot KV storage is not configured.");
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/storage/kv/namespaces/${encodeURIComponent(namespace)}/values/${encodeURIComponent(STORAGE_KEY)}`;
}

function headers(contentType=false){
  const token=process.env.CLOUDFLARE_API_TOKEN;
  if(!token)throw new Error("CLOUDFLARE_API_TOKEN is not configured.");
  return {authorization:`Bearer ${token}`,...(contentType?{"content-type":"application/json"}:{})};
}

function validSnapshot(value:unknown):value is GscDailySnapshot{
  if(!value||typeof value!=="object"||Array.isArray(value))return false;
  const row=value as Partial<GscDailySnapshot>;
  return row.version===1&&typeof row.refreshedAt==="string"&&typeof row.finalDataThrough==="string"&&Boolean(row.dataset)&&Boolean(row.traffic);
}

export async function readGscDailySnapshot(force=false):Promise<GscDailyStoreRead>{
  const now=Date.now();
  if(!force&&memory&&memory.expiresAt>now)return {snapshot:memory.snapshot,source:"MEMORY",subrequests:0};
  const binding=currentRuntimeBinding();
  if(binding){
    const raw=await binding.get(STORAGE_KEY);
    if(!raw?.trim())return {snapshot:null,source:"KV",subrequests:1};
    let parsed:unknown;
    try{parsed=JSON.parse(raw);}catch{throw new Error("Cloudflare KV daily GSC payload is not valid JSON.");}
    if(!validSnapshot(parsed))throw new Error("Cloudflare KV daily GSC payload has an invalid shape.");
    memory={snapshot:parsed,expiresAt:Date.now()+MEMORY_TTL_MS};
    return {snapshot:parsed,source:"KV",subrequests:1};
  }
  if(!getGscDailyStoreStatus().configured)return {snapshot:null,source:"NONE",subrequests:0};
  const response=await fetch(endpoint(),{headers:headers(),cache:"no-store"});
  if(response.status===404)return {snapshot:null,source:"KV",subrequests:1};
  if(!response.ok){const text=await response.text();throw new Error(`Cloudflare KV daily GSC read failed (${response.status}): ${text.slice(0,240)}`);}
  const raw=await response.text();
  if(!raw.trim())return {snapshot:null,source:"KV",subrequests:1};
  let parsed:unknown;
  try{parsed=JSON.parse(raw);}catch{throw new Error("Cloudflare KV daily GSC payload is not valid JSON.");}
  if(!validSnapshot(parsed))throw new Error("Cloudflare KV daily GSC payload has an invalid shape.");
  memory={snapshot:parsed,expiresAt:Date.now()+MEMORY_TTL_MS};
  return {snapshot:parsed,source:"KV",subrequests:1};
}

export async function writeGscDailySnapshot(snapshot:GscDailySnapshot){
  const binding=currentRuntimeBinding();
  if(binding){
    await binding.put(STORAGE_KEY,JSON.stringify(snapshot));
    memory={snapshot,expiresAt:Date.now()+MEMORY_TTL_MS};
    return;
  }
  if(!getGscDailyStoreStatus().configured)throw new Error("Daily GSC snapshot KV storage is not configured.");
  const response=await fetch(endpoint(),{method:"PUT",headers:headers(true),body:JSON.stringify(snapshot),cache:"no-store"});
  if(!response.ok){const text=await response.text();throw new Error(`Cloudflare KV daily GSC write failed (${response.status}): ${text.slice(0,240)}`);}
  memory={snapshot,expiresAt:Date.now()+MEMORY_TTL_MS};
}

export function clearGscDailySnapshotMemoryForTests(){memory=null;}
