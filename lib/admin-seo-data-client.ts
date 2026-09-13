"use client";

import type {GscSeoOsDataset} from "./gsc-seo-os";
import type {SeoTaskMap} from "./seo-task-store";

export type SeoOsClientPayload={
  dataset:GscSeoOsDataset;
  tasks:SeoTaskMap;
  taskStorage:{configured:boolean;required:Record<string,boolean>;storageKey:string};
};

type CacheEntry={expiresAt:number;payload:SeoOsClientPayload};
const CACHE_KEY="panchvani:admin:seo-os:v2";
const FORCE_REFRESH_KEY="panchvani:admin:seo-os:last-force:v1";
const TTL_MS=60*60*1000;
const FORCE_REFRESH_COOLDOWN_MS=30*60*1000;
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

function forcedRefreshAllowed(now:number){
  if(typeof window==="undefined")return true;
  try{
    const last=Number(sessionStorage.getItem(FORCE_REFRESH_KEY)??"0");
    return !Number.isFinite(last)||last<=0||now-last>=FORCE_REFRESH_COOLDOWN_MS;
  }catch{return true;}
}

function markForcedRefresh(){
  if(typeof window!=="undefined")try{sessionStorage.setItem(FORCE_REFRESH_KEY,String(Date.now()));}catch{}
}

export async function loadSeoOperatingData(force=false):Promise<SeoOsClientPayload>{
  const now=Date.now();
  let effectiveForce=force;

  if(force&&!forcedRefreshAllowed(now)){
    effectiveForce=false;
    if(memory&&memory.expiresAt>now)return memory.payload;
    const stored=readSession();if(stored){memory=stored;return stored.payload;}
  }

  if(!effectiveForce&&memory&&memory.expiresAt>now)return memory.payload;
  if(!effectiveForce){const stored=readSession();if(stored){memory=stored;return stored.payload;}}
  if(inflight)return inflight;

  const request=fetch(`/api/admin/seo-data${effectiveForce?"?refresh=1":""}`,{cache:"no-store"})
    .then(async response=>{
      const json=await response.json() as SeoOsClientPayload&{error?:string};
      if(!response.ok)throw new Error(json.error??`SEO data request failed (${response.status})`);
      const entry={payload:json,expiresAt:Date.now()+TTL_MS};
      write(entry);
      if(effectiveForce)markForcedRefresh();
      return json;
    })
    .finally(()=>{inflight=null;});
  inflight=request;
  return request;
}

export function patchSeoTask(task:SeoTaskMap[string]){
  if(!memory)return;
  const payload={...memory.payload,tasks:{...memory.payload.tasks,[task.id]:task}};
  write({payload,expiresAt:memory.expiresAt});
}

export function clearSeoOperatingCache(){
  memory=null;
  if(typeof window!=="undefined")try{sessionStorage.removeItem(CACHE_KEY);}catch{}
}
