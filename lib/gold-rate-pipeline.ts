import {coreCities,type City} from "./cities";
import {getGoldRateStoreStatus,readGoldRatePipelineState,writeGoldRatePipelineState} from "./gold-rate-store";

const TROY_OUNCE_GRAMS=31.1034768;
const MAX_HISTORY_DAYS=31;
const DEFAULT_IMPORT_DUTY_RATE=0.15;
const DEFAULT_GST_RATE=0.03;
const DEFAULT_MIN_VALIDATION_DAYS=14;
const DEFAULT_MIN_VALIDATION_OBSERVATIONS=10;
const MAX_VALIDATION_AVERAGE_PCT=2;
const MAX_VALIDATION_SINGLE_DAY_PCT=5;

export type GoldRatePipelineObservation={
  at:string;
  spotUpdatedAt:string;
  spotSource:string;
  spotUsdPerOz:number;
  fxDate:string;
  fxSource:string;
  usdInr:number;
  importDutyRate:number;
  gstRate:number;
  spotInrPerGram:number;
  benchmarkComparable24k:number;
  rates:{"24k":number;"22k":number;"18k":number};
};

export type GoldRateValidationEntry={
  date:string;
  ibja999Per10g:number;
  ibja999PerGram:number;
  calculatedPreGst24kPerGram:number;
  differencePct:number;
  recordedAt:string;
  note:string;
};

export type GoldRatePipelineState={
  version:1;
  startedAt:string;
  lastAttemptAt:string|null;
  lastSuccessAt:string|null;
  lastError:string|null;
  observations:GoldRatePipelineObservation[];
  validations:GoldRateValidationEntry[];
};

export type GoldRateValidationSummary={
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

type SpotQuote={price:number;updatedAt:string;source:string};
type FxQuote={rate:number;date:string;source:string};

type PublicRates={"24k":number;"22k":number;"18k":number};
type PublicHistoryPoint={date:string;rates:PublicRates};
type PublicMarket={rates:PublicRates;history:PublicHistoryPoint[]};

const defaultCityPremiums:Record<string,number>={
  mumbai:0,
  delhi:0.002,
  bengaluru:0.004,
  hyderabad:0.004,
  ahmedabad:0.001,
  chennai:0.005,
  kolkata:0.002,
  surat:0.001,
  pune:0.001,
  jaipur:0.002,
  lucknow:0.002,
  kanpur:0.002,
  nagpur:0.001,
  indore:0.002,
  thane:0.001,
  bhopal:0.002,
  visakhapatnam:0.004,
  "pimpri-chinchwad":0.001,
  patna:0.003,
  vadodara:0.001,
  ghaziabad:0.002,
  ludhiana:0.002,
  agra:0.002,
  nashik:0.001,
  faridabad:0.002,
  meerut:0.002,
  rajkot:0.001,
  "kalyan-dombivli":0.001,
  "vasai-virar":0.001,
  varanasi:0.003,
  srinagar:0.003,
  aurangabad:0.001,
  dhanbad:0.003,
  amritsar:0.002,
  "navi-mumbai":0.001,
  allahabad:0.003,
  ranchi:0.003,
  howrah:0.002,
  coimbatore:0.005,
  jabalpur:0.002,
  gwalior:0.002,
  vijayawada:0.004,
  jodhpur:0.002,
  madurai:0.005,
  raipur:0.003,
  kota:0.002,
  chandigarh:0.002,
  guwahati:0.003,
  solapur:0.001,
  "hubballi-dharwad":0.004,
};

export const goldRatePipelineDefaults={
  troyOunceGrams:TROY_OUNCE_GRAMS,
  importDutyRate:DEFAULT_IMPORT_DUTY_RATE,
  gstRate:DEFAULT_GST_RATE,
  cityPremiums:{...defaultCityPremiums},
  validation:{
    minDays:DEFAULT_MIN_VALIDATION_DAYS,
    minObservations:DEFAULT_MIN_VALIDATION_OBSERVATIONS,
    averageThresholdPct:MAX_VALIDATION_AVERAGE_PCT,
    singleDayThresholdPct:MAX_VALIDATION_SINGLE_DAY_PCT,
  },
};

function positiveNumber(value:unknown){
  const number=typeof value==="number"?value:Number(value);
  return Number.isFinite(number)&&number>0?number:null;
}

function rateFromEnv(name:string,fallback:number,min=0,max=0.5){
  const value=Number(process.env[name]);
  return Number.isFinite(value)&&value>=min&&value<=max?value:fallback;
}

function integerFromEnv(name:string,fallback:number,min:number,max:number){
  const value=Number(process.env[name]);
  return Number.isInteger(value)&&value>=min&&value<=max?value:fallback;
}

function importDutyRate(){return rateFromEnv("GOLD_RATE_IMPORT_DUTY_RATE",DEFAULT_IMPORT_DUTY_RATE,0,0.5);}
function gstRate(){return rateFromEnv("GOLD_RATE_GST_RATE",DEFAULT_GST_RATE,0,0.2);}
function minValidationDays(){return integerFromEnv("GOLD_RATE_MIN_VALIDATION_DAYS",DEFAULT_MIN_VALIDATION_DAYS,7,60);}
function minValidationObservations(){return integerFromEnv("GOLD_RATE_MIN_VALIDATION_OBSERVATIONS",DEFAULT_MIN_VALIDATION_OBSERVATIONS,5,40);}

function configuredCityPremiums(){
  const raw=process.env.GOLD_RATE_CITY_PREMIUMS_JSON;
  if(!raw)return {...defaultCityPremiums};
  try{
    const parsed=JSON.parse(raw) as Record<string,unknown>;
    const merged={...defaultCityPremiums};
    for(const city of coreCities.slice(0,50)){
      const value=positiveNumber(parsed[city.slug]);
      if(value!==null&&value<=0.01)merged[city.slug]=value;
      if(parsed[city.slug]===0)merged[city.slug]=0;
    }
    return merged;
  }catch{return {...defaultCityPremiums};}
}

function cityPremium(city:City,premiums:Record<string,number>){return premiums[city.slug]??0.003;}

export function calculateIndiaGoldRates(spotUsdPerOz:number,usdInr:number,duty=importDutyRate(),gst=gstRate()){
  const spotInrPerGram=(spotUsdPerOz/TROY_OUNCE_GRAMS)*usdInr;
  const benchmarkComparable24k=spotInrPerGram*(1+duty);
  const domestic24k=benchmarkComparable24k*(1+gst);
  return {
    spotInrPerGram,
    benchmarkComparable24k,
    rates:{
      "24k":domestic24k,
      "22k":domestic24k*(22/24),
      "18k":domestic24k*(18/24),
    } satisfies PublicRates,
  };
}

function applyPremium(rates:PublicRates,premium:number):PublicRates{
  return {"24k":rates["24k"]*(1+premium),"22k":rates["22k"]*(1+premium),"18k":rates["18k"]*(1+premium)};
}

async function fetchJson(url:string,timeoutMs=8000){
  const response=await fetch(url,{headers:{accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(timeoutMs)});
  if(!response.ok)throw new Error(`${new URL(url).hostname} returned HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}

async function fetchGoldApiSpot():Promise<SpotQuote>{
  const raw=await fetchJson("https://api.gold-api.com/price/XAU") as Record<string,unknown>;
  const price=positiveNumber(raw.price);
  if(!price)throw new Error("gold-api.com returned an invalid XAU price");
  const updatedAt=typeof raw.updatedAt==="string"&&Number.isFinite(Date.parse(raw.updatedAt))?raw.updatedAt:new Date().toISOString();
  return {price,updatedAt,source:"gold-api.com"};
}

async function fetchXausSpot():Promise<SpotQuote>{
  const raw=await fetchJson("https://xaus.com/api/v1/spot") as Record<string,unknown>;
  const price=positiveNumber(raw.spot_usd_oz)??positiveNumber((raw.xau as Record<string,unknown>|undefined)?.price);
  if(!price)throw new Error("xaus.com returned an invalid XAU price");
  return {price,updatedAt:new Date().toISOString(),source:"xaus.com fallback"};
}

async function fetchSpotWithFallback():Promise<SpotQuote>{
  try{return await fetchGoldApiSpot();}
  catch(primaryError){
    try{return await fetchXausSpot();}
    catch(fallbackError){
      const a=primaryError instanceof Error?primaryError.message:String(primaryError);
      const b=fallbackError instanceof Error?fallbackError.message:String(fallbackError);
      throw new Error(`Both spot sources failed. Primary: ${a}. Fallback: ${b}.`);
    }
  }
}

async function fetchFrankfurterAppFx():Promise<FxQuote>{
  const raw=await fetchJson("https://api.frankfurter.app/latest?from=USD&to=INR") as Record<string,unknown>;
  const rates=raw.rates&&typeof raw.rates==="object"?raw.rates as Record<string,unknown>:{};
  const rate=positiveNumber(rates.INR);
  if(!rate)throw new Error("Frankfurter returned an invalid USD/INR rate");
  return {rate,date:typeof raw.date==="string"?raw.date:new Date().toISOString().slice(0,10),source:"Frankfurter/ECB"};
}

async function fetchFrankfurterDevFx():Promise<FxQuote>{
  const raw=await fetchJson("https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR") as Record<string,unknown>;
  const rates=raw.rates&&typeof raw.rates==="object"?raw.rates as Record<string,unknown>:{};
  const rate=positiveNumber(rates.INR);
  if(!rate)throw new Error("Frankfurter fallback returned an invalid USD/INR rate");
  return {rate,date:typeof raw.date==="string"?raw.date:new Date().toISOString().slice(0,10),source:"Frankfurter/ECB fallback"};
}

async function fetchFxWithFallback():Promise<FxQuote>{
  try{return await fetchFrankfurterAppFx();}
  catch(primaryError){
    try{return await fetchFrankfurterDevFx();}
    catch(fallbackError){
      const a=primaryError instanceof Error?primaryError.message:String(primaryError);
      const b=fallbackError instanceof Error?fallbackError.message:String(fallbackError);
      throw new Error(`Both USD/INR sources failed. Primary: ${a}. Fallback: ${b}.`);
    }
  }
}

function indiaDate(iso:string){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(iso));
  const values=Object.fromEntries(parts.map(part=>[part.type,part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function normalizeState(value:GoldRatePipelineState|null,now:Date):GoldRatePipelineState{
  if(value&&value.version===1&&Array.isArray(value.observations)&&Array.isArray(value.validations))return value;
  return {version:1,startedAt:now.toISOString(),lastAttemptAt:null,lastSuccessAt:null,lastError:null,observations:[],validations:[]};
}

function trimObservations(observations:GoldRatePipelineObservation[],now:Date){
  const cutoff=now.getTime()-MAX_HISTORY_DAYS*86400000;
  return observations.filter(item=>Number.isFinite(Date.parse(item.at))&&Date.parse(item.at)>=cutoff).sort((a,b)=>a.at.localeCompare(b.at));
}

function upsertHourly(observations:GoldRatePipelineObservation[],observation:GoldRatePipelineObservation){
  const hour=observation.at.slice(0,13);
  return [...observations.filter(item=>item.at.slice(0,13)!==hour),observation].sort((a,b)=>a.at.localeCompare(b.at));
}

function dailyHistory(observations:GoldRatePipelineObservation[]):PublicHistoryPoint[]{
  const byDate=new Map<string,GoldRatePipelineObservation>();
  for(const observation of observations)byDate.set(indiaDate(observation.at),observation);
  return [...byDate.entries()].sort(([a],[b])=>a.localeCompare(b)).slice(-30).map(([date,observation])=>({date,rates:observation.rates}));
}

export function buildGoldRateValidationSummary(entries:GoldRateValidationEntry[],now=new Date()):GoldRateValidationSummary{
  const sorted=[...entries].sort((a,b)=>a.date.localeCompare(b.date));
  const diffs=sorted.map(item=>item.differencePct).filter(Number.isFinite);
  const first=sorted[0]?.date??null,last=sorted[sorted.length-1]?.date??null;
  const start=first?Date.parse(`${first}T00:00:00+05:30`):NaN;
  const elapsedDays=Number.isFinite(start)?Math.max(0,Math.floor((now.getTime()-start)/86400000)+1):0;
  const average=diffs.length?diffs.reduce((sum,value)=>sum+value,0)/diffs.length:null;
  const max=diffs.length?Math.max(...diffs):null;
  const minDays=minValidationDays(),minObservations=minValidationObservations();
  const passed=elapsedDays>=minDays&&diffs.length>=minObservations&&average!==null&&average<=MAX_VALIDATION_AVERAGE_PCT&&max!==null&&max<=MAX_VALIDATION_SINGLE_DAY_PCT;
  return {passed,firstValidationDate:first,lastValidationDate:last,elapsedDays,observations:diffs.length,minDays,minObservations,averageDifferencePct:average,maxDifferencePct:max,averageThresholdPct:MAX_VALIDATION_AVERAGE_PCT,singleDayThresholdPct:MAX_VALIDATION_SINGLE_DAY_PCT};
}

export function buildGoldRatePublicDataset(state:GoldRatePipelineState,now=new Date()){
  const observations=trimObservations(state.observations,now);
  const latest=observations[observations.length-1];
  if(!latest)return null;
  const nationalHistory=dailyHistory(observations);
  const premiums=configuredCityPremiums();
  const cities:Record<string,PublicMarket>={};
  for(const city of coreCities.slice(0,50)){
    const premium=cityPremium(city,premiums);
    cities[city.slug]={
      rates:applyPremium(latest.rates,premium),
      history:nationalHistory.map(point=>({date:point.date,rates:applyPremium(point.rates,premium)})),
    };
  }
  const validation=buildGoldRateValidationSummary(state.validations,now);
  const fallbackActive=Boolean(state.lastError&&state.lastAttemptAt&&state.lastSuccessAt&&state.lastAttemptAt>state.lastSuccessAt);
  return {
    updatedAt:latest.at,
    validatedSince:validation.firstValidationDate?`${validation.firstValidationDate}T00:00:00+05:30`:null,
    updateFrequency:"hourly spot refresh; daily USD/INR reference rate",
    source:{name:"Panchvani calculated estimate · Gold API + Frankfurter/ECB",url:"https://gold-api.com"},
    national:{rates:latest.rates,history:nationalHistory},
    cities,
    status:{
      mode:fallbackActive?"last-known":"fresh",
      message:fallbackActive?`Data temporarily unavailable, showing last known rate from ${latest.at}`:null,
      spotSource:latest.spotSource,
      fxSource:latest.fxSource,
      lastAttemptAt:state.lastAttemptAt,
      lastSuccessAt:state.lastSuccessAt,
      lastError:state.lastError,
    },
    calculation:{
      troyOunceGrams:TROY_OUNCE_GRAMS,
      importDutyRate:latest.importDutyRate,
      gstRate:latest.gstRate,
      cityPremiumModel:"documented regional estimate under 1%; configurable per city",
      validationBenchmark:"IBJA 999 manual benchmark; compared pre-GST because IBJA publishes benchmark rates exclusive of GST",
    },
    validation,
  };
}

export async function getStoredGoldRatePublicDataset(now=new Date()){
  const state=await readGoldRatePipelineState<GoldRatePipelineState>();
  return state?buildGoldRatePublicDataset(normalizeState(state,now),now):null;
}

export async function runGoldRatePipeline(now=new Date()){
  if(!getGoldRateStoreStatus().configured)throw new Error("Gold Rate KV storage is not configured.");
  const current=normalizeState(await readGoldRatePipelineState<GoldRatePipelineState>(),now);
  current.lastAttemptAt=now.toISOString();
  try{
    const [spot,fx]=await Promise.all([fetchSpotWithFallback(),fetchFxWithFallback()]);
    const duty=importDutyRate(),gst=gstRate();
    const calculated=calculateIndiaGoldRates(spot.price,fx.rate,duty,gst);
    const observation:GoldRatePipelineObservation={
      at:now.toISOString(),spotUpdatedAt:spot.updatedAt,spotSource:spot.source,spotUsdPerOz:spot.price,
      fxDate:fx.date,fxSource:fx.source,usdInr:fx.rate,importDutyRate:duty,gstRate:gst,
      spotInrPerGram:calculated.spotInrPerGram,benchmarkComparable24k:calculated.benchmarkComparable24k,rates:calculated.rates,
    };
    current.observations=trimObservations(upsertHourly(current.observations,observation),now);
    current.lastSuccessAt=observation.at;
    current.lastError=null;
    await writeGoldRatePipelineState(current);
    return {ok:true,dataset:buildGoldRatePublicDataset(current,now),error:null};
  }catch(error){
    current.lastError=error instanceof Error?error.message:String(error);
    current.observations=trimObservations(current.observations,now);
    await writeGoldRatePipelineState(current);
    return {ok:false,dataset:buildGoldRatePublicDataset(current,now),error:current.lastError};
  }
}

export async function recordGoldRateValidation(input:{date:string;ibja999Per10g:number;note?:string},now=new Date()){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(input.date))throw new Error("Validation date must use YYYY-MM-DD.");
  if(!Number.isFinite(input.ibja999Per10g)||input.ibja999Per10g<=0)throw new Error("IBJA 999 benchmark must be a positive per-10g value.");
  const state=normalizeState(await readGoldRatePipelineState<GoldRatePipelineState>(),now);
  const sameDay=state.observations.filter(item=>indiaDate(item.at)===input.date).sort((a,b)=>a.at.localeCompare(b.at));
  const observation=sameDay[sameDay.length-1];
  if(!observation)throw new Error(`No calculated Gold Rate observation exists for ${input.date}.`);
  const benchmark=input.ibja999Per10g/10;
  const calculated=observation.benchmarkComparable24k;
  const differencePct=Math.abs(calculated-benchmark)/benchmark*100;
  const entry:GoldRateValidationEntry={
    date:input.date,ibja999Per10g:input.ibja999Per10g,ibja999PerGram:benchmark,
    calculatedPreGst24kPerGram:calculated,differencePct,recordedAt:now.toISOString(),
    note:(input.note??"Manual IBJA 999 benchmark; IBJA source is not scraped by production pipeline.").slice(0,240),
  };
  state.validations=[...state.validations.filter(item=>item.date!==entry.date),entry].sort((a,b)=>a.date.localeCompare(b.date));
  await writeGoldRatePipelineState(state);
  return {entry,summary:buildGoldRateValidationSummary(state.validations,now)};
}

export async function getGoldRatePipelineStatus(now=new Date()){
  const store=getGoldRateStoreStatus();
  const state=normalizeState(await readGoldRatePipelineState<GoldRatePipelineState>(),now);
  return {
    store,
    startedAt:state.startedAt,lastAttemptAt:state.lastAttemptAt,lastSuccessAt:state.lastSuccessAt,lastError:state.lastError,
    hourlyObservations:state.observations.length,
    validation:buildGoldRateValidationSummary(state.validations,now),
    latest:state.observations[state.observations.length-1]??null,
  };
}
