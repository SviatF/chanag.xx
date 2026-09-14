import type {GscTrafficSnapshot} from "./gsc";
import type {GscSeoOsDataset} from "./gsc-seo-os";

const STORAGE_KEY="panchvani:gsc:daily-snapshot:v1";
const MEMORY_TTL_MS=60*60*1000;

export type GscDailySnapshot={
  version:1;
  refreshedAt:string;
  finalDataThrough:string;
  dataset:GscSeoOsDataset;
  traffic:GscTrafficSnapshot;
};

export type GscDailyStoreRead={snapshot:GscDailySnapshot|null;source:"MEMORY"|"KV"|"NONE";subrequests:number};

let memory:{expiresAt:number;snapshot:GscDailySnapshot}|null=null;

function namespaceId(){
  return process.env.GSC_SNAPSHOT_KV_NAMESPACE_ID??process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID??null;
}

export function getGscDailyStoreStatus(){
  const namespace=namespaceId();
  const required={
    CLOUDFLARE_ACCOUNT_ID:Boolean(process.env.CLOUDFLARE_ACCOUNT_ID),
    CLOUDFLARE_API_TOKEN:Boolean(process.env.CLOUDFLARE_API_TOKEN),
    GSC_SNAPSHOT_KV_NAMESPACE_ID:Boolean(namespace),
  };
  return {
    configured:Object.values(required).every(Boolean),
    required,
    namespaceId:namespace,
    storageKey:STORAGE_KEY,
    usingSharedSeoNamespace:!process.env.GSC_SNAPSHOT_KV_NAMESPACE_ID&&Boolean(process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID),
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
  if(!getGscDailyStoreStatus().configured)throw new Error("Daily GSC snapshot KV storage is not configured.");
  const response=await fetch(endpoint(),{method:"PUT",headers:headers(true),body:JSON.stringify(snapshot),cache:"no-store"});
  if(!response.ok){const text=await response.text();throw new Error(`Cloudflare KV daily GSC write failed (${response.status}): ${text.slice(0,240)}`);}
  memory={snapshot,expiresAt:Date.now()+MEMORY_TTL_MS};
}

export function clearGscDailySnapshotMemoryForTests(){memory=null;}
