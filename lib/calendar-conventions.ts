import type {City} from "./cities";
import type {Panchang} from "./panchang";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalc,sweClose,sweSetSidMode} from "@typescriptify/sweph/dist/sweph.js";
import {sweRiseTrans} from "@typescriptify/sweph/dist/swecl.js";
import {
  SE_SUN,
  SE_MOON,
  SEFLG_MOSEPH,
  SEFLG_SIDEREAL,
  SE_SIDM_LAHIRI,
  SE_CALC_RISE,
  SE_CALC_SET,
} from "@typescriptify/sweph/dist/constants.js";
import {
  addIsoDays,
  indiaCivilDayStartJulian,
  indiaLocalPartsFromJulian,
  isoDateParts,
} from "./india-time";

const rashis=["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula","Vrishchika","Dhanu","Makara","Kumbha","Meena"] as const;
const amantaMonthByPreviousNewMoonSunSign=["Vaishakha","Jyeshtha","Ashadha","Shravana","Bhadrapada","Ashwin","Kartika","Margashirsha","Pausha","Magha","Phalguna","Chaitra"] as const;
const lunarMonths=["Chaitra","Vaishakha","Jyeshtha","Ashadha","Shravana","Bhadrapada","Ashwin","Kartika","Margashirsha","Pausha","Magha","Phalguna"] as const;
const gujaratiYearStartCache=new Map<string,string>();

const norm=(value:number)=>((value%360)+360)%360;
const signIndex=(longitude:number)=>Math.floor(norm(longitude)/30)%12;
const label=(month:string,adhika:boolean)=>adhika?`${month} (Adhika)`:month;

export type LunarMonthConventions={
  amantaMonth:string;
  amantaIsAdhika:boolean;
  amantaLabel:string;
  purnimantaMonth:string;
  purnimantaIsAdhika:boolean;
  purnimantaLabel:string;
};

export type SolarIngress={
  date:string;
  time:string;
  from:string;
  to:string;
};

export type RegionalCalendarConventions={
  solarIngress:SolarIngress|null;
  bengaliSolarRashi:string;
  tamilSolarRashi:string;
  malayalamSolarRashi:string;
  gujaratiSamvat:number;
  gujaratiSamvatYearStart:string;
};

function stateFactory(swed:ReturnType<typeof createDefaultSweData>){
  return (jd:number)=>{
    const sun=sweCalc(swed,jd,SE_SUN,SEFLG_MOSEPH|SEFLG_SIDEREAL).xx[0];
    const tropicalSun=sweCalc(swed,jd,SE_SUN,SEFLG_MOSEPH).xx[0];
    const tropicalMoon=sweCalc(swed,jd,SE_MOON,SEFLG_MOSEPH).xx[0];
    return {
      sunSidereal:norm(sun),
      solarSignIndex:signIndex(sun),
      tithiIndex:Math.floor(norm(tropicalMoon-tropicalSun)/12),
    };
  };
}

function sunriseForIso(swed:ReturnType<typeof createDefaultSweData>,city:City,iso:string){
  const parts=isoDateParts(iso);
  const start=indiaCivilDayStartJulian(parts.year,parts.month,parts.day);
  const rise=sweRiseTrans(swed,start,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_RISE,[city.lng,city.lat,0],1013.25,25,null);
  return rise.retval>=0?rise.tret:null;
}

function findPreviousNewMoon(startJd:number,stateAt:ReturnType<typeof stateFactory>){
  let current=startJd;
  let currentIndex=stateAt(current).tithiIndex;
  for(let i=0;i<150;i++){
    const previous=current-0.25;
    const previousIndex=stateAt(previous).tithiIndex;
    if(previousIndex>currentIndex){
      let low=previous,high=current;
      for(let j=0;j<34;j++){
        const mid=(low+high)/2;
        if(stateAt(mid).tithiIndex>15)low=mid;else high=mid;
      }
      return high;
    }
    current=previous;
    currentIndex=previousIndex;
  }
  throw new Error("Unable to resolve previous new moon");
}

function findNextNewMoon(startJd:number,stateAt:ReturnType<typeof stateFactory>){
  let previousJd=startJd+0.5;
  let previousIndex=stateAt(previousJd).tithiIndex;
  for(let i=1;i<=150;i++){
    const currentJd=startJd+0.5+i*0.25;
    const currentIndex=stateAt(currentJd).tithiIndex;
    if(previousIndex===29&&currentIndex===0){
      let low=previousJd,high=currentJd;
      for(let j=0;j<34;j++){
        const mid=(low+high)/2;
        if(stateAt(mid).tithiIndex===29)low=mid;else high=mid;
      }
      return high;
    }
    previousJd=currentJd;
    previousIndex=currentIndex;
  }
  throw new Error("Unable to resolve next new moon");
}

export function getLunarMonthConventions(date:Date,city:City,data:Panchang):LunarMonthConventions{
  const swed=createDefaultSweData();
  sweSetSidMode(swed,SE_SIDM_LAHIRI,0,0);
  try{
    const parts=isoDateParts(data.date);
    const baseJd=indiaCivilDayStartJulian(parts.year,parts.month,parts.day);
    const rise=sweRiseTrans(swed,baseJd,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_RISE,[city.lng,city.lat,0],1013.25,25,null);
    const sunriseJd=rise.retval>=0?rise.tret:baseJd+0.25;
    const stateAt=stateFactory(swed);
    const previousNewMoon=findPreviousNewMoon(sunriseJd,stateAt);
    const nextNewMoon=findNextNewMoon(previousNewMoon,stateAt);
    const nextNextNewMoon=findNextNewMoon(nextNewMoon,stateAt);
    const previousSign=stateAt(previousNewMoon+0.000001).solarSignIndex;
    const nextSign=stateAt(nextNewMoon+0.000001).solarSignIndex;
    const nextNextSign=stateAt(nextNextNewMoon+0.000001).solarSignIndex;
    const calculatedAmanta=amantaMonthByPreviousNewMoonSunSign[previousSign];
    const amantaMonth=data.hinduMonth||calculatedAmanta;
    const amantaIsAdhika=previousSign===nextSign;

    let purnimantaMonth=amantaMonth;
    let purnimantaIsAdhika=amantaIsAdhika;
    if(data.paksha==="Krishna"&&!amantaIsAdhika){
      purnimantaMonth=amantaMonthByPreviousNewMoonSunSign[nextSign];
      purnimantaIsAdhika=nextSign===nextNextSign;
    }

    return {
      amantaMonth,
      amantaIsAdhika,
      amantaLabel:label(amantaMonth,amantaIsAdhika),
      purnimantaMonth,
      purnimantaIsAdhika,
      purnimantaLabel:label(purnimantaMonth,purnimantaIsAdhika),
    };
  }finally{sweClose(swed);}
}

function findSolarIngressOnCivilDate(baseJd:number,stateAt:ReturnType<typeof stateFactory>):{jd:number;from:number;to:number}|null{
  const start=stateAt(baseJd).solarSignIndex;
  const end=stateAt(baseJd+1).solarSignIndex;
  if(start===end)return null;
  let low=baseJd,high=baseJd+1;
  for(let i=0;i<36;i++){
    const mid=(low+high)/2;
    if(stateAt(mid).solarSignIndex===start)low=mid;else high=mid;
  }
  return {jd:high,from:start,to:end};
}

function resolveGujaratiYearStart(swed:ReturnType<typeof createDefaultSweData>,city:City,year:number,stateAt:ReturnType<typeof stateFactory>){
  const cacheKey=`${city.slug}:${year}`;
  const cached=gujaratiYearStartCache.get(cacheKey);
  if(cached)return cached;

  const scanStart=indiaCivilDayStartJulian(year,9,1);
  const scanEnd=indiaCivilDayStartJulian(year,12,20);
  let previousJd=scanStart;
  let previousIndex=stateAt(previousJd).tithiIndex;
  let pratipadaStart:number|null=null;

  for(let currentJd=scanStart+0.25;currentJd<=scanEnd;currentJd+=0.25){
    const currentIndex=stateAt(currentJd).tithiIndex;
    if(previousIndex===29&&currentIndex===0){
      let low=previousJd,high=currentJd;
      for(let i=0;i<34;i++){
        const mid=(low+high)/2;
        if(stateAt(mid).tithiIndex===29)low=mid;else high=mid;
      }
      if(stateAt(high+0.000001).solarSignIndex===6){
        pratipadaStart=high;
        break;
      }
    }
    previousJd=currentJd;
    previousIndex=currentIndex;
  }

  if(pratipadaStart===null)throw new Error(`Unable to resolve Gujarati Kartika Shukla Pratipada for ${year}`);

  let low=pratipadaStart,high=pratipadaStart+2;
  while(stateAt(high).tithiIndex===0&&high<pratipadaStart+3)high+=0.25;
  for(let i=0;i<34;i++){
    const mid=(low+high)/2;
    if(stateAt(mid).tithiIndex===0)low=mid;else high=mid;
  }
  const pratipadaEnd=high;
  const startDate=indiaLocalPartsFromJulian(pratipadaStart).date;
  const nextDate=addIsoDays(startDate,1);
  const firstSunrise=sunriseForIso(swed,city,startDate);
  const nextSunrise=sunriseForIso(swed,city,nextDate);
  const activeAt=(jd:number|null)=>jd!==null&&jd>=pratipadaStart&&jd<pratipadaEnd;
  const boundary=activeAt(firstSunrise)?startDate:activeAt(nextSunrise)?nextDate:startDate;
  gujaratiYearStartCache.set(cacheKey,boundary);
  return boundary;
}

export function getRegionalCalendarConventions(date:Date,city:City,data:Panchang):RegionalCalendarConventions{
  const swed=createDefaultSweData();
  sweSetSidMode(swed,SE_SIDM_LAHIRI,0,0);
  try{
    const parts=isoDateParts(data.date);
    const baseJd=indiaCivilDayStartJulian(parts.year,parts.month,parts.day);
    const geopos=[city.lng,city.lat,0];
    const rise=sweRiseTrans(swed,baseJd,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_RISE,geopos,1013.25,25,null);
    const set=sweRiseTrans(swed,baseJd,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_SET,geopos,1013.25,25,null);
    const sunriseJd=rise.retval>=0?rise.tret:baseJd+0.25;
    const sunsetJd=set.retval>=0?set.tret:baseJd+0.75;
    const stateAt=stateFactory(swed);
    const ingress=findSolarIngressOnCivilDate(baseJd,stateAt);
    const bengaliIndex=stateAt(baseJd).solarSignIndex;
    const tamilIndex=stateAt(sunsetJd).solarSignIndex;
    const malayalamBoundaryJd=sunriseJd+(sunsetJd-sunriseJd)*(3/5);
    const malayalamIndex=stateAt(malayalamBoundaryJd).solarSignIndex;
    const ingressParts=ingress?indiaLocalPartsFromJulian(ingress.jd):null;
    const gujaratiSamvatYearStart=resolveGujaratiYearStart(swed,city,parts.year,stateAt);
    const betweenChaitraAndGujarati=data.date>=data.samvatYearStart&&data.date<gujaratiSamvatYearStart;

    return {
      solarIngress:ingress&&ingressParts?{
        date:ingressParts.date,
        time:ingressParts.time,
        from:rashis[ingress.from],
        to:rashis[ingress.to],
      }:null,
      bengaliSolarRashi:rashis[bengaliIndex],
      tamilSolarRashi:rashis[tamilIndex],
      malayalamSolarRashi:rashis[malayalamIndex],
      gujaratiSamvat:data.vikramSamvat-(betweenChaitraAndGujarati?1:0),
      gujaratiSamvatYearStart,
    };
  }finally{sweClose(swed);}
}

export function nextLunarMonth(month:string){
  const index=lunarMonths.indexOf(month as typeof lunarMonths[number]);
  return index<0?month:lunarMonths[(index+1)%lunarMonths.length];
}
