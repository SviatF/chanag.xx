export type RuntimeCacheStatus="HIT"|"MISS"|"COALESCED";

export const ADMIN_PROVIDER_TTL_MS={
  gsc:15*60*1000,
  ga4:5*60*1000,
  bing:15*60*1000,
  cloudflare:60*1000,
} as const;

export const ADMIN_RUNTIME_LIMITS={cpuMs:500,subrequests:30} as const;

type MemoryEntry<T>={expiresAt:number;value:T};
type EdgeCacheLike={match(request:Request):Promise<Response|undefined>;put(request:Request,response:Response):Promise<void>};

const memory=new Map<string,MemoryEntry<unknown>>();
const inflight=new Map<string,Promise<unknown>>();

function edgeCache():EdgeCacheLike|null{
  const runtime=globalThis as typeof globalThis&{caches?:{default?:EdgeCacheLike}};
  return runtime.caches?.default??null;
}

function cacheRequest(key:string){
  return new Request(`https://panchvani-runtime-cache.invalid/${encodeURIComponent(key)}`,{method:"GET"});
}

async function readEdge<T>(key:string):Promise<{entry:MemoryEntry<T>|null;operations:number}>{
  const cache=edgeCache();
  if(!cache)return {entry:null,operations:0};
  try{
    const response=await cache.match(cacheRequest(key));
    if(!response)return {entry:null,operations:1};
    const entry=await response.json() as MemoryEntry<T>;
    if(!entry||!Number.isFinite(entry.expiresAt)||entry.expiresAt<=Date.now())return {entry:null,operations:1};
    return {entry,operations:1};
  }catch{return {entry:null,operations:1};}
}

async function writeEdge<T>(key:string,entry:MemoryEntry<T>,ttlMs:number){
  const cache=edgeCache();
  if(!cache)return 0;
  try{
    await cache.put(cacheRequest(key),new Response(JSON.stringify(entry),{
      headers:{"content-type":"application/json","cache-control":`max-age=${Math.max(1,Math.floor(ttlMs/1000))}`},
    }));
    return 1;
  }catch{return 1;}
}

export async function cachedCoalesced<T>(
  key:string,
  ttlMs:number,
  loader:()=>Promise<T>,
  options:{force?:boolean}={}
):Promise<{value:T;cacheStatus:RuntimeCacheStatus;cacheOperations:number}>{
  const now=Date.now();
  if(!options.force){
    const local=memory.get(key) as MemoryEntry<T>|undefined;
    if(local&&local.expiresAt>now)return {value:local.value,cacheStatus:"HIT",cacheOperations:0};

    const edge=await readEdge<T>(key);
    if(edge.entry){
      memory.set(key,edge.entry as MemoryEntry<unknown>);
      return {value:edge.entry.value,cacheStatus:"HIT",cacheOperations:edge.operations};
    }

    const running=inflight.get(key) as Promise<T>|undefined;
    if(running)return {value:await running,cacheStatus:"COALESCED",cacheOperations:edge.operations};

    const request=loader().then(async value=>{
      const entry:MemoryEntry<T>={value,expiresAt:Date.now()+ttlMs};
      memory.set(key,entry as MemoryEntry<unknown>);
      await writeEdge(key,entry,ttlMs);
      return value;
    }).finally(()=>{inflight.delete(key);});
    inflight.set(key,request as Promise<unknown>);
    return {value:await request,cacheStatus:"MISS",cacheOperations:edge.operations+(edgeCache()?1:0)};
  }

  const running=inflight.get(key) as Promise<T>|undefined;
  if(running)return {value:await running,cacheStatus:"COALESCED",cacheOperations:0};

  const request=loader().then(async value=>{
    const entry:MemoryEntry<T>={value,expiresAt:Date.now()+ttlMs};
    memory.set(key,entry as MemoryEntry<unknown>);
    await writeEdge(key,entry,ttlMs);
    return value;
  }).finally(()=>{inflight.delete(key);});
  inflight.set(key,request as Promise<unknown>);
  return {value:await request,cacheStatus:"MISS",cacheOperations:edgeCache()?1:0};
}

export function clearRuntimeCacheForTests(){
  memory.clear();
  inflight.clear();
}
