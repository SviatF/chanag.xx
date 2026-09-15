import type {City} from "./cities";
import type {Panchang} from "./panchang";
import type {LunarMonthConventions} from "./calendar-conventions";

export type PanchangKvBinding={
  get(key:string):Promise<string|null>;
  put(key:string,value:string,options?:{expirationTtl?:number}):Promise<void>;
};

export type DailyPanchangPayload={
  data:Panchang;
  lunar:LunarMonthConventions;
};

type PanchangGlobal=typeof globalThis&{
  __PANCHVANI_PANCHANG_KV__?:PanchangKvBinding;
};

const CACHE_PREFIX="panchang:v1";
const DAILY_CACHE_PREFIX="daily-panchang:v2";
const MEMORY_LIMIT=128;
const KV_TTL_SECONDS=90*24*60*60;
const memory=new Map<string,Panchang>();
const inflight=new Map<string,Promise<Panchang>>();
const dailyMemory=new Map<string,DailyPanchangPayload>();
const dailyInflight=new Map<string,Promise<DailyPanchangPayload>>();

function runtimeGlobal(){return globalThis as PanchangGlobal;}

export function setPanchangKvBinding(binding?:PanchangKvBinding){
  if(binding)runtimeGlobal().__PANCHVANI_PANCHANG_KV__=binding;
}

export function getPanchangKvBinding(){return runtimeGlobal().__PANCHVANI_PANCHANG_KV__;}

export function panchangCacheKey(citySlug:string,dateIso:string){
  return `${CACHE_PREFIX}:${citySlug}:${dateIso}`;
}

export function dailyPanchangCacheKey(citySlug:string,dateIso:string){
  return `${DAILY_CACHE_PREFIX}:${citySlug}:${dateIso}`;
}

function remember<T>(cache:Map<string,T>,key:string,value:T){
  if(cache.has(key))cache.delete(key);
  cache.set(key,value);
  while(cache.size>MEMORY_LIMIT){
    const oldest=cache.keys().next().value as string|undefined;
    if(!oldest)break;
    cache.delete(oldest);
  }
}

function parsePanchang(raw:string|null):Panchang|null{
  if(!raw)return null;
  try{
    const value=JSON.parse(raw) as Panchang;
    if(!value||typeof value!=="object"||typeof value.date!=="string"||typeof value.sunrise!=="string"||typeof value.tithi!=="string")return null;
    return value;
  }catch{return null;}
}

function parseDailyPayload(raw:string|null):DailyPanchangPayload|null{
  if(!raw)return null;
  try{
    const value=JSON.parse(raw) as DailyPanchangPayload;
    if(!value||typeof value!=="object"||!value.data||!value.lunar)return null;
    if(typeof value.data.date!=="string"||typeof value.data.sunrise!=="string"||typeof value.data.tithi!=="string")return null;
    if(typeof value.lunar.amantaLabel!=="string"||typeof value.lunar.purnimantaLabel!=="string")return null;
    return value;
  }catch{return null;}
}

export function clearPanchangCacheForTests(){
  memory.clear();
  inflight.clear();
  dailyMemory.clear();
  dailyInflight.clear();
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
        const cached=parsePanchang(await kv.get(key));
        if(cached){remember(memory,key,cached);return cached;}
      }catch{}
    }
    const value=await compute();
    remember(memory,key,value);
    if(kv){
      try{await kv.put(key,JSON.stringify(value),{expirationTtl:KV_TTL_SECONDS});}catch{}
    }
    return value;
  })();

  inflight.set(key,promise);
  try{return await promise;}
  finally{if(inflight.get(key)===promise)inflight.delete(key);}
}

export async function getOrComputeCachedDailyPanchang(
  key:string,
  compute:()=>Promise<DailyPanchangPayload>,
):Promise<DailyPanchangPayload>{
  const inMemory=dailyMemory.get(key);
  if(inMemory)return inMemory;
  const existing=dailyInflight.get(key);
  if(existing)return existing;

  const promise=(async()=>{
    const kv=getPanchangKvBinding();
    if(kv){
      try{
        const cached=parseDailyPayload(await kv.get(key));
        if(cached){remember(dailyMemory,key,cached);return cached;}
      }catch{}
    }
    const value=await compute();
    remember(dailyMemory,key,value);
    if(kv){
      try{await kv.put(key,JSON.stringify(value),{expirationTtl:KV_TTL_SECONDS});}catch{}
    }
    return value;
  })();

  dailyInflight.set(key,promise);
  try{return await promise;}
  finally{if(dailyInflight.get(key)===promise)dailyInflight.delete(key);}
}

export async function getCachedPanchang(date:Date,city:City):Promise<Panchang>{
  const dateIso=date.toISOString().slice(0,10);
  return getOrComputeCachedPanchang(panchangCacheKey(city.slug,dateIso),async()=>{
    const {getPanchang}=await import("./panchang");
    return getPanchang(date,city);
  });
}

export async function getCachedDailyPanchangData(date:Date,city:City):Promise<DailyPanchangPayload>{
  const dateIso=date.toISOString().slice(0,10);
  return getOrComputeCachedDailyPanchang(dailyPanchangCacheKey(city.slug,dateIso),async()=>{
    // Both calculation modules contain Swiss Ephemeris. Keep them completely out
    // of the request path when the deterministic city/date payload is already cached.
    const [{getPanchang},{getLunarMonthConventions}]=await Promise.all([
      import("./panchang"),
      import("./calendar-conventions"),
    ]);
    const data=await getPanchang(date,city);
    const lunar=getLunarMonthConventions(date,city,data);
    return {data,lunar};
  });
}
