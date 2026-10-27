/**
 * Research-only, independently authored astronomical parana geometry.
 * Do NOT import in public pages or the ritual date selector.
 *
 * This uses Swiss Ephemeris/Moshier, as PANCHVANI's other astronomical code does:
 * independent calculation logic from GCal, NOT a second independent ephemeris.
 * It cannot independently decide all Mahadvadasi or tradition-specific Vedha.
 */
import type {City} from "./cities";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose,sweSetSidMode} from "@typescriptify/sweph/dist/sweph.js";
import {sweRiseTrans} from "@typescriptify/sweph/dist/swecl.js";
import {SE_SUN,SE_MOON,SEFLG_MOSEPH,SEFLG_SIDEREAL,SE_SIDM_LAHIRI,SE_CALC_RISE,SE_CALC_SET} from "@typescriptify/sweph/dist/constants.js";
import {indiaCivilDayStartJulian,indiaLocalPartsFromJulian,addIsoDays} from "./india-time";

const TWO_HOURS=2/24,ONE_MIN=1/1440,DAY=1;
const norm=(n:number)=>((n%360)+360)%360;
const pad=(n:number)=>String(n).padStart(2,"0");
const REG=/^\d{4}-\d{2}-\d{2}$/;
type SwissState=ReturnType<typeof createDefaultSweData>;
type Clock={date:string;time:string;totalMinutes:number};
const local=(jd:number):Clock=>{
 const x=indiaLocalPartsFromJulian(jd);
 return {date:x.date,time:x.time,totalMinutes:x.minutes};
};
const validDate=(date:string)=>REG.test(date)&&!Number.isNaN(Date.parse(date+"T00:00:00Z"))&&new Date(date+"T00:00:00Z").toISOString().slice(0,10)===date;
function tithiIndex(s:SwissState,jd:number){
 const moon=sweCalcUt(s,jd,SE_MOON,SEFLG_MOSEPH).xx[0];
 const sun=sweCalcUt(s,jd,SE_SUN,SEFLG_MOSEPH).xx[0];
 if(!Number.isFinite(moon)||!Number.isFinite(sun))throw Error("Nonfinite ecliptic longitude");
 return Math.floor(norm(moon-sun)/12);
}
function nextTransition(s:SwissState,at:number,dir:-1|1,fn:(s:SwissState,jd:number)=>number){
 const origin=fn(s,at);let a=at,b=at,found=false;
 for(let i=1;i<=48;i++){
  const probe=at+dir*i*TWO_HOURS;
  if(fn(s,probe)!==origin){a=at+dir*(i-1)*TWO_HOURS;b=probe;found=true;break;}
 }
 if(!found)throw Error("Astronomical transition missing within 96 hours");
 let lo=Math.min(a,b),hi=Math.max(a,b);
 const initial=fn(s,lo);
 for(let j=0;j<26;j++){
  const mid=(lo+hi)/2;
  if(fn(s,mid)===initial)lo=mid;
  else hi=mid;
 }
 return (lo+hi)/2;
}
const prev=(s:SwissState,jd:number,fn:(s:SwissState,jd:number)=>number)=>nextTransition(s,jd,-1,fn);
const next=(s:SwissState,jd:number,fn:(s:SwissState,jd:number)=>number)=>nextTransition(s,jd,1,fn);
function solar(s:SwissState,city:City,day:string,mode:number){
 const [y,m,d]=day.split("-").map(Number);
 const st=indiaCivilDayStartJulian(y,m,d);
 const r=sweRiseTrans(s,st,SE_SUN,null,SEFLG_MOSEPH,mode,[city.lng,city.lat,0],1013.25,25,null);
 if(r.retval<0||!Number.isFinite(r.tret)||local(r.tret).date!==day)
  throw Error("Independent solar event failed for "+city.slug+"/"+day+" mode="+mode);
 return r.tret;
}
export type IndependentParanaGeometry={
 city:string;fastDate:string;paranaDate:string;
 sunrise:Clock;sunset:Clock;daylightThird:Clock;
 arunodayaFastDay:Clock;fastSunriseTithiIndex:number;fastArunodayaTithiIndex:number;
 followingSunriseTithiIndex:number;
 observedType:"fast-ekadashi-sunrise"|"fast-dvadashi-sunrise"|"other-tithi-fast";
 possibleDashamiVedha:boolean;
 duplicatedEkadashiAtSunrise:boolean;
 trispashaAstronomicalCandidate:boolean;
 dwadashiAtParanaSunrise:boolean;dwadashiEndedBeforeParanaSunrise:boolean;
 dwadashiWindow:{start:Clock;end:Clock;firstQuarterEnds:Clock}|null;
 nakshatraNextEnd:Clock|null;
 sourceRuleEligible:false;mahadwadasiSubtypeCertified:false;
 paranaWindowCertified:false;safeForPublication:false;
 boundaryCandidates:{start:{sunrise:Clock;quarter:Clock|null};end:{daylightThird:Clock;tithiEnd:Clock|null;nakshatraEnd:Clock|null}};
};
export function isEkadashiDvadashiNativeFast(row:{sunriseTithi:string}){
 return /^(?:Ekadasi|Dvadasi)\b/i.test(row.sunriseTithi);
}
export function parseGcalNativeDate(label:string){
 const x=/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (20\d{2})$/.exec(label);
 if(!x)throw Error("Unrecognized GCal date "+label);
 const i=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(x[2])+1;
 const date=x[3]+"-"+pad(i)+"-"+pad(Number(x[1]));
 if(!validDate(date))throw Error("Invalid GCal calendar date");
 return date;
}
export function candidateDifference(source:string|null,candidate:string|null){
 if(!source||!candidate||!/^([01]\d|2[0-3]):[0-5]\d$/.test(source))return null;
 const [sh,sm]=source.split(":").map(Number),[ch,cm]=candidate.split(":").map(Number);
 return sh*60+sm-ch*60-cm;
}
export function boundaryAlignment(source:string|null,candidates:Record<string,string|null>,toleranceMinutes=5){
 if(!source||!/^([01]\d|2[0-3]):[0-5]\d$/.test(source))return {best:null,deltaMinutes:null,withinTolerance:false};
 const ranked=Object.entries(candidates)
   .map(([name,time])=>({name,diff:candidateDifference(source,time)}))
   .filter((x):x is {name:string;diff:number}=>x.diff!==null)
   .sort((a,b)=>Math.abs(a.diff)-Math.abs(b.diff));
 const best=ranked[0];
 return {best:best?.name??null,deltaMinutes:best?.diff??null,withinTolerance:!!best&&Math.abs(best.diff)<=toleranceMinutes};
}
export function calculateIndependentParanaGeometry(city:City,fastDate:string,paranaDate:string):IndependentParanaGeometry{
 if(!validDate(fastDate)||!validDate(paranaDate)||addIsoDays(fastDate,1)!==paranaDate)
  throw Error("Parana geometry requires exact following civil day");
 const s=createDefaultSweData();
 try{
  const fastSunrise=solar(s,city,fastDate,SE_CALC_RISE);
  const rise=solar(s,city,paranaDate,SE_CALC_RISE);
  const set=solar(s,city,paranaDate,SE_CALC_SET);
  if(!(fastSunrise<rise&&rise<set&&set-rise>8/24&&set-rise<16/24))
    throw Error("Invalid solar daylight geometry "+city.slug+"/"+paranaDate);
  const index=tithiIndex(s,rise),fastIndex=tithiIndex(s,fastSunrise),fastDawnIndex=tithiIndex(s,fastSunrise-96/1440);
  const tithiName=index%15;
  let dwadashiStart:number|null=null,dwadashiEnd:number|null=null;
  if(tithiName===11){dwadashiStart=prev(s,rise,tithiIndex);dwadashiEnd=next(s,rise,tithiIndex);}
  else if(tithiName===12){dwadashiEnd=prev(s,rise,tithiIndex);dwadashiStart=prev(s,dwadashiEnd-ONE_MIN,tithiIndex);}
  else if(tithiName===10){dwadashiStart=next(s,rise,tithiIndex);dwadashiEnd=next(s,dwadashiStart+ONE_MIN,tithiIndex);}
  if(dwadashiStart!==null&&dwadashiEnd!==null&&!(dwadashiStart<dwadashiEnd))
   throw Error("Non-monotone Dvadashi phase");
  const quarter=dwadashiStart!==null&&dwadashiEnd!==null?dwadashiStart+(dwadashiEnd-dwadashiStart)/4:null;
  const third=rise+(set-rise)/3;
  // Calculate moon's next sidereal nakshatra transition; not an automatic
  // licence to use that transition as the end of ritual Parana.
  sweSetSidMode(s,SE_SIDM_LAHIRI,0,0);
  function nakshatraIndex(s:SwissState,jd:number){
    const m=sweCalcUt(s,jd,SE_MOON,SEFLG_MOSEPH|SEFLG_SIDEREAL).xx[0];
    if(!Number.isFinite(m))throw Error("Nonfinite sidereal Moon longitude");
    return Math.floor(norm(m)/(360/27));
  }
  const nakshatraEnd=next(s,rise,nakshatraIndex);
  const result:IndependentParanaGeometry={
   city:city.slug,fastDate,paranaDate,
   sunrise:local(rise),sunset:local(set),daylightThird:local(third),
   arunodayaFastDay:local(fastSunrise-96/1440),
   fastSunriseTithiIndex:fastIndex,fastArunodayaTithiIndex:fastDawnIndex,
   followingSunriseTithiIndex:index,
   observedType:fastIndex%15===10?"fast-ekadashi-sunrise":fastIndex%15===11?"fast-dvadashi-sunrise":"other-tithi-fast",
   possibleDashamiVedha:fastIndex%15===10&&fastDawnIndex%15===9,
   duplicatedEkadashiAtSunrise:fastIndex%15===10&&index%15===10,
   trispashaAstronomicalCandidate:fastIndex%15===10&&index%15===12,
   dwadashiAtParanaSunrise:index%15===11,
   dwadashiEndedBeforeParanaSunrise:index%15===12,
   dwadashiWindow:quarter!==null?{start:local(dwadashiStart!),end:local(dwadashiEnd!),firstQuarterEnds:local(quarter)}:null,
   nakshatraNextEnd:local(nakshatraEnd),
   sourceRuleEligible:false,mahadwadasiSubtypeCertified:false,paranaWindowCertified:false,safeForPublication:false,
   boundaryCandidates:{
     start:{sunrise:local(rise),quarter:quarter!==null?local(quarter):null},
     end:{daylightThird:local(third),tithiEnd:dwadashiEnd!==null?local(dwadashiEnd):null,nakshatraEnd:local(nakshatraEnd)}
   }
  };
  return result;
 }finally{sweClose(s);}
}
