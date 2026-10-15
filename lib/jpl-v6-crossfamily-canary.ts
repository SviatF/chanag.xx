/**
 * Wave 3AG: read-only side-by-side V6 astronomy for the three principal
 * consumers of PANCHVANI lunar phase: Daily, annual Vrat and Muhurat.
 *
 * No live route, source definition, cached Muhurat shard, or festival
 * selector imports this module. It deliberately exposes unresolved sidereal
 * month/Nakshatra/Yoga/fast/Parana dependencies before a future promotion.
 *
 * Every V6 Tithi and Karana value comes from the SAME authenticated 6°
 * geocentric JPL DE440s event stream. Actual sunrise uses the published
 * V5 upper-limb Swiss observer convention for 1013.25 hPa and 25°C to
 * isolate lunar ephemeris differences from atmospheric rise differences.
 */
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweClose} from "@typescriptify/sweph/dist/sweph.js";
import {sweRiseTrans} from "@typescriptify/sweph/dist/swecl.js";
import {SE_SUN,SEFLG_MOSEPH,SE_CALC_RISE} from "@typescriptify/sweph/dist/constants.js";
import type {City} from "./cities";
import {requireSolarEvent} from "./ephemeris-integrity";
import {indiaCivilDayStartJulian,indiaLocalPartsFromJulian} from "./india-time";
import {getPanchang} from "./panchang";
import {calculateVratCalendar,vratSlugs,type VratSlug} from "./vrat";
import {getMuhuratPanchangMonth} from "./muhurat";
import {getPrecomputedMuhuratPanchangMonth} from "./muhurat-precomputed";
import {jplHalfTithiAtMs,type JplHalfTithiTable} from "./jpl-v6-tithi-karana-canary";

const UNIX_JD=2440587.5;
const MS_DAY=86400000;
const IST_MS=330*60000;
const tithiNames=["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima"] as const;
const karanaCycle=["Bava","Balava","Kaulava","Taitila","Garaja","Vanija","Vishti"] as const;
const pad=(n:number)=>String(n).padStart(2,"0");
const fmtCivil=(date:Date)=>date.getUTCFullYear()+"-"+pad(date.getUTCMonth()+1)+"-"+pad(date.getUTCDate());
const asDate=(ms:number)=>new Date(ms+IST_MS).toISOString().slice(0,10);
function istClock(utcMs:number){
  const local=new Date(utcMs+IST_MS);
  return {time:local.toISOString().slice(11,16),date:local.toISOString().slice(0,10)};
}
function tithiName(i:number){
  if(i===14)return "Purnima";
  if(i===29)return "Amavasya";
  return tithiNames[i%15];
}
function karanaName(i:number){
  if(i===0)return "Kimstughna";
  if(i===57)return "Shakuni";
  if(i===58)return "Chatushpada";
  if(i===59)return "Naga";
  return karanaCycle[(i-1)%7];
}
function gregorianDate(value:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||
    !Number.isFinite(Date.parse(value+"T00:00:00Z"))||
    new Date(value+"T00:00:00Z").toISOString().slice(0,10)!==value)
    throw Error("Invalid India civil date "+value);
  return value;
}
export type JplV6SunriseLunarCanary={
  date:string;city:string;
  observer:{lat:number;lng:number;altitudeMeters:0};
  sunriseUtc:string;sunriseIst:string;
  source:"JPL DE440s · geocentric apparent phase (6°)";
  tithi:string;paksha:"Shukla"|"Krishna";
  tithiIndex:number;tithiEnd:string;tithiEndDate:string;
  karana:string;karanaHalfIndex:number;
  karanaEnd:string;karanaEndDate:string;
  previousNewMoonUtc:string;
  sameSwissObserverSunrise:true;
  siderealMonthVerified:false;
  nakshatraYogaReconciled:false;
  ritualFastingCertified:false;
  paranaCertified:false;
  auspiciousDateCertified:false;
  productionChangeAllowed:false;
};
function fromSunriseJd(city:City,date:string,sunriseJd:number,table:JplHalfTithiTable):JplV6SunriseLunarCanary{
  const jdMs=Math.round((sunriseJd-UNIX_JD)*MS_DAY);
  const event=jplHalfTithiAtMs(table,jdMs);
  const endT=istClock(Date.parse(event.nextTithiBoundaryUtc));
  const endK=istClock(Date.parse(event.nextKaranaBoundaryUtc));
  const paksha=event.tithiIndex<15?"Shukla":"Krishna";
  const i=event.halfPhaseIndex;
  // The beginning of Shukla Pratipada is precisely the end of the previous
  // Amavasya. It is the first 6° root with "after index" 0, not an
  // assumed 29.5-day offset and not necessarily the last complete Tithi.
  const rows=table.halfTithiTransitions;
  let lo=0,hi=rows.length;
  while(lo<hi){const mid=(lo+hi)>>>1;if(rows[mid][0]<=jdMs)lo=mid+1;else hi=mid;}
  let previousNewMoonIndex=lo-1;
  while(previousNewMoonIndex>=0&&rows[previousNewMoonIndex][1]!==0)previousNewMoonIndex--;
  if(previousNewMoonIndex<0)
    throw Error("JPL V6 previous new moon unavailable for "+city.slug+" "+date);
  const previousNewMoon=rows[previousNewMoonIndex][0];
  if(jdMs-previousNewMoon>33*MS_DAY)
    throw Error("JPL V6 previous new moon outside physical synodic month");
  return {
    date,city:city.slug,observer:{lat:city.lat,lng:city.lng,altitudeMeters:0},
    sunriseUtc:new Date(jdMs).toISOString(),
    sunriseIst:new Date(jdMs+IST_MS).toISOString().replace("Z","+05:30"),
    source:"JPL DE440s · geocentric apparent phase (6°)",
    tithi:tithiName(event.tithiIndex),paksha,tithiIndex:event.tithiIndex,
    tithiEnd:endT.time,tithiEndDate:endT.date,
    karana:karanaName(i),karanaHalfIndex:i,
    karanaEnd:endK.time,karanaEndDate:endK.date,
    previousNewMoonUtc:new Date(previousNewMoon).toISOString(),
    sameSwissObserverSunrise:true,
    siderealMonthVerified:false,nakshatraYogaReconciled:false,
    ritualFastingCertified:false,paranaCertified:false,auspiciousDateCertified:false,
    productionChangeAllowed:false
  };
}
export function getJplV6SunriseLunarCanary(
  dateIso:string,city:City,table:JplHalfTithiTable
):JplV6SunriseLunarCanary{
  gregorianDate(dateIso);
  const [year,month,day]=dateIso.split("-").map(Number);
  const swed=createDefaultSweData();
  try{
    const rise=sweRiseTrans(swed,indiaCivilDayStartJulian(year,month,day),
      SE_SUN,null,SEFLG_MOSEPH,SE_CALC_RISE,
      [city.lng,city.lat,0],1013.25,25,null);
    const riseJd=requireSolarEvent(rise,city.slug,dateIso,"sunrise");
    return fromSunriseJd(city,dateIso,riseJd,table);
  }finally{sweClose(swed);}
}
export async function compareDailyPanchangV6Canary(
  dateIso:string,city:City,table:JplHalfTithiTable
){
  gregorianDate(dateIso);
  const v5=await getPanchang(new Date(dateIso+"T12:00:00Z"),city);
  const v6=getJplV6SunriseLunarCanary(dateIso,city,table);
  if(v5.date!==v6.date)throw Error("Cross-family V5/V6 civil date mismatch");
  return {
    date:dateIso,city:city.slug,
    v5:{engine:v5.engine,tithi:v5.paksha+" "+v5.tithi,tithiEnd:v5.tithiEnd,
      tithiEndDate:v5.tithiEndDate,karana:v5.karana,
      karanaEnd:v5.karanaEnd,karanaEndDate:v5.karanaEndDate,
      sunrise:v5.sunrise,hinduMonth:v5.hinduMonth,nakshatra:v5.nakshatra,
      yoga:v5.yoga},
    v6,
    differences:{
      tithi:v5.paksha+" "+v5.tithi!==v6.paksha+" "+v6.tithi,
      tithiEnd:v5.tithiEnd!==v6.tithiEnd||v5.tithiEndDate!==v6.tithiEndDate,
      karana:v5.karana!==v6.karana,
      karanaEnd:v5.karanaEnd!==v6.karanaEnd||v5.karanaEndDate!==v6.karanaEndDate
    },
    allLunarConsumersPromoted:false,ritualsApproved:false
  };
}
export function compareYearlyVratV6Canary(
  year:number,city:City,table:JplHalfTithiTable
){
  if(!Number.isInteger(year)||year<2025||year>2030)throw Error("V6 Vrat year unsupported");
  const v5=Object.fromEntries(vratSlugs.map(slug=>[slug,calculateVratCalendar(slug,year,city)])) as Record<VratSlug,ReturnType<typeof calculateVratCalendar>>;
  const v6:Record<VratSlug,string[]>={ekadashi:[],purnima:[],amavasya:[]};
  for(let t=Date.UTC(year,0,1);t<Date.UTC(year+1,0,1);t+=MS_DAY){
    const date=fmtCivil(new Date(t));
    const value=getJplV6SunriseLunarCanary(date,city,table);
    if(value.tithi==="Ekadashi")v6.ekadashi.push(date);
    if(value.tithi==="Purnima")v6.purnima.push(date);
    if(value.tithi==="Amavasya")v6.amavasya.push(date);
  }
  return {
    year,city:city.slug,definition:"sunrise lunar Tithi only, NOT Smarta/ISKCON fasting",
    families:vratSlugs.map((slug:VratSlug)=>{
      const old=new Set(v5[slug].map(r=>r.date));
      const updated=new Set(v6[slug]);
      return {
        slug,v5Total:old.size,v6Total:updated.size,
        v5Only:[...old].filter(date=>!updated.has(date)),
        v6Only:[...updated].filter(date=>!old.has(date)),
        overlaps:[...updated].filter(date=>old.has(date)).length,
        traditionFastCertified:false,paranaCertified:false
      };
    }),
    calendarSwitchAllowed:false
  };
}
export async function compareMuhuratMonthV6Canary(
  year:number,month:number,city:City,table:JplHalfTithiTable
){
  if(!Number.isInteger(year)||!Number.isInteger(month)||
     year<2025||year>2030||month<1||month>12)
    throw Error("Invalid research Muhurat month");
  const v5=await getMuhuratPanchangMonth(year,month,city);
  const committed=await getPrecomputedMuhuratPanchangMonth(year,month,city);
  const rows=v5.map(day=>{
    const jpl=getJplV6SunriseLunarCanary(day.date,city,table);
    const snapshot=committed?.find(row=>row.date===day.date)??null;
    if(snapshot&&snapshot.tithi!==day.tithi)
      throw Error("Committed V5 snapshot Tithi inconsistent "+city.slug+" "+day.date);
    return {
      date:day.date,v5:{tithi:day.tithi,karana:day.karana,
        tithiEnd:day.tithiEnd,karanaEnd:day.karanaEnd},
      v6:{tithi:jpl.tithi,karana:jpl.karana,
        tithiEnd:jpl.tithiEnd,karanaEnd:jpl.karanaEnd,
        previousNewMoonUtc:jpl.previousNewMoonUtc},
      committedSnapshotPresent:Boolean(snapshot),
      tithiChanged:day.tithi!==jpl.tithi,
      karanaChanged:day.karana!==jpl.karana,
      tithiEndChanged:day.tithiEnd!==jpl.tithiEnd||
        day.tithiEndDate!==jpl.tithiEndDate,
      karanaEndChanged:day.karanaEnd!==jpl.karanaEnd||
        day.karanaEndDate!==jpl.karanaEndDate,
      muhuratScoreApproved:false
    };
  });
  return {
    city:city.slug,year,month,days:rows.length,
    committedSnapshotPresent:committed!==null,
    tithiChanged:rows.filter(r=>r.tithiChanged).length,
    karanaChanged:rows.filter(r=>r.karanaChanged).length,
    tithiEndChanged:rows.filter(r=>r.tithiEndChanged).length,
    karanaEndChanged:rows.filter(r=>r.karanaEndChanged).length,
    details:rows.filter(r=>r.tithiChanged||r.karanaChanged||r.tithiEndChanged||r.karanaEndChanged),
    scoreOrWeddingValidityApproved:false,canaryOnly:true
  };
}
