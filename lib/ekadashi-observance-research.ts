/**
 * Wave 3Z - independent research-only arunodaya / Ekadashi / Dwadashi clocks.
 * Never import into public Vrat or Festival routes as a fasting-day selector.
 * The 96-minute arunodaya point is a documented convention, NOT a universal
 * sunset/sunrise definition and NOT sufficient to resolve Mahadvadashi.
 */
import type {City} from "./cities";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose,sweSetSidMode} from "@typescriptify/sweph/dist/sweph.js";
import {sweRiseTrans} from "@typescriptify/sweph/dist/swecl.js";
import {SE_SUN,SE_MOON,SEFLG_MOSEPH,SEFLG_SIDEREAL,SE_SIDM_LAHIRI,SE_CALC_RISE} from "@typescriptify/sweph/dist/constants.js";
import {addIsoDays,indiaCivilDayStartJulian,indiaLocalPartsFromJulian} from "./india-time";

export const ARUNODAYA_MINUTES_BEFORE_SUNRISE = 96 as const;
export const EKADASHI_METHOD_PROFILE = "research-arunodaya-96m-upper-limb-refraction-aware" as const;
type SwissState = ReturnType<typeof createDefaultSweData>;
type Time = {date:string;time:string};
const normalized = (angle:number)=>((angle%360)+360)%360;
const fixedDay = /^\d{4}-\d{2}-\d{2}$/;
const tithiAt = (swed:SwissState, jdUT:number)=>{
  const sun=sweCalcUt(swed,jdUT,SE_SUN,SEFLG_MOSEPH).xx[0];
  const moon=sweCalcUt(swed,jdUT,SE_MOON,SEFLG_MOSEPH).xx[0];
  if(!Number.isFinite(sun)||!Number.isFinite(moon))throw Error("Nonfinite UT Sun/Moon longitude");
  return Math.floor(normalized(moon-sun)/12);
};
const tithiName = (index:number)=>{
  const names=["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima"];
  const paksha=index<15?"Shukla":"Krishna";
  const tithi=index%15===14&&paksha==="Krishna"?"Amavasya":names[index%15];
  return paksha+" "+tithi;
};
const local = (jdUT:number):Time=>{
  const t=indiaLocalPartsFromJulian(jdUT);
  return {date:t.date,time:t.time};
};
const seconds=(jd:number,relativeTo:number)=>Math.round((jd-relativeTo)*86400);

/** Bracket the nearest actual astronomical Tithi boundary in either direction. */
function boundary(swed:SwissState,at:number,direction:-1|1){
  const initial=tithiAt(swed,at);
  let left=at,right=at;
  let found=false;
  for(let n=1;n<=48;n++){
    const probe=at+direction*n/24;
    if(tithiAt(swed,probe)!==initial){
      if(direction===-1){left=probe;right=at+direction*(n-1)/24;}
      else{left=at+direction*(n-1)/24;right=probe;}
      found=true;break;
    }
  }
  if(!found)throw Error("No Tithi transition within 48 hours");
  const leftIndex=tithiAt(swed,left);
  for(let n=0;n<33;n++){
    const mid=(left+right)/2;
    if(tithiAt(swed,mid)===leftIndex)left=mid;
    else right=mid;
  }
  return (left+right)/2;
}

export type EkadashiMethodDiagnostic={
  city:string;date:string;sunrise:Time;arunodaya:Time;followingSunrise:Time;
  sunriseTithiIndex:number;sunriseTithi:string;
  sunriseNakshatraIndex:number;followingSunriseNakshatraIndex:number;
  arunodayaTithiIndex:number;arunodayaTithi:string;
  followingSunriseTithiIndex:number;followingSunriseTithi:string;
  dashamiArunodayaScreen:"dashami-at-arunodaya"|"ekadashi-at-arunodaya"|"not-ekadashi-at-sunrise"|"other-arunodaya-state";
  sunriseAndArunodayaDisagree:boolean;
  repeatedEkadashiAtFollowingSunrise:boolean;
  closestSunriseBoundarySeconds:number;
  closestArunodayaBoundarySeconds:number;
  nearFiveMinuteAstronomicalBoundary:boolean;
  dwadashiNextSunrise:boolean;
  hariVasara: {dwadashiStart:Time;dwadashiEnd:Time;firstQuarterEnds:Time;researchEarliestPostSunriseAndQuarter:Time;validOrder:boolean}|null;
  conventionProfile:typeof EKADASHI_METHOD_PROFILE;
  chosenSmartaFastDate:null;chosenVaishnavaFastDate:null;chosenISKCONFastDate:null;
  independentlyCertifiedFast:false;paranaWindowCertified:false;
  mahadvadashiSubtypesReviewed:false;safeForCeremonyFiltering:false;
};

/** This is a mathematical screen, not a fasting-date selection algorithm. */
export function compareEkadashiArunodaya(city:City,date:string):EkadashiMethodDiagnostic{
  if(!fixedDay.test(date)||new Date(date+"T00:00:00Z").toISOString().slice(0,10)!==date)
    throw Error("Invalid ISO civil day");
  const [year,month,day]=date.split("-").map(Number);
  const swed=createDefaultSweData();
  try{
    sweSetSidMode(swed,SE_SIDM_LAHIRI,0,0);
    const nakshatraAt=(jd:number)=>{
      const longitude=sweCalcUt(swed,jd,SE_MOON,SEFLG_MOSEPH|SEFLG_SIDEREAL).xx[0];
      if(!Number.isFinite(longitude))throw Error("Nonfinite independent Lahiri Moon longitude");
      return Math.floor(normalized(longitude)/(360/27));
    };
    const sunriseFor=(start:number,expectedDate:string)=>{
      const rise=sweRiseTrans(swed,start,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_RISE,[city.lng,city.lat,0],1013.25,25,null);
      if(rise.retval<0||!Number.isFinite(rise.tret))throw Error("No astronomical sunrise: "+expectedDate);
      if(local(rise.tret).date!==expectedDate)throw Error("Sunrise has wrong local date: "+expectedDate);
      return rise.tret;
    };
    const sunrise=sunriseFor(indiaCivilDayStartJulian(year,month,day),date);
    const followingDate=addIsoDays(date,1);
    const [y2,m2,d2]=followingDate.split("-").map(Number);
    const following=sunriseFor(indiaCivilDayStartJulian(y2,m2,d2),followingDate);
    if(following<=sunrise||following-sunrise>1.2)throw Error("Invalid following sunrise sequence");
    const arunodaya=sunrise-ARUNODAYA_MINUTES_BEFORE_SUNRISE/1440;
    const atRise=tithiAt(swed,sunrise),atArunodaya=tithiAt(swed,arunodaya),atNext=tithiAt(swed,following);
    const ekadashi=atRise===10||atRise===25;
    const dashami=atArunodaya===9||atArunodaya===24;
    const dashamiArunodayaScreen:EkadashiMethodDiagnostic["dashamiArunodayaScreen"]=!ekadashi?
      "not-ekadashi-at-sunrise":dashami?"dashami-at-arunodaya":
      atArunodaya===atRise?"ekadashi-at-arunodaya":"other-arunodaya-state";
    const riseDistance=Math.min(seconds(sunrise,boundary(swed,sunrise,-1)),
      seconds(boundary(swed,sunrise,1),sunrise));
    const dawnDistance=Math.min(seconds(arunodaya,boundary(swed,arunodaya,-1)),
      seconds(boundary(swed,arunodaya,1),arunodaya));
    const dwadashiNextSunrise=atNext===11||atNext===26;
    let hariVasara:EkadashiMethodDiagnostic["hariVasara"]=null;
    if(dwadashiNextSunrise){
      const start=boundary(swed,following,-1);
      const end=boundary(swed,following,1);
      const firstQuarterEnds=start+(end-start)/4;
      const firstPossible=Math.max(following,firstQuarterEnds);
      hariVasara={
        dwadashiStart:local(start),dwadashiEnd:local(end),
        firstQuarterEnds:local(firstQuarterEnds),
        researchEarliestPostSunriseAndQuarter:local(firstPossible),
        validOrder:start<following&&following<end&&firstPossible<end
      };
    }
    return {
      city:city.slug,date,sunrise:local(sunrise),arunodaya:local(arunodaya),followingSunrise:local(following),
      sunriseTithiIndex:atRise,sunriseTithi:tithiName(atRise),
      sunriseNakshatraIndex:nakshatraAt(sunrise),followingSunriseNakshatraIndex:nakshatraAt(following),
      arunodayaTithiIndex:atArunodaya,arunodayaTithi:tithiName(atArunodaya),
      followingSunriseTithiIndex:atNext,followingSunriseTithi:tithiName(atNext),
      dashamiArunodayaScreen,sunriseAndArunodayaDisagree:atRise!==atArunodaya,
      repeatedEkadashiAtFollowingSunrise:ekadashi&&atRise===atNext,
      closestSunriseBoundarySeconds:riseDistance,closestArunodayaBoundarySeconds:dawnDistance,
      nearFiveMinuteAstronomicalBoundary:Math.min(riseDistance,dawnDistance)<=300,
      dwadashiNextSunrise,hariVasara,
      conventionProfile:EKADASHI_METHOD_PROFILE,
      chosenSmartaFastDate:null,chosenVaishnavaFastDate:null,chosenISKCONFastDate:null,
      independentlyCertifiedFast:false,paranaWindowCertified:false,
      mahadvadashiSubtypesReviewed:false,safeForCeremonyFiltering:false
    };
  }finally{sweClose(swed);}
}
