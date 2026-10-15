/**
 * Wave 3AM — one physically anchored JPL lunation for V6 lunar month/year
 * candidates. NEW MOONS come from the same SHA-pinned JPL DE440s 6° table as
 * sunrise Tithi/Karana. Solar *sidereal* longitude is STILL Swiss/Moshier
 * Lahiri (UT-aware). Therefore no complete JPL sidereal parity, named month,
 * Samvat, festival or ritual publication approval is implied by this module.
 */
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose,sweSetSidMode} from "@typescriptify/sweph/dist/sweph.js";
import {SE_SUN,SEFLG_MOSEPH,SEFLG_SIDEREAL,SE_SIDM_LAHIRI} from "@typescriptify/sweph/dist/constants.js";
import type {City} from "./cities";
import {getJplV6SunriseLunarCanary,type JplV6SunriseLunarCanary} from "./jpl-v6-crossfamily-canary";
import {getPinnedV6HalfTithiTable,JPL_V6_ROOTS_ASSET_SHA256} from "./jpl-v6-pinned-data";
import {jplHalfTithiAtMs,type JplHalfTithiTable} from "./jpl-v6-tithi-karana-canary";

const DAY=86400000;
const JD_UNIX=2440587.5;
const IST=330*60000;
const MONTH_BY_SUN_SIGN=[
  "Vaishakha","Jyeshtha","Ashadha","Shravana","Bhadrapada","Ashwin",
  "Kartika","Margashirsha","Pausha","Magha","Phalguna","Chaitra"
] as const;
const signIndex=(n:number)=>Math.floor((((n%360)+360)%360)/30);
const label=(month:string,adhika:boolean)=>adhika?month+" (Adhika)":month;
const civil=(ms:number)=>new Date(ms+IST).toISOString().slice(0,10);
const isoDate=(s:string)=> {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s+"T00:00:00Z"))||
     new Date(s+"T00:00:00Z").toISOString().slice(0,10)!==s)throw Error("Invalid JPL lunar civil date "+s);
  return s;
};
const nextCivil=(s:string)=>new Date(Date.parse(s+"T12:00:00Z")+DAY).toISOString().slice(0,10);
const rootCache=new WeakMap<JplHalfTithiTable,number[]>();
const solarSignCache=new Map<number,{sign:number;longitude:number}>();
function jd(ms:number){return JD_UNIX+ms/DAY;}
/** Select exact Amavasya→Shukla Pratipada roots, not an approximate synodic duration. */
export function jplNewMoonBoundaries(table:JplHalfTithiTable){
  const cached=rootCache.get(table);
  if(cached)return cached;
  const roots=table.halfTithiTransitions.filter(row=>row[1]===0).map(row=>row[0]);
  for(let i=1;i<roots.length;i++){
    const span=(roots[i]-roots[i-1])/DAY;
    if(!(span>28.5&&span<30.9))throw Error("Missing, duplicate or impossible JPL new moon event");
  }
  if(roots.length<70)throw Error("Incomplete JPL monthly root sequence");
  rootCache.set(table,roots);
  return roots;
}
export function jplLunationAtMs(table:JplHalfTithiTable,instant:number){
  const state=jplHalfTithiAtMs(table,instant);
  const roots=jplNewMoonBoundaries(table);
  let lo=0,hi=roots.length;
  while(lo<hi){const mid=(lo+hi)>>>1;if(roots[mid]<=instant)lo=mid+1;else hi=mid;}
  const i=lo-1;
  if(i<0||i+2>=roots.length)throw Error("JPL lunation full three-root coverage exhausted");
  const previous=roots[i],next=roots[i+1],following=roots[i+2];
  if(!(previous<=instant&&instant<next&&next<following))throw Error("JPL lunation chronological invariant");
  return {previous,next,following,
    paksha:state.tithiIndex<15?"Shukla" as const:"Krishna" as const,
    sourceSha256:JPL_V6_ROOTS_ASSET_SHA256,
    source:"JPL DE440s new moon root; half-phase index 0" as const};
}
function solarSignsAtRoots(ms:number[]){
  const missing=[...new Set(ms.filter(at=>!solarSignCache.has(at)))];
  if(missing.length){
    const swed=createDefaultSweData();
    sweSetSidMode(swed,SE_SIDM_LAHIRI,0,0);
    try{
      for(const at of missing){
        const lon=sweCalcUt(swed,jd(at),SE_SUN,SEFLG_MOSEPH|SEFLG_SIDEREAL).xx[0];
        if(!Number.isFinite(lon))throw Error("Swiss sidereal solar longitude unavailable at pinned JPL root");
        solarSignCache.set(at,{sign:signIndex(lon),longitude:((lon%360)+360)%360});
      }
    }finally{sweClose(swed);}
  }
  return ms.map(at=>{
    const result=solarSignCache.get(at);
    if(!result)throw Error("Sidereal solar-sign cache incomplete");
    return result;
  });
}
export function jplLunarMonthCandidate(lunar:JplV6SunriseLunarCanary,table:JplHalfTithiTable){
  const at=Date.parse(lunar.sunriseUtc);
  const moon=jplLunationAtMs(table,at);
  if(moon.paksha!==lunar.paksha||new Date(moon.previous).toISOString()!==lunar.previousNewMoonUtc)
    throw Error("Inconsistent JPL new moon/Tithi root identity "+lunar.city+" "+lunar.date);
  const [previous,next,following]=solarSignsAtRoots([moon.previous,moon.next,moon.following]);
  const amanta=MONTH_BY_SUN_SIGN[previous.sign];
  const amantaAdhika=previous.sign===next.sign;
  const purnimanta=moon.paksha==="Krishna"&&!amantaAdhika?MONTH_BY_SUN_SIGN[next.sign]:amanta;
  const purnimantaAdhika=moon.paksha==="Krishna"&&!amantaAdhika?
    next.sign===following.sign:amantaAdhika;
  return {
    city:lunar.city,date:lunar.date,paksha:lunar.paksha,
    previousNewMoonUtc:new Date(moon.previous).toISOString(),
    nextNewMoonUtc:new Date(moon.next).toISOString(),
    followingNewMoonUtc:new Date(moon.following).toISOString(),
    monthLabels:{
      amanta:label(amanta,amantaAdhika),
      purnimanta:label(purnimanta,purnimantaAdhika),
      amantaAdhika,purnimantaAdhika
    },
    sunSigns:{previous:previous.sign,next:next.sign,following:following.sign},
    sourceSha256:JPL_V6_ROOTS_ASSET_SHA256,
    lunarSource:"JPL DE440s exact 6° event stream" as const,
    siderealSource:"Swiss/Moshier Lahiri, sweCalcUt" as const,
    siderealEphemerisUnified:false as const,
    ritualOrPublicationApproved:false as const,
  };
}
export function jplLunarMonthCandidateForCity(dateIso:string,city:City){
  isoDate(dateIso);
  const table=getPinnedV6HalfTithiTable();
  const lunar=getJplV6SunriseLunarCanary(dateIso,city,table);
  return jplLunarMonthCandidate(lunar,table);
}
/** Chaitra and Gujarati new-year start candidates; no ritual certification. */
export function jplNewYearCandidate(year:number,city:City,kind:"chaitra"|"gujarati"){
  if(!Number.isInteger(year)||year<2026||year>2029)
    throw Error("JPL new-year candidate needs a complete root margin (2026–2029)");
  const table=getPinnedV6HalfTithiTable();
  const lo=Date.parse(year+(kind==="chaitra"?"-03-01":"-09-01")+"T00:00:00Z");
  const hi=Date.parse(year+(kind==="chaitra"?"-05-01":"-12-20")+"T00:00:00Z");
  const desired=kind==="chaitra"?11:6; // Meena / Tula solar signs
  const matches=jplNewMoonBoundaries(table).filter(ms=>ms>=lo&&ms<hi)
    .filter(ms=>solarSignsAtRoots([ms])[0].sign===desired);
  if(matches.length!==1)throw Error("Ambiguous JPL "+kind+" year root "+year+": "+matches.length);
  const newMoon=matches[0];
  const rootPos=table.halfTithiTransitions.findIndex(row=>row[0]===newMoon&&row[1]===0);
  if(rootPos<0||table.halfTithiTransitions[rootPos+2]?.[1]!==2)
    throw Error("JPL Shukla Pratipada end root missing");
  const end=table.halfTithiTransitions[rootPos+2][0];
  if(!(end>newMoon&&end-newMoon<2*DAY))throw Error("Invalid JPL Pratipada duration");
  const startCivil=civil(newMoon),secondCivil=nextCivil(startCivil);
  const firstSunrise=Date.parse(getJplV6SunriseLunarCanary(startCivil,city,table).sunriseUtc);
  const secondSunrise=Date.parse(getJplV6SunriseLunarCanary(secondCivil,city,table).sunriseUtc);
  const contains=(ms:number)=>ms>=newMoon&&ms<end;
  const effectiveStart=contains(firstSunrise)?startCivil:contains(secondSunrise)?secondCivil:startCivil;
  return {
    kind,year,city:city.slug,effectiveStart,
    newMoonUtc:new Date(newMoon).toISOString(),
    pratipadaEndUtc:new Date(end).toISOString(),
    sunriseSelected:contains(firstSunrise)||contains(secondSunrise),
    lunarSource:"JPL DE440s pinned root" as const,
    solarSiderealSource:"Swiss/Moshier Lahiri" as const,
    sourceSha256:JPL_V6_ROOTS_ASSET_SHA256,
    independentSiderealApproval:false as const,
    regionRitualApproval:false as const,
    productionReleaseAllowed:false as const,
  };
}
