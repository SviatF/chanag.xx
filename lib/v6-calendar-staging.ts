/**
 * Wave 3AH — isolated, versioned preparation for a V6 calendar release.
 * No public route or production selector imports this module.
 * Lunar phases are JPL; Nakshatra/Yoga, sidereal month, Samvat and ceremony
 * decisions STILL depend on V5. Never publish this hybrid candidate.
 */
import type {City} from "./cities";
import type {Panchang} from "./panchang";
import {getPanchang} from "./panchang";
import type {VratOccurrence,VratSlug} from "./vrat";
import {toMuhuratPanchangSnapshot,type MuhuratPanchangSnapshot} from "./muhurat-build-data-schema";
import {JPL_V6_ROOTS_ASSET_SHA256,getPinnedV6HalfTithiTable} from "./jpl-v6-pinned-data";
import {getJplV6SunriseLunarCanary,type JplV6SunriseLunarCanary} from "./jpl-v6-crossfamily-canary";

export const PUBLIC_LUNAR_ENGINE_VERSION="v5-swiss-moshier" as const;
export const STAGED_LUNAR_ENGINE_VERSION="v6-jpl-de440s" as const;
export const V6_STAGING_SHARD_SCHEMA=6 as const;
export const UNRECONCILED_V6_DEPENDENCIES=[
  "Nakshatra and Yoga remain Swiss/Moshier",
  "Sidereal Hindu month and Samvat year start remain V5",
  "Moon illumination remains computed from V5 elongation",
  "Festival/Smarta/Vaishnava/ISKCON fasting and Parana rules not certified",
  "Muhurat rankings, Asta and local ritual prohibitions not approved"
] as const;

const IST_MS=330*60000;
const MS_DAY=86400000;
const pad=(n:number)=>String(n).padStart(2,"0");
const weekday=(iso:string)=>new Intl.DateTimeFormat("en-IN",{weekday:"long",timeZone:"UTC"})
  .format(new Date(iso+"T12:00:00Z"));
function requireDate(dateIso:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)||
     !Number.isFinite(Date.parse(dateIso+"T00:00:00Z"))||
     new Date(dateIso+"T00:00:00Z").toISOString().slice(0,10)!==dateIso)
    throw Error("Invalid V6 staging date "+dateIso);
  const year=Number(dateIso.slice(0,4));
  if(year<2025||year>2030)throw Error("V6 staging outside JPL 2025–2030 source coverage");
}
function roundedIstSunrise(utc:string){
  const ms=Date.parse(utc);
  if(!Number.isFinite(ms))throw Error("V6 staging sunrise not finite");
  return new Date(Math.round((ms+IST_MS)/60000)*60000).toISOString().slice(11,16);
}
function stageLunar(dateIso:string,city:City){
  requireDate(dateIso);
  return getJplV6SunriseLunarCanary(dateIso,city,getPinnedV6HalfTithiTable());
}
/**
 * A versioned cache key can NEVER collide with the old v5 city/month cache.
 * Including the raw JPL asset digest makes an ephemeris update invalidate V6.
 */
export function v6StagingCacheKey(year:number,month:number,city:City){
  if(!Number.isInteger(year)||year<2025||year>2030||
     !Number.isInteger(month)||month<1||month>12)
    throw Error("Invalid V6 staging cache period");
  return [STAGED_LUNAR_ENGINE_VERSION,V6_STAGING_SHARD_SCHEMA,
    JPL_V6_ROOTS_ASSET_SHA256,city.slug,city.lat.toFixed(6),city.lng.toFixed(6),
    year+"-"+pad(month)].join(":");
}
/** Hard gate: no environment override, query parameter or stale shard may promote V6. */
export function assertProductionLunarEngine(version:string){
  if(version!==PUBLIC_LUNAR_ENGINE_VERSION)
    throw Error("V6 production activation blocked: reconcile sidereal, ritual and committed V6 shards first");
  return PUBLIC_LUNAR_ENGINE_VERSION;
}
export type StagedV6Daily={
  engine:typeof STAGED_LUNAR_ENGINE_VERSION;
  provenanceSha256:typeof JPL_V6_ROOTS_ASSET_SHA256;
  lunar:JplV6SunriseLunarCanary;
  baselineV5:{engine:Panchang["engine"];paksha:Panchang["paksha"];tithi:string};
  /** For research only. Five V5-derived fields are still mathematically mixed. */
  simulatedPanchang:Panchang;
  unreconciled:typeof UNRECONCILED_V6_DEPENDENCIES;
  publicReleaseAllowed:false;
};
export async function getStagedV6Daily(dateIso:string,city:City):Promise<StagedV6Daily>{
  const lunar=stageLunar(dateIso,city);
  const v5=await getPanchang(new Date(dateIso+"T12:00:00Z"),city);
  if(v5.date!==lunar.date||v5.sunrise!==roundedIstSunrise(lunar.sunriseUtc))
    throw Error("V5/V6 sunrise or India civil date mismatch "+city.slug+" "+dateIso);
  // Only the common 6° JPL-derived fields are substituted. No claimed
  // certification for the retained V5 sidereal and cultural fields.
  const simulatedPanchang:Panchang={
    ...v5,paksha:lunar.paksha,tithi:lunar.tithi,
    tithiEnd:lunar.tithiEnd,tithiEndDate:lunar.tithiEndDate,
    karana:lunar.karana,karanaEnd:lunar.karanaEnd,
    karanaEndDate:lunar.karanaEndDate
  };
  return {
    engine:STAGED_LUNAR_ENGINE_VERSION,
    provenanceSha256:JPL_V6_ROOTS_ASSET_SHA256,
    lunar,baselineV5:{engine:v5.engine,paksha:v5.paksha,tithi:v5.tithi},
    simulatedPanchang,unreconciled:UNRECONCILED_V6_DEPENDENCIES,
    publicReleaseAllowed:false
  };
}
const vratSlugFromTithi=(tithi:string):VratSlug|null=>
  tithi==="Ekadashi"?"ekadashi":tithi==="Purnima"?"purnima":
  tithi==="Amavasya"?"amavasya":null;
/** Sunrise Tithi REFERENCE dates, not a ritual fasting calendar. */
export function getStagedV6VratYear(year:number,city:City){
  if(!Number.isInteger(year)||year<2025||year>2030)
    throw Error("V6 staged Vrat requires complete 2025–2030 year");
  const rows:Record<VratSlug,VratOccurrence[]>={ekadashi:[],purnima:[],amavasya:[]};
  for(let cursor=Date.UTC(year,0,1);cursor<Date.UTC(year+1,0,1);cursor+=MS_DAY){
    const dateIso=new Date(cursor).toISOString().slice(0,10);
    const lunar=stageLunar(dateIso,city);
    const slug=vratSlugFromTithi(lunar.tithi);
    if(!slug)continue;
    const family=rows[slug];
    const prev=family.at(-1);
    const yesterday=new Date(cursor-MS_DAY).toISOString().slice(0,10);
    family.push({
      date:dateIso,weekday:weekday(dateIso),paksha:lunar.paksha,
      tithi:lunar.tithi as VratOccurrence["tithi"],
      sunrise:roundedIstSunrise(lunar.sunriseUtc),
      tithiEnd:lunar.tithiEnd,tithiEndDate:lunar.tithiEndDate,
      repeatedAtSunrise:prev?.date===yesterday&&prev?.paksha===lunar.paksha,
      sequence:family.length+1
    });
  }
  return {
    engine:STAGED_LUNAR_ENGINE_VERSION,provenanceSha256:JPL_V6_ROOTS_ASSET_SHA256,
    year,city:city.slug,rows,
    fastingAndParanaCertified:false as const,publicReleaseAllowed:false as const
  };
}
export async function getStagedV6MuhuratMonth(year:number,month:number,city:City){
  const key=v6StagingCacheKey(year,month,city);
  const days=new Date(Date.UTC(year,month,0)).getUTCDate();
  const rows:MuhuratPanchangSnapshot[]=[];
  for(let d=1;d<=days;d++){
    const day=await getStagedV6Daily(year+"-"+pad(month)+"-"+pad(d),city);
    rows.push(toMuhuratPanchangSnapshot(day.simulatedPanchang));
  }
  return {
    key,engine:STAGED_LUNAR_ENGINE_VERSION,
    provenanceSha256:JPL_V6_ROOTS_ASSET_SHA256,
    year,month,city:city.slug,rows,
    siderealFieldsReconciled:false as const,
    rankingsAndRitualWindowsCertified:false as const,
    publicReleaseAllowed:false as const
  };
}
/** V5 manifests lack all three fields; reject them rather than masquerade as V6. */
export function assertV6StagingShardIdentity(value:unknown){
  if(!value||typeof value!=="object")throw Error("No versioned V6 staging shard");
  const shard=value as Record<string,unknown>;
  if(shard.engine!==STAGED_LUNAR_ENGINE_VERSION||
     shard.schema!==V6_STAGING_SHARD_SCHEMA||
     shard.provenanceSha256!==JPL_V6_ROOTS_ASSET_SHA256||
     shard.publicReleaseAllowed!==false)
    throw Error("V5 or unverified V6 shard cannot serve the V6 staging engine");
  return true;
}
