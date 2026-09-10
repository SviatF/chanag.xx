import type {City} from "./cities";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalc,sweClose} from "@typescriptify/sweph/dist/sweph.js";
import {sweRiseTrans} from "@typescriptify/sweph/dist/swecl.js";
import {julDay,revJul} from "@typescriptify/sweph/dist/swedate.js";
import {SE_SUN,SE_MOON,SEFLG_MOSEPH,SE_GREG_CAL,SE_CALC_RISE} from "@typescriptify/sweph/dist/constants.js";

export const vratSlugs=["ekadashi","purnima","amavasya"] as const;
export type VratSlug=typeof vratSlugs[number];

export type VratDefinition={
  slug:VratSlug;
  name:string;
  hindi:string;
  short:string;
  methodology:string;
  ritualCaution:string;
};

export type VratOccurrence={
  date:string;
  weekday:string;
  paksha:"Shukla"|"Krishna";
  tithi:"Ekadashi"|"Purnima"|"Amavasya";
  sunrise:string;
  tithiEnd:string;
  tithiEndDate:string;
  repeatedAtSunrise:boolean;
  sequence:number;
};

export const vratDefinitions:Record<VratSlug,VratDefinition>={
  ekadashi:{
    slug:"ekadashi",name:"Ekadashi",hindi:"एकादशी",
    short:"Sunrise-based Ekadashi Tithi observations for a selected year and location.",
    methodology:"Panchvani marks dates where Ekadashi Tithi is active at local sunrise. This is a lunar-calendar reference generated from Sun–Moon elongation and the selected city’s sunrise.",
    ritualCaution:"This is not a sampradaya-specific fasting or Parana calendar. Smarta, Vaishnava and other traditions may select a different observance day when Tithi spans or repeats across sunrise."
  },
  purnima:{
    slug:"purnima",name:"Purnima",hindi:"पूर्णिमा",
    short:"Sunrise-based Purnima Tithi observations for a selected year and location.",
    methodology:"Panchvani marks dates where Shukla Paksha Purnima Tithi is active at local sunrise using the same Swiss Ephemeris based lunar calculation as the daily Panchang.",
    ritualCaution:"Festival or vrata observance rules can depend on whether Purnima prevails at a particular ritual time, not only sunrise. Use this page as a Panchang reference rather than a priest-specific prescription."
  },
  amavasya:{
    slug:"amavasya",name:"Amavasya",hindi:"अमावस्या",
    short:"Sunrise-based Amavasya Tithi observations for a selected year and location.",
    methodology:"Panchvani marks dates where Krishna Paksha Amavasya Tithi is active at local sunrise using Sun–Moon elongation and local sunrise for the selected city.",
    ritualCaution:"Specific rites may use additional timing rules beyond sunrise Tithi. This page is a calculated lunar reference and does not replace tradition-specific guidance."
  }
};

export function findVratBySlug(value:string):VratDefinition|undefined{
  return vratSlugs.includes(value as VratSlug)?vratDefinitions[value as VratSlug]:undefined;
}

const tithiNames=["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima"] as const;
const cache=new Map<string,VratOccurrence[]>();
const norm=(value:number)=>((value%360)+360)%360;
const pad=(value:number)=>String(value).padStart(2,"0");

function utcDateIso(date:Date){return date.toISOString().slice(0,10);}
function nextDayIso(dateIso:string){const d=new Date(dateIso+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+1);return utcDateIso(d);}

function localPartsFromJulian(jd:number){
  const value=revJul(jd,SE_GREG_CAL);
  let totalMinutes=Math.round(value.hour*60+330);
  let dayOffset=Math.floor(totalMinutes/1440);
  totalMinutes=((totalMinutes%1440)+1440)%1440;
  const localDate=new Date(Date.UTC(value.year,value.month-1,value.day));
  localDate.setUTCDate(localDate.getUTCDate()+dayOffset);
  return {date:utcDateIso(localDate),time:`${pad(Math.floor(totalMinutes/60))}:${pad(totalMinutes%60)}`};
}

function targetForIndex(index:number):VratSlug|null{
  if(index===10||index===25)return "ekadashi";
  if(index===14)return "purnima";
  if(index===29)return "amavasya";
  return null;
}

function pakshaForIndex(index:number):"Shukla"|"Krishna"{return index<15?"Shukla":"Krishna";}
function tithiNameForIndex(index:number):"Ekadashi"|"Purnima"|"Amavasya"{
  const paksha=pakshaForIndex(index);
  const base=index%15;
  if(base===14)return paksha==="Shukla"?"Purnima":"Amavasya";
  return tithiNames[base] as "Ekadashi";
}

export function calculateVratCalendar(vrat:VratSlug,year:number,city:City):VratOccurrence[]{
  const cacheKey=`${city.slug}:${year}:${vrat}`;
  const cached=cache.get(cacheKey);if(cached)return cached.map(item=>({...item}));

  const swed=createDefaultSweData();
  const results:Omit<VratOccurrence,"repeatedAtSunrise"|"sequence">[]=[];
  const start=new Date(Date.UTC(year,0,1));
  const end=new Date(Date.UTC(year+1,0,1));

  const tithiIndexAt=(jd:number)=>{
    const sun=sweCalc(swed,jd,SE_SUN,SEFLG_MOSEPH).xx[0];
    const moon=sweCalc(swed,jd,SE_MOON,SEFLG_MOSEPH).xx[0];
    return Math.floor(norm(moon-sun)/12);
  };

  const transitionAfter=(sunriseJd:number)=>{
    const startIndex=tithiIndexAt(sunriseJd);
    let low=sunriseJd;
    let high=sunriseJd+2/24;
    while(high<sunriseJd+2&&tithiIndexAt(high)===startIndex){low=high;high+=2/24;}
    if(high>=sunriseJd+2)return null;
    for(let i=0;i<28;i++){
      const mid=(low+high)/2;
      if(tithiIndexAt(mid)===startIndex)low=mid;else high=mid;
    }
    return high;
  };

  try{
    for(let cursor=new Date(start);cursor<end;cursor.setUTCDate(cursor.getUTCDate()+1)){
      const y=cursor.getUTCFullYear(),m=cursor.getUTCMonth()+1,d=cursor.getUTCDate();
      const baseJd=julDay(y,m,d,0,SE_GREG_CAL);
      const rise=sweRiseTrans(swed,baseJd,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_RISE,[city.lng,city.lat,0],1013.25,25,null);
      const sunriseJd=rise.retval>=0?rise.tret:baseJd+0.25;
      const index=tithiIndexAt(sunriseJd);
      if(targetForIndex(index)!==vrat)continue;
      const transition=transitionAfter(sunriseJd);
      const sunrise=localPartsFromJulian(sunriseJd);
      const endParts=transition?localPartsFromJulian(transition):{date:sunrise.date,time:"—"};
      results.push({
        date:sunrise.date,
        weekday:new Intl.DateTimeFormat("en-IN",{weekday:"long",timeZone:"Asia/Kolkata"}).format(new Date(sunrise.date+"T06:00:00Z")),
        paksha:pakshaForIndex(index),
        tithi:tithiNameForIndex(index),
        sunrise:sunrise.time,
        tithiEnd:endParts.time,
        tithiEndDate:endParts.date
      });
    }
  }finally{sweClose(swed);}

  const rows:VratOccurrence[]=results.map((item,index)=>({
    ...item,
    repeatedAtSunrise:index>0&&results[index-1].date!==item.date&&nextDayIso(results[index-1].date)===item.date&&results[index-1].tithi===item.tithi&&results[index-1].paksha===item.paksha,
    sequence:index+1
  }));
  cache.set(cacheKey,rows);
  return rows.map(item=>({...item}));
}

export function vratCalendarSummary(rows:VratOccurrence[]){
  const repeated=rows.filter(item=>item.repeatedAtSunrise).length;
  const shukla=rows.filter(item=>item.paksha==="Shukla").length;
  const krishna=rows.filter(item=>item.paksha==="Krishna").length;
  return {count:rows.length,repeated,shukla,krishna,first:rows[0]?.date??null,last:rows.at(-1)?.date??null};
}
