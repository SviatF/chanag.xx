/**
 * Wave 3AB: UT-second astronomical method differential, RESEARCH ONLY.
 *
 * Swiss Ephemeris documents that its default SE_CALC_RISE is apparent
 * upper-limb rise with atmospheric refraction. Hindu sunrise instead uses
 * the geometric center, no refraction, and geocentric/no ecliptic latitude.
 * Flags from Swiss Ephemeris swephexp.h:
 * SE_BIT_DISC_CENTER=256, SE_BIT_NO_REFRACTION=512,
 * SE_BIT_GEOCTR_NO_ECL_LAT=128. Same Swiss/Moshier Sun/Moon model in both
 * branches => this is NOT independent external ephemeris verification.
 *
 * Do NOT import this into production Panchang, Vrat, Muhurat or Puja filters.
 */
import type {City} from "./cities";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose} from "@typescriptify/sweph/dist/sweph.js";
import {sweRiseTrans} from "@typescriptify/sweph/dist/swecl.js";
import {SE_SUN,SE_MOON,SEFLG_MOSEPH,SE_CALC_RISE} from "@typescriptify/sweph/dist/constants.js";
import {indiaCivilDayStartJulian} from "./india-time";

export const SWISS_HINDU_RISE_MASK=SE_CALC_RISE|256|512|128;
export const DEFAULT_RISE_MASK=SE_CALC_RISE;
const IST_OFFSET_MS=330*60*1000;
const jdToMs=(jdUT:number)=>(jdUT-2440587.5)*86400000;
export function utInstant(jdUT:number){
  if(!Number.isFinite(jdUT))throw Error("Nonfinite Julian UT instant");
  return new Date(jdToMs(jdUT)).toISOString();
}
export function istInstant(jdUT:number){
  if(!Number.isFinite(jdUT))throw Error("Nonfinite Julian UT instant");
  return new Date(jdToMs(jdUT)+IST_OFFSET_MS).toISOString().replace("Z","+05:30");
}
const normalize=(angle:number)=>((angle%360)+360)%360;
const tithiName=(index:number)=>{
  const names=["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima"];
  const paksha=index<15?"Shukla":"Krishna";
  return paksha+" "+(index%15===14&&index>=15?"Amavasya":names[index%15]);
};
const validIso=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+"T00:00:00Z"))&&
  new Date(Date.parse(s+"T00:00:00Z")).toISOString().slice(0,10)===s;
const jdDiffSeconds=(later:number,earlier:number)=>Math.round((later-earlier)*86400);
type SweData=ReturnType<typeof createDefaultSweData>;
function indexAt(swed:SweData,jdUT:number){
  const sun=sweCalcUt(swed,jdUT,SE_SUN,SEFLG_MOSEPH).xx[0];
  const moon=sweCalcUt(swed,jdUT,SE_MOON,SEFLG_MOSEPH).xx[0];
  if(!Number.isFinite(sun)||!Number.isFinite(moon))throw Error("Nonfinite UT solar/lunar longitude");
  const result=Math.floor(normalize(moon-sun)/12);
  if(result<0||result>29)throw Error("Invalid Tithi index");
  return result;
}
/** Brackets the actual Tithi boundary with independent left/right samples. */
function previousTithiTransition(swed:SweData,instant:number){
  const at=indexAt(swed,instant);
  let before=instant;
  let after=instant;
  let found=false;
  for(let h=1;h<=48;h++){
    const probe=instant-h/24;
    if(indexAt(swed,probe)!==at){
      before=probe;
      after=instant-(h-1)/24;
      found=true;
      break;
    }
  }
  if(!found)throw Error("No past lunar boundary within 48 hours");
  const leftIndex=indexAt(swed,before);
  for(let n=0;n<36;n++){
    const mid=(before+after)/2;
    if(indexAt(swed,mid)===leftIndex)before=mid;
    else after=mid;
  }
  const instantBoundary=(before+after)/2;
  if(indexAt(swed,instantBoundary-1/86400)!==leftIndex||
    indexAt(swed,instantBoundary+1/86400)===leftIndex)
    throw Error("Transition root not bracketed to second");
  return instantBoundary;
}
function nextTithiTransition(swed:SweData,instant:number){
  const at=indexAt(swed,instant);
  let before=instant;
  let after=instant;
  let found=false;
  for(let h=1;h<=48;h++){
    const probe=instant+h/24;
    if(indexAt(swed,probe)!==at){
      before=instant+(h-1)/24;
      after=probe;
      found=true;break;
    }
  }
  if(!found)throw Error("No following lunar boundary within 48 hours");
  const leftIndex=indexAt(swed,before);
  for(let n=0;n<36;n++){
    const mid=(before+after)/2;
    if(indexAt(swed,mid)===leftIndex)before=mid;else after=mid;
  }
  return (before+after)/2;
}
type Clock={utc:string;ist:string;jdUT:number};
const clock=(jdUT:number):Clock=>({utc:utInstant(jdUT),ist:istInstant(jdUT),jdUT});
export type SunriseConventionCase={
  city:string;date:string;latitude:number;longitude:number;
  sourceModel:"Swiss Ephemeris · Moshier · UT";
  comparisonIsIndependentEphemeris:false;
  defaultApparentUpperLimb:{
    sunrise:Clock;tithiIndex:number;tithi:string;
    previousTithiEnds:Clock;secondsSincePreviousTithi:number;
    arunodaya96MinutesBeforeSunrise:Clock;arunodayaTithi:string;
  };
  hinduGeometricCenter:{
    sunrise:Clock;tithiIndex:number;tithi:string;
    previousTithiEnds:Clock;secondsSincePreviousTithi:number;
    arunodaya96MinutesBeforeSunrise:Clock;arunodayaTithi:string;
  };
  nearestTithiTransition:Clock;
  secondsHinduSunriseAfterApparent:number;
  sunriseTithiChangesByConvention:boolean;
  arunodayaTithiChangesByConvention:boolean;
  fiveMinuteSolarConventionMayAffectTithi:boolean;
  externalExactSecondProofAvailable:false;
  certifiedCorrectTraditionSunrise:null;
  certifiedFastingDate:null;certifiedParana:null;
  safeToSwitchProductionConvention:false;
};
export function compareSunriseConventions(city:City,date:string):SunriseConventionCase{
  if(!validIso(date))throw Error("Invalid Gregorian civil day");
  const [year,month,day]=date.split("-").map(Number);
  const base=indiaCivilDayStartJulian(year,month,day);
  const swed=createDefaultSweData();
  try{
    const rise=(rsmi:number)=>{
      const r=sweRiseTrans(swed,base,SE_SUN,null,SEFLG_MOSEPH,rsmi,[city.lng,city.lat,0],1013.25,25,null);
      if(r.retval<0||!Number.isFinite(r.tret)||istInstant(r.tret).slice(0,10)!==date)
        throw Error("Missing or wrong-date sunrise for "+city.slug+" "+date);
      return r.tret;
    };
    const apparent=rise(DEFAULT_RISE_MASK);
    const hindu=rise(SWISS_HINDU_RISE_MASK);
    const observed=(jdUT:number)=>{
      const tithiIndex=indexAt(swed,jdUT);
      const previous=previousTithiTransition(swed,jdUT);
      const arunodaya=jdUT-96/1440;
      return {
        sunrise:clock(jdUT),tithiIndex,tithi:tithiName(tithiIndex),
        previousTithiEnds:clock(previous),
        secondsSincePreviousTithi:jdDiffSeconds(jdUT,previous),
        arunodaya96MinutesBeforeSunrise:clock(arunodaya),
        arunodayaTithi:tithiName(indexAt(swed,arunodaya))
      };
    };
    const a=observed(apparent),h=observed(hindu);
    const next=nextTithiTransition(swed,apparent);
    const boundary=(Math.abs(apparent-a.previousTithiEnds.jdUT)<
      Math.abs(next-apparent))?a.previousTithiEnds.jdUT:next;
    return {
      city:city.slug,date,latitude:city.lat,longitude:city.lng,
      sourceModel:"Swiss Ephemeris · Moshier · UT",comparisonIsIndependentEphemeris:false,
      defaultApparentUpperLimb:a,hinduGeometricCenter:h,
      nearestTithiTransition:clock(boundary),
      secondsHinduSunriseAfterApparent:jdDiffSeconds(hindu,apparent),
      sunriseTithiChangesByConvention:a.tithiIndex!==h.tithiIndex,
      arunodayaTithiChangesByConvention:a.arunodayaTithi!==h.arunodayaTithi,
      fiveMinuteSolarConventionMayAffectTithi:Math.min(Math.abs(apparent-boundary),Math.abs(hindu-boundary))*86400<=300,
      externalExactSecondProofAvailable:false,certifiedCorrectTraditionSunrise:null,
      certifiedFastingDate:null,certifiedParana:null,safeToSwitchProductionConvention:false
    };
  }finally{sweClose(swed);}
}
