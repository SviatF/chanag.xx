import type {City} from "./cities";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalc,sweClose} from "@typescriptify/sweph/dist/sweph.js";
import {sweRiseTrans} from "@typescriptify/sweph/dist/swecl.js";
import {SE_SUN,SE_MOON,SEFLG_MOSEPH,SE_CALC_RISE} from "@typescriptify/sweph/dist/constants.js";
import {addIsoDays,indiaCivilDayStartJulian,indiaLocalPartsFromJulian} from "./india-time";

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
type VratCalendarMap=Record<VratSlug,VratOccurrence[]>;
const cache=new Map<string,VratCalendarMap>();
const norm=(value:number)=>((value%360)+360)%360;

function nextDayIso(dateIso:string){return addIsoDays(dateIso,1);}

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

function finalize(rows:Omit<VratOccurrence,"repeatedAtSunrise"|"sequence">[]):VratOccurrence[]{
  return rows.map((item,index)=>({
    ...item,
    repeatedAtSunrise:index>0&&nextDayIso(rows[index-1].date)===item.date&&rows[index-1].tithi===item.tithi&&rows[index-1].paksha===item.paksha,
    sequence:index+1
  }));
}

function calculateAllVratCalendars(year:number,city:City):VratCalendarMap{
  const cacheKey=`${city.slug}:${year}`;
  const cached=cache.get(cacheKey);if(cached)return cached;

  const swed=createDefaultSweData();
  const raw:Record<VratSlug,Omit<VratOccurrence,"repeatedAtSunrise"|"sequence">[]>={ekadashi:[],purnima:[],amavasya:[]};
  const start=new Date(Date.UTC(year,0,1,12));
  const end=new Date(Date.UTC(year+1,0,1,12));

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
    if(tithiIndexAt(high)===startIndex)return null;
    for(let i=0;i<30;i++){
      const mid=(low+high)/2;
      if(tithiIndexAt(mid)===startIndex)low=mid;else high=mid;
    }
    return high;
  };

  try{
    for(let cursor=new Date(start);cursor<end;cursor.setUTCDate(cursor.getUTCDate()+1)){
      const y=cursor.getUTCFullYear(),m=cursor.getUTCMonth()+1,d=cursor.getUTCDate();
      const baseJd=indiaCivilDayStartJulian(y,m,d);
      const rise=sweRiseTrans(swed,baseJd,SE_SUN,null,SEFLG_MOSEPH,SE_CALC_RISE,[city.lng,city.lat,0],1013.25,25,null);
      const sunriseJd=rise.retval>=0?rise.tret:baseJd+0.25;
      const sunrise=indiaLocalPartsFromJulian(sunriseJd);

      // Guard the civil-date invariant: each loop iteration represents exactly one
      // India-local date, including eastern cities whose sunrise is before 05:30 IST.
      const expectedDate=`${String(y).padStart(4,"0")}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      if(sunrise.date!==expectedDate)throw new Error(`Vrat sunrise date mismatch for ${city.slug}: expected ${expectedDate}, got ${sunrise.date}`);

      const index=tithiIndexAt(sunriseJd);
      const target=targetForIndex(index);
      if(!target)continue;
      const transition=transitionAfter(sunriseJd);
      const endParts=transition?indiaLocalPartsFromJulian(transition):{date:sunrise.date,time:"—",minutes:0};
      raw[target].push({
        date:sunrise.date,
        weekday:new Intl.DateTimeFormat("en-IN",{weekday:"long",timeZone:"UTC"}).format(new Date(`${sunrise.date}T12:00:00Z`)),
        paksha:pakshaForIndex(index),
        tithi:tithiNameForIndex(index),
        sunrise:sunrise.time,
        tithiEnd:endParts.time,
        tithiEndDate:endParts.date
      });
    }
  }finally{sweClose(swed);}

  const calendars:VratCalendarMap={
    ekadashi:finalize(raw.ekadashi),
    purnima:finalize(raw.purnima),
    amavasya:finalize(raw.amavasya)
  };
  cache.set(cacheKey,calendars);
  return calendars;
}

export function calculateVratCalendar(vrat:VratSlug,year:number,city:City):VratOccurrence[]{
  return calculateAllVratCalendars(year,city)[vrat].map(item=>({...item}));
}

export function vratCalendarSummary(rows:VratOccurrence[]){
  const repeated=rows.filter(item=>item.repeatedAtSunrise).length;
  const shukla=rows.filter(item=>item.paksha==="Shukla").length;
  const krishna=rows.filter(item=>item.paksha==="Krishna").length;
  return {count:rows.length,repeated,shukla,krishna,first:rows[0]?.date??null,last:rows.length?rows[rows.length-1].date:null};
}