import type { City } from "./cities";
import {todayInIndia} from "./dates";

export const phase1PriorityCities = [
  "mumbai","delhi","bengaluru","hyderabad","ahmedabad",
  "chennai","kolkata","surat","pune","jaipur",
  "lucknow","kanpur","nagpur","indore","thane",
  "bhopal","visakhapatnam","patna","vadodara","varanasi"
] as const;

export const primaryMuhuratEvents = [
  "wedding",
  "griha-pravesh",
  "vehicle-purchase"
] as const;

const priorityCitySet = new Set<string>(phase1PriorityCities);
const primaryMuhuratSet = new Set<string>(primaryMuhuratEvents);

const regionalLanguageCode:Record<string,string>={
  bengali:"bn",
  tamil:"ta",
  malayalam:"ml",
  gujarati:"gu",
  marathi:"mr",
};

function monthDistance(year:number,month:number){
  const now=todayInIndia();
  const current=now.getUTCFullYear()*12+now.getUTCMonth();
  const target=year*12+(month-1);
  return target-current;
}

export function isPriorityCity(citySlug:string){
  return priorityCitySet.has(citySlug);
}

export function isDailyIndexable(citySlug:string,dateIso:string){
  if(!isPriorityCity(citySlug)) return false;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return false;

  const now=todayInIndia();
  const target=new Date(dateIso+"T00:00:00Z");
  const deltaDays=Math.abs((target.getTime()-Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()))/86400000);

  // Launch policy: index current/recent/near-future dated pages only.
  // Wider historical coverage will be enabled by Traffic/Demand Monitor signals.
  return deltaDays<=45;
}

export function isMonthlyIndexable(citySlug:string,year:number,month:number){
  if(!isPriorityCity(citySlug)) return false;
  const distance=monthDistance(year,month);
  return distance>=-3&&distance<=12;
}

export function isMuhuratIndexable(event:string,citySlug?:string){
  if(!primaryMuhuratSet.has(event)) return false;
  return citySlug ? isPriorityCity(citySlug) : true;
}

export function isRegionalIndexable(language:string,city:City){
  const code=regionalLanguageCode[language];
  if(!code||!isPriorityCity(city.slug)) return false;
  return city.language.includes(code);
}

export function robotsFor(indexable:boolean){
  return {
    index:indexable,
    follow:true,
    googleBot:{
      index:indexable,
      follow:true,
      "max-image-preview":"large" as const,
      "max-snippet":-1,
      "max-video-preview":-1,
    },
  };
}
