import {supportedCities,type City} from "./cities";
import {todayInIndia} from "./dates";

export const phase1PriorityCities = [
  "mumbai","delhi","bengaluru","hyderabad","ahmedabad",
  "chennai","kolkata","surat","pune","jaipur",
  "lucknow","kanpur","nagpur","indore","thane",
  "bhopal","visakhapatnam","patna","vadodara","varanasi"
] as const;

export const wave2ControlledCities = [
  "pimpri-chinchwad",
  "ghaziabad",
  "ludhiana",
  "agra",
  "nashik",
] as const;

export const primaryMuhuratEvents = [
  "wedding",
  "griha-pravesh",
  "vehicle-purchase"
] as const;

export const primaryVratTypes=["ekadashi","purnima","amavasya"] as const;

const baselinePriorityCitySet=new Set<string>(phase1PriorityCities);
const wave2ControlledCitySet=new Set<string>(wave2ControlledCities);
const supportedCitySlugSet=new Set(supportedCities.map(city=>city.slug));
const primaryMuhuratSet=new Set<string>(primaryMuhuratEvents);
const primaryVratSet=new Set<string>(primaryVratTypes);

const regionalLanguageCode:Record<string,string>={
  bengali:"bn",
  tamil:"ta",
  malayalam:"ml",
  gujarati:"gu",
  marathi:"mr",
};

function configuredExtraIndexCities(){
  const raw=process.env.SEO_EXTRA_INDEX_CITIES??"";
  return [...new Set(raw.split(",").map(slug=>slug.trim().toLowerCase()).filter(slug=>slug&&supportedCitySlugSet.has(slug)&&!baselinePriorityCitySet.has(slug)&&!wave2ControlledCitySet.has(slug)))];
}

export function activeIndexCitySlugs(){
  return [...phase1PriorityCities,...wave2ControlledCities,...configuredExtraIndexCities()];
}

export function getIndexActivationSnapshot(){
  const extra=configuredExtraIndexCities();
  return {
    baseline:[...phase1PriorityCities],
    controlled:[...wave2ControlledCities],
    extra,
    active:[...phase1PriorityCities,...wave2ControlledCities,...extra],
  };
}

function monthDistance(year:number,month:number){
  const now=todayInIndia();
  const current=now.getUTCFullYear()*12+now.getUTCMonth();
  const target=year*12+(month-1);
  return target-current;
}

function yearDistance(year:number){return year-todayInIndia().getUTCFullYear();}

export function yearlyIndexYears(){
  const current=todayInIndia().getUTCFullYear();
  return [current-1,current,current+1,current+2];
}

export function isBaselinePriorityCity(citySlug:string){
  return baselinePriorityCitySet.has(citySlug);
}

export function isWave2ControlledCity(citySlug:string){
  return wave2ControlledCitySet.has(citySlug);
}

function isConfiguredExtraCity(citySlug:string){
  return configuredExtraIndexCities().includes(citySlug);
}

export function isPriorityCity(citySlug:string){
  return isBaselinePriorityCity(citySlug)||isWave2ControlledCity(citySlug)||isConfiguredExtraCity(citySlug);
}

export function isDailyIndexable(citySlug:string,dateIso:string){
  if(!isPriorityCity(citySlug)) return false;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return false;

  const now=todayInIndia();
  const target=new Date(dateIso+"T00:00:00Z");
  const todayUtc=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
  const deltaDays=(target.getTime()-todayUtc)/86400000;

  if(isWave2ControlledCity(citySlug)){
    // Controlled Wave 2: keep discovery concentrated around live/near-term intent.
    return deltaDays>=-3&&deltaDays<=14;
  }

  // Baseline + explicitly configured expansion cities retain the mature window.
  return deltaDays>=-14&&deltaDays<=45;
}

export function isMonthlyIndexable(citySlug:string,year:number,month:number){
  if(!isPriorityCity(citySlug)) return false;
  const distance=monthDistance(year,month);
  if(isWave2ControlledCity(citySlug))return distance===0;
  return distance>=-3&&distance<=12;
}

export function isYearlyCalendarIndexable(year:number,citySlug?:string){
  if(!yearlyIndexYears().includes(year))return false;
  if(!citySlug)return true;
  if(!isPriorityCity(citySlug))return false;
  if(isWave2ControlledCity(citySlug))return year===todayInIndia().getUTCFullYear();
  return true;
}

export function isMuhuratIndexable(event:string,citySlug?:string){
  if(!primaryMuhuratSet.has(event)) return false;
  return citySlug ? isPriorityCity(citySlug) : true;
}

export function isMonthlyMuhuratIndexable(event:string,year:number,month:number,citySlug?:string){
  if(!isMuhuratIndexable(event,citySlug))return false;
  const distance=monthDistance(year,month);
  if(citySlug&&isWave2ControlledCity(citySlug))return distance===0;
  return distance>=0&&distance<=12;
}

export function isYearlyMuhuratIndexable(event:string,year:number,citySlug?:string){
  if(!isMuhuratIndexable(event,citySlug))return false;
  return yearlyIndexYears().includes(year);
}

export function isVratIndexable(vrat:string,year:number,citySlug?:string){
  if(!primaryVratSet.has(vrat))return false;
  const distance=yearDistance(year);
  if(distance < -1 || distance > 2)return false;
  if(!citySlug)return true;
  if(!isPriorityCity(citySlug))return false;
  if(isWave2ControlledCity(citySlug))return distance===0;
  return true;
}

export function isRegionalIndexable(language:string,city:City){
  const code=regionalLanguageCode[language];
  // Regional Wave 2 is intentionally held back until the 25-city core settles.
  if(!code||!isBaselinePriorityCity(city.slug)) return false;
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