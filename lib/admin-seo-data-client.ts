"use client";

import type {GscSeoOsDataset} from "./gsc-seo-os";
import type {SeoTaskMap} from "./seo-task-store";

export type SeoOsClientPayload={
  dataset:GscSeoOsDataset;
  tasks:SeoTaskMap;
  taskStorage:{configured:boolean;required:Record<string,boolean>;storageKey:string};
};

type CacheEntry={expiresAt:number;payload:SeoOsClientPayload};
const CACHE_KEY="panchvani:admin:seo-os:v1";
const TTL_MS=5*60*1000;
let memory:CacheEntry|null=null;
let inflight:Promise<SeoOsClientPayload>|null=null;

function readSession(){
  if(typeof window==="undefined")return null;
  try{
    const raw=sessionStorage.getItem(CACHE_KEY);if(!raw)return null;
    const parsed=JSON.parse(raw) as CacheEntry;
    if(!parsed?.payload||parsed.expiresAt<=Date.now()){sessionStorage.removeItem(CACHE_KEY);return null;}
    return parsed;
  }catch{return null;}
}

function write(entry:CacheEntry){
  memory=entry;
  if(typeof window!=="undefined")try{sessionStorage.setItem(CACHE_KEY,JSON.stringify(entry));}catch{}
}

export async function loadSeoOperatingData(force=false):Promise<SeoOsClientPayload>{
  const now=Date.now();
  if(!force&&memory&&memory.expiresAt>now)return memory.payload;
  if(!force){const stored=readSession();if(stored){memory=stored;return stored.payload;}}
  if(inflight)return inflight;

  const request=fetch(`/api/admin/seo-data${force?"?refresh=1":""}`,{cache:"no-store"})
    .then(async response=>{const json=await response.json() as SeoOsClientPayload&{error?:string};if(!response.ok)throw new Error(json.error??`SEO data request failed (${response.status})`);const entry={payload:json,expiresAt:Date.now()+TTL_MS};write(entry);return json;})
    .finally(()=>{inflight=null;});
  inflight=request;
  return request;
}

export function patchSeoTask(task:SeoTaskMap[string]){
  if(!memory)return;
  const payload={...memory.payload,tasks:{...memory.payload.tasks,[task.id]:task}};
  write({payload,expiresAt:memory.expiresAt});
}

export function clearSeoOperatingCache(){memory=null;if(typeof window!=="undefined")try{sessionStorage.removeItem(CACHE_KEY);}catch{}}
