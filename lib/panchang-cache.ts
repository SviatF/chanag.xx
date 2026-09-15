import type {City} from "./cities";
import type {Panchang} from "./panchang";

export type PanchangKvBinding={
  get(key:string):Promise<string|null>;
  put(key:string,value:string,options?:{expirationTtl?:number}):Promise<void>;
};

type PanchangGlobal=typeof globalThis&{
  __PANCHVANI_PANCHANG_KV__?:PanchangKvBinding;
};

const CACHE_PREFIX="panchang:v1";
const MEMORY_LIMIT=128;
const KV_TTL_SECONDS=90*24*60*60;
const memory=new Map<string,Panchang>();
const inflight=new Map<string,Promise<Panchang>>();

function runtimeGlobal(){return globalThis as PanchangGlobal;}

export function setPanchangKvBinding(binding?:PanchangKvBinding){
  if(binding)runtimeGlobal().__PANCHVANI_PANCHANG_KV__=binding;
}

export function getPanchangKvBinding(){return runtimeGlobal().__PANCHVANI_PANCHANG_KV__;}

export function panchangCacheKey(citySlug:string,dateIso:string){
  return `${CACHE_PREFIX}:${citySlug}:${dateIso}`;
}

function remember(key:string,value:Panchang){
  if(memory.has(key))memory.delete(key);
  memory.set(key,value);
  while(memory.size>MEMORY_LIMIT){
    const oldest=memory.keys().next().value as string|undefined;
    if(!oldest)break;
    memory.delete(oldest);
  }
}

function parseCached(raw:string|null):Panchang|null{
  if(!raw)return null;
  try{
    const value=JSON.parse(raw) as Panchang;
    if(!value||typeof value!=="object"||typeof value.date!=="string"||typeof value.sunrise!=="string"||typeof value.tithi!=="string")return null;
    return value;
  }catch{return null;}
}

export function clearPanchangCacheForTests(){
  memory.clear();
  inflight.clear();
  delete runtimeGlobal().__PANCHVANI_PANCHANG_KV__;
}

export async function getOrComputeCachedPanchang(
  key:string,
  compute:()=>Promise<Panchang>,
):Promise<Panchang>{
  const inMemory=memory.get(key);
  if(inMemory)return inMemory;

  const existing=inflight.get(key);
  if(existing)return existing;

  const promise=(async()=>{
    const kv=getPanchangKvBinding();
    if(kv){
      try{
        const cached=parseCached(await kv.get(key));
        if(cached){remember(key,cached);return cached;}
      }catch{
        // A KV read failure must never make a public Panchang unavailable.
      }
    }

    const value=await compute();
    remember(key,value);
    if(kv){
      try{await kv.put(key,JSON.stringify(value),{expirationTtl:KV_TTL_SECONDS});}
      catch{
        // Calculation is authoritative; a persistence failure is non-fatal.
      }
    }
    return value;
  })();

  inflight.set(key,promise);
  try{return await promise;}
  finally{if(inflight.get(key)===promise)inflight.delete(key);}
}

export async function getCachedPanchang(date:Date,city:City):Promise<Panchang>{
  const dateIso=date.toISOString().slice(0,10);
  const key=panchangCacheKey(city.slug,dateIso);
  return getOrComputeCachedPanchang(key,async()=>{
    // Keep Swiss Ephemeris completely out of a cache-hit request path.
    const {getPanchang}=await import("./panchang");
    return getPanchang(date,city);
  });
}
