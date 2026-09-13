import {coreCities,findCityBySlug,supportedCities,type City} from "./cities";
import {getStoredGoldRatePublicDataset} from "./gold-rate-pipeline";
import {getGoldRateStoreStatus} from "./gold-rate-store";

export type GoldPurity="24k"|"22k"|"18k";
export type GoldRates=Record<GoldPurity,number>;
export type GoldRateHistoryPoint={date:string;rates:GoldRates};
export type GoldRateMarket={rates:GoldRates;history:GoldRateHistoryPoint[]};
export type GoldRateDatasetStatus={
  mode:"fresh"|"last-known";
  message:string|null;
  spotSource:string;
  fxSource:string;
  lastAttemptAt:string|null;
  lastSuccessAt:string|null;
  lastError:string|null;
};
export type GoldRateCalculation={
  troyOunceGrams:number;
  importDutyRate:number;
  gstRate:number;
  cityPremiumModel:string;
  validationBenchmark:string;
};
export type GoldRateValidation={
  passed:boolean;
  firstValidationDate:string|null;
  lastValidationDate:string|null;
  elapsedDays:number;
  observations:number;
  minDays:number;
  minObservations:number;
  averageDifferencePct:number|null;
  maxDifferencePct:number|null;
  averageThresholdPct:number;
  singleDayThresholdPct:number;
};
export type GoldRateDataset={
  updatedAt:string;
  validatedSince:string|null;
  updateFrequency:string;
  source:{name:string;url:string|null};
  national:GoldRateMarket;
  cities:Record<string,GoldRateMarket>;
  status?:GoldRateDatasetStatus;
  calculation?:GoldRateCalculation;
  validation?:GoldRateValidation;
};

export type GoldRateGate={
  ready:boolean;
  publicEnabled:boolean;
  indexingEnabled:boolean;
  fresh:boolean;
  validationPassed:boolean;
  validationDays:number;
  validationObservations:number;
  minValidationDays:number;
  launchCities:string[];
  missingCities:string[];
  reasons:string[];
};

const DATA_CACHE_TTL_MS=10*60*1000;
const DEFAULT_MAX_AGE_HOURS=24;
const DEFAULT_MIN_VALIDATION_DAYS=14;
const MAX_LAUNCH_CITIES=50;
let datasetCache:{expiresAt:number;value:GoldRateDataset|null}|null=null;
let inflight:Promise<GoldRateDataset|null>|null=null;

// Candidate pool only. It is deliberately not an index allowlist: demand validation
// must still explicitly activate cities through GOLD_RATE_INDEX_CITIES.
export const goldRateCandidateCitySlugs=coreCities.slice(0,50).map(city=>city.slug);
const supportedCitySet=new Set(supportedCities.map(city=>city.slug));
const candidateSet=new Set(goldRateCandidateCitySlugs);

function positiveNumber(value:unknown){return typeof value==="number"&&Number.isFinite(value)&&value>0?value:null;}
function nonNegativeNumber(value:unknown){return typeof value==="number"&&Number.isFinite(value)&&value>=0?value:null;}
function validIsoDate(value:unknown){return typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)?value:null;}
function validDateTime(value:unknown){if(typeof value!=="string")return null;const time=Date.parse(value);return Number.isFinite(time)?value:null;}

function parseRates(value:unknown):GoldRates|null{
  if(!value||typeof value!=="object")return null;
  const raw=value as Record<string,unknown>;
  const k24=positiveNumber(raw["24k"]),k22=positiveNumber(raw["22k"]),k18=positiveNumber(raw["18k"]);
  return k24&&k22&&k18?{"24k":k24,"22k":k22,"18k":k18}:null;
}

function parseHistory(value:unknown):GoldRateHistoryPoint[]{
  if(!Array.isArray(value))return [];
  const byDate=new Map<string,GoldRateHistoryPoint>();
  for(const item of value){
    if(!item||typeof item!=="object")continue;
    const raw=item as Record<string,unknown>;
    const date=validIsoDate(raw.date),rates=parseRates(raw.rates);
    if(date&&rates)byDate.set(date,{date,rates});
  }
  return [...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(-60);
}

function parseMarket(value:unknown):GoldRateMarket|null{
  if(!value||typeof value!=="object")return null;
  const raw=value as Record<string,unknown>;
  const rates=parseRates(raw.rates);
  if(!rates)return null;
  return {rates,history:parseHistory(raw.history)};
}

function parseStatus(value:unknown):GoldRateDatasetStatus|undefined{
  if(!value||typeof value!=="object")return undefined;
  const raw=value as Record<string,unknown>;
  const mode=raw.mode==="fresh"||raw.mode==="last-known"?raw.mode:null;
  if(!mode)return undefined;
  return {
    mode,
    message:typeof raw.message==="string"?raw.message:null,
    spotSource:typeof raw.spotSource==="string"?raw.spotSource:"unknown",
    fxSource:typeof raw.fxSource==="string"?raw.fxSource:"unknown",
    lastAttemptAt:validDateTime(raw.lastAttemptAt),
    lastSuccessAt:validDateTime(raw.lastSuccessAt),
    lastError:typeof raw.lastError==="string"?raw.lastError:null,
  };
}

function parseCalculation(value:unknown):GoldRateCalculation|undefined{
  if(!value||typeof value!=="object")return undefined;
  const raw=value as Record<string,unknown>;
  const troy=positiveNumber(raw.troyOunceGrams),duty=nonNegativeNumber(raw.importDutyRate),gst=nonNegativeNumber(raw.gstRate);
  if(troy===null||duty===null||gst===null)return undefined;
  return {
    troyOunceGrams:troy,
    importDutyRate:duty,
    gstRate:gst,
    cityPremiumModel:typeof raw.cityPremiumModel==="string"?raw.cityPremiumModel:"documented regional estimate",
    validationBenchmark:typeof raw.validationBenchmark==="string"?raw.validationBenchmark:"manual benchmark",
  };
}

function parseValidation(value:unknown):GoldRateValidation|undefined{
  if(!value||typeof value!=="object")return undefined;
  const raw=value as Record<string,unknown>;
  const elapsed=nonNegativeNumber(raw.elapsedDays),observations=nonNegativeNumber(raw.observations),minDays=positiveNumber(raw.minDays),minObservations=positiveNumber(raw.minObservations);
  const avgThreshold=positiveNumber(raw.averageThresholdPct),singleThreshold=positiveNumber(raw.singleDayThresholdPct);
  if(elapsed===null||observations===null||minDays===null||minObservations===null||avgThreshold===null||singleThreshold===null)return undefined;
  const average=raw.averageDifferencePct===null?null:nonNegativeNumber(raw.averageDifferencePct);
  const max=raw.maxDifferencePct===null?null:nonNegativeNumber(raw.maxDifferencePct);
  return {
    passed:raw.passed===true,
    firstValidationDate:validIsoDate(raw.firstValidationDate),
    lastValidationDate:validIsoDate(raw.lastValidationDate),
    elapsedDays:elapsed,
    observations,
    minDays,
    minObservations,
    averageDifferencePct:average,
    maxDifferencePct:max,
    averageThresholdPct:avgThreshold,
    singleDayThresholdPct:singleThreshold,
  };
}

export function parseGoldRateDataset(value:unknown):GoldRateDataset|null{
  if(!value||typeof value!=="object")return null;
  const raw=value as Record<string,unknown>;
  const updatedAt=validDateTime(raw.updatedAt);
  const national=parseMarket(raw.national);
  const sourceRaw=raw.source&&typeof raw.source==="object"?raw.source as Record<string,unknown>:{};
  const sourceName=typeof sourceRaw.name==="string"?sourceRaw.name.trim():"";
  if(!updatedAt||!national||!sourceName)return null;
  const citiesRaw=raw.cities&&typeof raw.cities==="object"?raw.cities as Record<string,unknown>:{};
  const cities:Record<string,GoldRateMarket>={};
  for(const [slug,item] of Object.entries(citiesRaw)){
    if(!supportedCitySet.has(slug))continue;
    const market=parseMarket(item);
    if(market)cities[slug]=market;
  }
  const validatedSince=validDateTime(raw.validatedSince);
  const updateFrequency=typeof raw.updateFrequency==="string"&&raw.updateFrequency.trim()?raw.updateFrequency.trim().slice(0,160):"source schedule";
  const sourceUrl=typeof sourceRaw.url==="string"&&/^https?:\/\//.test(sourceRaw.url)?sourceRaw.url:null;
  const status=parseStatus(raw.status),calculation=parseCalculation(raw.calculation),validation=parseValidation(raw.validation);
  return {updatedAt,validatedSince,updateFrequency,source:{name:sourceName,url:sourceUrl},national,cities,...(status?{status}:{}),...(calculation?{calculation}:{}),...(validation?{validation}:{})};
}

export function goldRatePublicEnabled(){
  if(process.env.GOLD_RATE_PUBLIC_ENABLED==="true")return true;
  if(process.env.GOLD_RATE_PUBLIC_ENABLED==="false")return false;
  return Boolean(process.env.GOLD_RATE_DATA_URL)||getGoldRateStoreStatus().configured;
}

export function goldRateIndexCitySlugs(){
  const raw=process.env.GOLD_RATE_INDEX_CITIES??"";
  return [...new Set(raw.split(",").map(item=>item.trim().toLowerCase()).filter(slug=>slug&&supportedCitySet.has(slug)))].slice(0,MAX_LAUNCH_CITIES);
}

function maxAgeHours(){const value=Number(process.env.GOLD_RATE_MAX_AGE_HOURS);return Number.isFinite(value)&&value>0?Math.min(value,72):DEFAULT_MAX_AGE_HOURS;}
function minValidationDays(){const value=Number(process.env.GOLD_RATE_MIN_VALIDATION_DAYS);return Number.isFinite(value)&&value>=7?Math.min(value,60):DEFAULT_MIN_VALIDATION_DAYS;}

export function goldRateGate(dataset:GoldRateDataset|null):GoldRateGate{
  const publicEnabled=goldRatePublicEnabled();
  const indexingEnabled=process.env.GOLD_RATE_INDEXING_ENABLED==="true";
  const launchCities=goldRateIndexCitySlugs();
  const minDays=dataset?.validation?.minDays??minValidationDays();
  const reasons:string[]=[];
  if(!publicEnabled)reasons.push("public gold-rate cluster is not enabled");
  if(!indexingEnabled)reasons.push("indexing gate is disabled");
  if(!dataset)reasons.push("validated gold-rate dataset is unavailable");

  const updatedTime=dataset?Date.parse(dataset.updatedAt):NaN;
  const ageHours=Number.isFinite(updatedTime)?(Date.now()-updatedTime)/3600000:Infinity;
  const fresh=Boolean(dataset)&&ageHours>=0&&ageHours<=maxAgeHours();
  if(dataset&&!fresh)reasons.push("rate dataset is stale");

  const validationTime=dataset?.validatedSince?Date.parse(dataset.validatedSince):NaN;
  const fallbackValidationDays=Number.isFinite(validationTime)?Math.max(0,Math.floor((Date.now()-validationTime)/86400000)):0;
  const validationDays=dataset?.validation?.elapsedDays??fallbackValidationDays;
  const validationObservations=dataset?.validation?.observations??0;
  const validationPassed=dataset?.validation?.passed===true;
  if(dataset&&!validationPassed)reasons.push("IBJA benchmark validation has not passed the 14-day accuracy protocol");
  if(dataset&&validationDays<minDays)reasons.push(`source validation has not reached ${minDays} days`);
  if(!launchCities.length)reasons.push("no demand-approved launch cities configured");

  const missingCities=dataset?launchCities.filter(slug=>{
    const market=dataset.cities[slug];
    return !market||market.history.length<7;
  }):launchCities;
  if(missingCities.length)reasons.push("one or more launch cities lack current rates or trend history");

  const ready=publicEnabled&&indexingEnabled&&Boolean(dataset)&&fresh&&validationPassed&&validationDays>=minDays&&launchCities.length>0&&!missingCities.length;
  return {ready,publicEnabled,indexingEnabled,fresh,validationPassed,validationDays,validationObservations,minValidationDays:minDays,launchCities,missingCities,reasons};
}

export function isGoldRateCandidateCity(slug:string){return candidateSet.has(slug);}
export function isGoldRateCityIndexable(slug:string,dataset:GoldRateDataset|null){const gate=goldRateGate(dataset);return gate.ready&&gate.launchCities.includes(slug)&&Boolean(dataset?.cities[slug]);}
export function isGoldRateHubIndexable(dataset:GoldRateDataset|null){return goldRateGate(dataset).ready;}

async function loadGoldRateDataset():Promise<GoldRateDataset|null>{
  const url=process.env.GOLD_RATE_DATA_URL;
  if(url){
    try{
      const headers:Record<string,string>={accept:"application/json"};
      if(process.env.GOLD_RATE_DATA_TOKEN)headers.authorization=`Bearer ${process.env.GOLD_RATE_DATA_TOKEN}`;
      const response=await fetch(url,{headers,next:{revalidate:600}});
      if(!response.ok)return null;
      return parseGoldRateDataset(await response.json());
    }catch{return null;}
  }
  if(!getGoldRateStoreStatus().configured)return null;
  try{return parseGoldRateDataset(await getStoredGoldRatePublicDataset());}
  catch{return null;}
}

export async function getGoldRateDataset():Promise<GoldRateDataset|null>{
  const now=Date.now();
  if(datasetCache&&datasetCache.expiresAt>now)return datasetCache.value;
  if(inflight)return inflight;
  const request=loadGoldRateDataset()
    .then(value=>{datasetCache={value,expiresAt:Date.now()+DATA_CACHE_TTL_MS};return value;})
    .finally(()=>{inflight=null;});
  inflight=request;
  return request;
}

export function formatGoldRate(value:number){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value);}
export function formatGoldUpdatedAt(value:string){return new Intl.DateTimeFormat("en-IN",{dateStyle:"long",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(value));}
export function rateForWeight(perGram:number,grams:number){return perGram*grams;}

function distanceKm(a:City,b:City){
  const toRad=(value:number)=>value*Math.PI/180;
  const earth=6371;
  const dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng);
  const x=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return earth*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

export function goldRateComparisonCities(city:City,dataset:GoldRateDataset|null,count=5){
  const allowed=goldRateIndexCitySlugs();
  const pool=(allowed.length?allowed:goldRateCandidateCitySlugs)
    .map(slug=>findCityBySlug(slug))
    .filter((item):item is City=>item!==undefined)
    .filter(item=>item.slug!==city.slug)
    .filter(item=>!dataset||Boolean(dataset.cities[item.slug]));
  return pool.sort((a,b)=>distanceKm(city,a)-distanceKm(city,b)).slice(0,count);
}

export function goldRateHubCities(dataset:GoldRateDataset|null){
  const configured=goldRateIndexCitySlugs();
  const slugs=configured.length?configured:goldRateCandidateCitySlugs;
  return slugs.map(slug=>findCityBySlug(slug)).filter((city):city is City=>city!==undefined).filter(city=>!dataset||Boolean(dataset.cities[city.slug]));
}

export function goldRateSitemapUrls(dataset:GoldRateDataset|null){
  const gate=goldRateGate(dataset);
  if(!gate.ready)return [];
  const base="https://panchvani.com";
  return [
    `${base}/gold-rate`,
    ...gate.launchCities.map(slug=>`${base}/gold-rate/${slug}`),
    `${base}/tools/gold-value-calculator`,
  ];
}
