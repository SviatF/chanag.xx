/**
 * Wave 3AP — one provenance-locked sunrise snapshot from the V6 JPL lunar
 * roots and V6 global JPL sidereal roots. 2026–2028 ONLY.
 *
 * Published V5 is untouched. Neither month/samvat nor observance/ceremony
 * approval can be inferred from this astronomy-only research result.
 */
import {createHash} from "node:crypto";
import type {City} from "./cities";
import {getPinnedV6HalfTithiTable,JPL_V6_ROOTS_ASSET_SHA256} from "./jpl-v6-pinned-data";
import {getJplV6SunriseLunarCanary} from "./jpl-v6-crossfamily-canary";
import {siderealStateAtUtc,validateSiderealTransitionTable,type JplSiderealTransitionTable} from "./jpl-v6-sidereal-transitions";
import {STAGED_LUNAR_ENGINE_VERSION,PUBLIC_LUNAR_ENGINE_VERSION} from "./v6-calendar-staging";

export const UNIFIED_V6_RESEARCH_SCHEMA=7 as const;
export const V6_UNIFIED_PINNED_SIDEREAL_SHA256="b898fefb8b23fd689c6c841828a6a2ff915df2e8c5cdd13cf3dfd9312b83a554" as const;
export const V6_UNIFIED_PINNED_LAHIRI_SHA256="f5a346251079734c66187f3b068ca97f12fae0dbb5bf9373e3fcf863ad6c9e54" as const;
const NAK=[
 "Ashwini","Bharani","Krittika","Rohini","Mrigashirsha","Ardra","Punarvasu",
 "Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra",
 "Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha",
 "Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"
] as const;
const YOGA=[
 "Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarma",
 "Dhriti","Shula","Ganda","Vriddhi","Dhruva","Vyaghata","Harshana","Vajra",
 "Siddhi","Vyatipata","Variyana","Parigha","Shiva","Siddha","Sadhya","Shubha",
 "Shukla","Brahma","Indra","Vaidhriti"
] as const;
const RASHI=["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula",
 "Vrishchika","Dhanu","Makara","Kumbha","Meena"] as const;
const IST_MS=330*60_000;
const pad=(n:number)=>String(n).padStart(2,"0");
const sha=(data:string)=>createHash("sha256").update(data).digest("hex");
const verified=new WeakSet<object>();
type RootSource={table:JplSiderealTransitionTable;sourceDigest:string;lahiriAnchorDigest:string;
  combinedIdentity:string;researchOnly:true};
function dateCheck(dateIso:string){
  const ms=Date.parse(dateIso+"T00:00:00Z");
  if(!/^20(26|27|28)-\d{2}-\d{2}$/.test(dateIso)||!Number.isFinite(ms)||
     new Date(ms).toISOString().slice(0,10)!==dateIso)
    throw Error("V6 unified sidereal staging supports valid 2026–2028 civil dates only");
  return ms;
}
function istBoundary(utc:string|null){
  if(!utc)return {utc:null,clock:null,civilDate:null};
  const at=Date.parse(utc);
  if(!Number.isFinite(at))throw Error("Unparseable JPL sidereal boundary");
  const india=new Date(Math.round((at+IST_MS)/60_000)*60_000).toISOString();
  return {utc,clock:india.slice(11,16),civilDate:india.slice(0,10)};
}
function requireSource(value:RootSource){
  if(!verified.has(value)||!Object.isFrozen(value))
    throw Error("V6 unified sidereal source was not SHA-pinned and validated");
  return value;
}
/** Verify both separately generated immutable source artifacts by their ACTUAL bytes. */
export function openVerifiedV6SiderealSource(rawCatalog:string,rawAnchors:string):RootSource{
  const catalog=JSON.parse(rawCatalog) as unknown;
  const table=validateSiderealTransitionTable(catalog);
  const sourceDigest=sha(rawCatalog);
  const anchorDigest=sha(rawAnchors);
  if(sourceDigest!==V6_UNIFIED_PINNED_SIDEREAL_SHA256||
     anchorDigest!==V6_UNIFIED_PINNED_LAHIRI_SHA256)
    throw Error("V6 sidereal artifact is not byte-for-byte the previously reviewed JPL catalog and Lahiri anchors");
  if(anchorDigest!==table.lahiriAnchorSha256)
    throw Error("JPL sidereal source does not match real measured Lahiri anchor SHA");
  const anchor=JSON.parse(rawAnchors) as Record<string,unknown>;
  if(anchor.wave!=="3AO"||anchor.version!==1||
     anchor.rootSourceSha256!==JPL_V6_ROOTS_ASSET_SHA256||
     anchor.jplKernelSha256!==table.solarLunarKernelSha256||
     anchor.fullyIndependentAyanamsa!==false||anchor.releaseApproved!==false||
     anchor.maxMeasuredMidpointInterpolationErrorArcsec!==table.maxMeasuredAnchorMidpointErrorArcsec)
    throw Error("Incorrect V6 sidereal measured-anchor source contract");
  // Lock all internal arrays against mutation after a proof of chronology.
  for(const rows of Object.values(table.events)){
    for(const pair of rows)Object.freeze(pair);
    Object.freeze(rows);
  }
  Object.freeze(table.events);
  Object.freeze(table.years);
  Object.freeze(table);
  const result=Object.freeze({table,sourceDigest,lahiriAnchorDigest:anchorDigest,
    combinedIdentity:sha([UNIFIED_V6_RESEARCH_SCHEMA,JPL_V6_ROOTS_ASSET_SHA256,
      sourceDigest,anchorDigest].join("|")),researchOnly:true as const});
  verified.add(result);
  return result;
}
export type VerifiedV6SiderealSource=ReturnType<typeof openVerifiedV6SiderealSource>;
export function unifiedV6ResearchKey(year:number,month:number,city:City,source:VerifiedV6SiderealSource){
  requireSource(source);
  if(!Number.isInteger(year)||year<2026||year>2028||
     !Number.isInteger(month)||month<1||month>12||
     !Number.isFinite(city.lat)||!Number.isFinite(city.lng))
    throw Error("Invalid V6 combined-source research key");
  return ["research",STAGED_LUNAR_ENGINE_VERSION,UNIFIED_V6_RESEARCH_SCHEMA,
    source.combinedIdentity,city.slug,city.lat.toFixed(6),city.lng.toFixed(6),
    year+"-"+pad(month)].join(":");
}
/**
 * Returns same-physical-sunrise JPL astronomy across ALL five families.
 * Unsupported dates, missing source bytes or version mismatches throw.
 */
export function getV6UnifiedSunrise(dateIso:string,city:City,source:VerifiedV6SiderealSource){
  requireSource(source);
  dateCheck(dateIso);
  const lunar=getJplV6SunriseLunarCanary(dateIso,city,getPinnedV6HalfTithiTable());
  const sidereal=siderealStateAtUtc(source.table,lunar.sunriseUtc);
  const sunriseMs=Date.parse(lunar.sunriseUtc);
  const families={
    nakshatra:{
      name:NAK[sidereal.nakshatra.index],index:sidereal.nakshatra.index,
      pada:sidereal.nakshatraPada,next:istBoundary(sidereal.nakshatra.nextTransitionUtc)
    },
    yoga:{
      name:YOGA[sidereal.yoga.index],index:sidereal.yoga.index,
      next:istBoundary(sidereal.yoga.nextTransitionUtc)
    },
    moonRashi:{name:RASHI[sidereal.moonRashi.index],
      index:sidereal.moonRashi.index,next:istBoundary(sidereal.moonRashi.nextTransitionUtc)},
    sunRashi:{name:RASHI[sidereal.sunRashi.index],
      index:sidereal.sunRashi.index,next:istBoundary(sidereal.sunRashi.nextTransitionUtc)},
    moonPada:{index:sidereal.moonPada.index,
      next:istBoundary(sidereal.moonPada.nextTransitionUtc)}
  };
  const pastBoundaries=Object.entries(source.table.events).map(([field,rows])=>{
    let low=0,high=rows.length;
    while(low<high){const mid=(low+high)>>>1;if(rows[mid][0]<=sunriseMs)low=mid+1;else high=mid;}
    const before=low>0?rows[low-1][0]:null;
    const after=low<rows.length?rows[low][0]:null;
    return {field,minDistanceMs:Math.min(before===null?Infinity:sunriseMs-before,
      after===null?Infinity:after-sunriseMs)};
  });
  const nearBoundary=pastBoundaries.filter(x=>x.minDistanceMs<=120_000)
    .map(x=>({family:x.field,minutesFromSunrise:x.minDistanceMs/60_000}));
  if(families.nakshatra.index!==Math.floor(families.moonPada.index/4)||
     families.nakshatra.pada!==families.moonPada.index%4+1)
    throw Error("Nakshatra/Pada disagreement within one JPL sidereal catalog");
  return {
    engine:STAGED_LUNAR_ENGINE_VERSION,schema:UNIFIED_V6_RESEARCH_SCHEMA,
    city:city.slug,latitude:city.lat,longitude:city.lng,date:dateIso,
    sunriseUtc:lunar.sunriseUtc,sunriseIst:lunar.sunriseIst,
    lunar:{tithi:lunar.tithi,paksha:lunar.paksha,tithiIndex:lunar.tithiIndex,
      tithiEnd:lunar.tithiEnd,tithiEndDate:lunar.tithiEndDate,
      karana:lunar.karana,karanaHalfIndex:lunar.karanaHalfIndex,
      karanaEnd:lunar.karanaEnd,karanaEndDate:lunar.karanaEndDate,
      previousNewMoonUtc:lunar.previousNewMoonUtc},
    sidereal:families,
    nearSunriseTransition:nearBoundary,
    sources:{lunarRootSha256:JPL_V6_ROOTS_ASSET_SHA256,
      siderealCatalogSha256:source.sourceDigest,
      lahiriAnchorsSha256:source.lahiriAnchorDigest,
      combinedIdentity:source.combinedIdentity,
      siderealSource:"JPL DE440s apparent geocentric Sun/Moon + Swiss Lahiri frame anchors"},
    sunriseConvention:"same Swiss upper-limb and atmosphere observer convention as public V5",
    unreconciled:{
      independentLahiriAyanamsa:true,ritualFastingAndParana:true,
      festivalAndMuhuratRules:true,monthSamvat:true,
      moonIllumination:true,yearAndCityWideReview:true
    },
    publicEngine:PUBLIC_LUNAR_ENGINE_VERSION,
    publicReleaseAllowed:false as const,
    researchOnly:true as const
  };
}
export function getV6UnifiedMonth(year:number,month:number,city:City,source:VerifiedV6SiderealSource){
  const key=unifiedV6ResearchKey(year,month,city,source);
  const days=new Date(Date.UTC(year,month,0)).getUTCDate();
  const dates=Array.from({length:days},(_,i)=>getV6UnifiedSunrise(
    year+"-"+pad(month)+"-"+pad(i+1),city,source));
  if(dates.some((row,index)=>row.date!==year+"-"+pad(month)+"-"+pad(index+1)||
     row.sources.combinedIdentity!==source.combinedIdentity))
    throw Error("Mixed-source V6 unified monthly research data");
  return {key,city:city.slug,year,month,dates,dayCount:days,
    // This is NOT a Muhurat ranking or a certified Vrat selection.
    ritualScoringAllowed:false as const,publicReleaseAllowed:false as const};
}
