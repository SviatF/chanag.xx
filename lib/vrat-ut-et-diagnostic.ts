/**
 * Wave 3U — independent UT/ET diagnostic, not production calendar logic.
 *
 * sweRiseTrans returns Julian UT. sweCalc expects Julian ET/TT; sweCalcUt
 * accepts Julian UT and applies the Swiss Ephemeris ΔT conversion internally.
 * Do not modify the published Panchang or Vrat dates until full build-data
 * regeneration and independently city-pinned source review is complete.
 */
import type {City} from "./cities";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalc,sweCalcUt,sweClose} from "@typescriptify/sweph/dist/sweph.js";
import {sweRiseTrans} from "@typescriptify/sweph/dist/swecl.js";
import {SE_SUN,SE_MOON,SEFLG_MOSEPH,SE_CALC_RISE} from "@typescriptify/sweph/dist/constants.js";
import {indiaCivilDayStartJulian,indiaLocalPartsFromJulian} from "./india-time";

type ClockMode="UT-correct"|"legacy-UT-as-ET";
const norm=(v:number)=>((v%360)+360)%360;
const DAY=/^\d{4}-\d{2}-\d{2}$/;
export type SunsetBoundaryAudit={
  city:string;date:string;sunriseIst:string;
  sunriseUtJd:number;
  utCorrectTithiIndex:number;legacyTithiIndex:number;
  sameTithiAtSunrise:boolean;
  utLastTransitionSecondsBeforeSunrise:number;
  utNextTransitionSecondsAfterSunrise:number;
  legacyLastTransitionSecondsBeforeSunrise:number;
  legacyNextTransitionSecondsAfterSunrise:number;
  nextTransitionClockDriftSeconds:number|null;
  closestUtBoundaryDistanceSeconds:number;
  withinFiveMinutesOfUtBoundary:boolean;
  localDateSelectionPotentiallyChanges:boolean;
  sunsetMode:"upper-limb-refraction-aware-sunrise-UT";
  safeToPatchProductionWithoutShardRebuild:false;
};
function validIsoDay(s:string){
  if(!DAY.test(s))return false;
  const date=Date.parse(s+"T00:00:00Z");
  return Number.isFinite(date)&&new Date(date).toISOString().slice(0,10)===s;
}
export function compareVratTimeScales(city:City,date:string):SunsetBoundaryAudit{
  if(!validIsoDay(date))throw Error("Invalid Gregorian day");
  const [year,month,day]=date.split("-").map(Number);
  const swed=createDefaultSweData();
  try{
    const base=indiaCivilDayStartJulian(year,month,day);
    const rise=sweRiseTrans(swed,base,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_RISE,
      [city.lng,city.lat,0],1013.25,25,null);
    if(rise.retval<0||!Number.isFinite(rise.tret))throw Error("Missing astronomical sunrise");
    const instant=indiaLocalPartsFromJulian(rise.tret);
    if(instant.date!==date)throw Error("Local sunrise is not on requested civil day");
    const tithiIndex=(jdUT:number,mode:ClockMode)=>{
      const calc=mode==="UT-correct"?sweCalcUt:sweCalc;
      const s=calc(swed,jdUT,SE_SUN,SEFLG_MOSEPH).xx[0];
      const m=calc(swed,jdUT,SE_MOON,SEFLG_MOSEPH).xx[0];
      if(!Number.isFinite(s)||!Number.isFinite(m))
        throw Error("Nonfinite Swiss Ephemeris longitude");
      return Math.floor(norm(m-s)/12);
    };
    const boundary=(direction:-1|1,mode:ClockMode)=>{
      const startIndex=tithiIndex(rise.tret,mode);
      const step=1/24;
      let a=rise.tret,b=rise.tret;
      let moved=false;
      for(let i=1;i<=48;i++){
        const candidate=rise.tret+direction*i*step;
        if(tithiIndex(candidate,mode)!==startIndex){
          if(direction===1){a=rise.tret+direction*(i-1)*step;b=candidate;}
          else {a=candidate;b=rise.tret+direction*(i-1)*step;}
          moved=true;break;
        }
      }
      if(!moved)throw Error("Tithi boundary not found inside 48h");
      // Use the first sample's index on LEFT, not the sunrise index: a
      // pre-sunrise bracket contains two indices in the opposite order.
      const leftIndex=tithiIndex(a,mode);
      for(let i=0;i<31;i++){
        const middle=(a+b)/2;
        if(tithiIndex(middle,mode)===leftIndex)a=middle;
        else b=middle;
      }
      return (a+b)/2;
    };
    const utIndex=tithiIndex(rise.tret,"UT-correct");
    const legacyIndex=tithiIndex(rise.tret,"legacy-UT-as-ET");
    const oldPrevious=boundary(-1,"legacy-UT-as-ET");
    const oldNext=boundary(1,"legacy-UT-as-ET");
    const correctPrevious=boundary(-1,"UT-correct");
    const correctNext=boundary(1,"UT-correct");
    const sec=(jd:number)=>(jd-rise.tret)*86400;
    const before=-sec(correctPrevious);
    const after=sec(correctNext);
    const closest=Math.min(before,after);
    const comparableNext=utIndex===legacyIndex;
    return {
      city:city.slug,date,sunriseIst:instant.time,sunriseUtJd:rise.tret,
      utCorrectTithiIndex:utIndex,legacyTithiIndex:legacyIndex,
      sameTithiAtSunrise:utIndex===legacyIndex,
      utLastTransitionSecondsBeforeSunrise:Math.round(before),
      utNextTransitionSecondsAfterSunrise:Math.round(after),
      legacyLastTransitionSecondsBeforeSunrise:Math.round(-sec(oldPrevious)),
      legacyNextTransitionSecondsAfterSunrise:Math.round(sec(oldNext)),
      nextTransitionClockDriftSeconds:comparableNext?
        Math.round((correctNext-oldNext)*86400):null,
      closestUtBoundaryDistanceSeconds:Math.round(closest),
      withinFiveMinutesOfUtBoundary:closest<=300,
      localDateSelectionPotentiallyChanges:utIndex!==legacyIndex,
      sunsetMode:"upper-limb-refraction-aware-sunrise-UT",
      safeToPatchProductionWithoutShardRebuild:false
    };
  }finally{sweClose(swed);}
}
