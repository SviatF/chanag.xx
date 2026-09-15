import type {GscRow,GscSummary,GscTrafficSnapshot} from "./gsc";
import {getGscConnectionStatus} from "./gsc";
import type {GscSeoOsDataset} from "./gsc-seo-os";
import {writeGscDailySnapshot,type GscDailySnapshot} from "./gsc-daily-store";

const GOOGLE_TOKEN_URL="https://oauth2.googleapis.com/token";
const GSC_SCOPE="https://www.googleapis.com/auth/webmasters.readonly";
const TOKEN_TTL_MS=50*60*1000;
const KYIV_TIME_ZONE="Europe/Kyiv";
export const GSC_DAILY_REFRESH_QUERY_BUDGET=2;

let tokenCache:{expiresAt:number;value:string}|null=null;
let tokenInflight:Promise<string>|null=null;

type Counter={apiCalls:number;upstreamSubrequests:number;searchAnalyticsCalls:number};
type GscDataState="final"|"all";
type GscApiResponse={rows?:GscRow[];metadata?:{first_incomplete_date?:string;first_incomplete_hour?:string}};

function iso(date:Date){return date.toISOString().slice(0,10);}
function shiftIsoDate(value:string,days:number){const next=new Date(`${value}T12:00:00.000Z`);next.setUTCDate(next.getUTCDate()+days);return iso(next);}
function kyivCalendarDate(date:Date){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:KYIV_TIME_ZONE,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
  const values=Object.fromEntries(parts.filter(part=>part.type!=="literal").map(part=>[part.type,part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function resolveGscSnapshotRanges(asOf=new Date()){
  // The business day is Europe/Kyiv, not UTC. At 00:00 Kyiv the scheduled event
  // can still belong to the previous UTC date, so derive the local calendar day
  // first and then request everything through the completed previous Kyiv day.
  const todayKyiv=kyivCalendarDate(asOf);
  const end=shiftIsoDate(todayKyiv,-1);
  const current28Start=shiftIsoDate(end,-27);
  const previous28End=shiftIsoDate(current28Start,-1);
  const previous28Start=shiftIsoDate(previous28End,-27);
  const current7Start=shiftIsoDate(end,-6);
  const previous7End=shiftIsoDate(current7Start,-1);
  const previous7Start=shiftIsoDate(previous7End,-6);
  return {
    current28Dates:{startDate:current28Start,endDate:end},
    previous28Dates:{startDate:previous28Start,endDate:previous28End},
    current7Dates:{startDate:current7Start,endDate:end},
    previous7Dates:{startDate:previous7Start,endDate:previous7End},
  };
}

function base64Url(input:Uint8Array|string){const bytes=typeof input==="string"?new TextEncoder().encode(input):input;let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
function pemToArrayBuffer(pem:string){const normalized=pem.replace(/\\n/g,"\n").trim();const base64=normalized.replace(/-----BEGIN PRIVATE KEY-----/g,"").replace(/-----END PRIVATE KEY-----/g,"").replace(/\s+/g,"");const binary=atob(base64);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}

async function countedFetch(counter:Counter,input:RequestInfo|URL,init?:RequestInit){counter.apiCalls++;counter.upstreamSubrequests++;return fetch(input,init);}

async function accessToken(counter:Counter){
  const now=Date.now();
  if(tokenCache&&tokenCache.expiresAt>now)return tokenCache.value;
  if(tokenInflight)return tokenInflight;
  const request=(async()=>{
    const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey=process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    if(!email||!privateKey)throw new Error("Google service account credentials are not configured.");
    const issued=Math.floor(Date.now()/1000);
    const header=base64Url(JSON.stringify({alg:"RS256",typ:"JWT"}));
    const payload=base64Url(JSON.stringify({iss:email,scope:GSC_SCOPE,aud:GOOGLE_TOKEN_URL,iat:issued,exp:issued+3600}));
    const unsigned=`${header}.${payload}`;
    const key=await crypto.subtle.importKey("pkcs8",pemToArrayBuffer(privateKey),{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
    const signature=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(unsigned));
    const assertion=`${unsigned}.${base64Url(new Uint8Array(signature))}`;
    const response=await countedFetch(counter,GOOGLE_TOKEN_URL,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion}),cache:"no-store"});
    if(!response.ok){const text=await response.text();throw new Error(`Google service-account auth failed (${response.status}): ${text.slice(0,240)}`);}
    const json=await response.json() as {access_token?:string};
    if(!json.access_token)throw new Error("Google service-account auth returned no access token.");
    tokenCache={value:json.access_token,expiresAt:Date.now()+TOKEN_TTL_MS};
    return json.access_token;
  })().finally(()=>{tokenInflight=null;});
  tokenInflight=request;
  return request;
}

async function query(counter:Counter,token:string,siteUrl:string,payload:{startDate:string;endDate:string;dimensions?:string[];rowLimit?:number;dataState?:GscDataState}){
  counter.searchAnalyticsCalls++;
  const {dataState="final",...requestPayload}=payload;
  const response=await countedFetch(counter,`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,{
    method:"POST",
    headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},
    body:JSON.stringify({...requestPayload,dataState,aggregationType:"auto"}),
    cache:"no-store",
  });
  if(!response.ok){const text=await response.text();throw new Error(`Search Console API failed (${response.status}): ${text.slice(0,240)}`);}
  return await response.json() as GscApiResponse;
}

function aggregateRows(rows:GscRow[],keyIndexes:number[]):GscRow[]{
  const map=new Map<string,{keys:string[];clicks:number;impressions:number;weightedPosition:number}>();
  for(const row of rows){
    const keys=keyIndexes.map(index=>row.keys?.[index]??"");
    if(keys.some(value=>!value))continue;
    const id=JSON.stringify(keys);
    const current=map.get(id)??{keys,clicks:0,impressions:0,weightedPosition:0};
    current.clicks+=row.clicks??0;
    current.impressions+=row.impressions??0;
    current.weightedPosition+=(row.position??0)*(row.impressions??0);
    map.set(id,current);
  }
  return [...map.values()].map(row=>({keys:row.keys,clicks:row.clicks,impressions:row.impressions,ctr:row.impressions?row.clicks/row.impressions:0,position:row.impressions?row.weightedPosition/row.impressions:0}));
}

export function summarizeGscRows(rows:GscRow[]):GscSummary{
  const clicks=rows.reduce((sum,row)=>sum+(row.clicks??0),0);
  const impressions=rows.reduce((sum,row)=>sum+(row.impressions??0),0);
  const weightedPosition=rows.reduce((sum,row)=>sum+(row.position??0)*(row.impressions??0),0);
  return {clicks,impressions,ctr:impressions?clicks/impressions:0,position:impressions?weightedPosition/impressions:0};
}

function rowsInRange(rows:GscRow[],startDate:string,endDate:string){
  return rows.filter(row=>{const date=row.keys?.[0]??"";return date>=startDate&&date<=endDate;});
}

export type GscDailyRefreshResult={snapshot:GscDailySnapshot;apiCalls:number;upstreamSubrequests:number;searchAnalyticsCalls:number};

export async function refreshGscDailySnapshot(asOf=new Date()):Promise<GscDailyRefreshResult>{
  const status=getGscConnectionStatus();
  if(!status.configured)throw new Error("Google Search Console service account is not configured.");
  const counter:Counter={apiCalls:0,upstreamSubrequests:0,searchAnalyticsCalls:0};
  const {current28Dates,previous28Dates,current7Dates,previous7Dates}=resolveGscSnapshotRanges(asOf);
  const token=await accessToken(counter);

  // Keep the upstream Search Analytics budget at exactly two calls, but split
  // responsibilities correctly:
  // 1) property-level daily traffic over 56 days (no query dimension) gives the
  //    same headline totals class as the GSC performance graph, including traffic
  //    that cannot be exposed as named queries;
  // 2) current-28d date/query/page detail powers SEO decisions, page/query tables,
  //    cannibalization and internal-link evidence. Detail rows must never be used
  //    as the site's headline traffic total because query-level data is filtered.
  const trafficRaw=await query(counter,token,status.siteUrl,{startDate:previous28Dates.startDate,endDate:current28Dates.endDate,dimensions:["date"],rowLimit:1000,dataState:"all"});
  const detailRaw=await query(counter,token,status.siteUrl,{...current28Dates,dimensions:["date","query","page"],rowLimit:25000,dataState:"all"});

  const trafficDaily=aggregateRows(trafficRaw.rows??[],[0]).sort((a,b)=>(a.keys?.[0]??"").localeCompare(b.keys?.[0]??""));
  const currentTrafficDaily=rowsInRange(trafficDaily,current28Dates.startDate,current28Dates.endDate);
  const previousTrafficDaily=rowsInRange(trafficDaily,previous28Dates.startDate,previous28Dates.endDate);
  const current7TrafficDaily=rowsInRange(trafficDaily,current7Dates.startDate,current7Dates.endDate);
  const previous7TrafficDaily=rowsInRange(trafficDaily,previous7Dates.startDate,previous7Dates.endDate);

  const datedDetail=detailRaw.rows??[];
  const current28QueryPages=aggregateRows(datedDetail,[1,2]);
  const current28Queries=aggregateRows(current28QueryPages,[0]);
  const pages=aggregateRows(datedDetail,[2]).sort((a,b)=>b.impressions-a.impressions);
  const current7Detail=rowsInRange(datedDetail,current7Dates.startDate,current7Dates.endDate);
  const previous7Detail=rowsInRange(datedDetail,previous7Dates.startDate,previous7Dates.endDate);
  const current7QueryPages=aggregateRows(current7Detail,[1,2]);
  const previous7QueryPages=aggregateRows(previous7Detail,[1,2]);

  const current28Summary=summarizeGscRows(currentTrafficDaily);
  const previous28Summary=summarizeGscRows(previousTrafficDaily);
  const current7Summary=summarizeGscRows(current7TrafficDaily);
  const previous7Summary=summarizeGscRows(previous7TrafficDaily);
  const refreshedAt=new Date().toISOString();

  const dataset:GscSeoOsDataset={
    siteUrl:status.siteUrl,
    generatedAt:refreshedAt,
    current7d:{...current7Dates,summary:current7Summary,queries:aggregateRows(current7QueryPages,[0]),queryPages:current7QueryPages},
    previous7d:{...previous7Dates,summary:previous7Summary,queries:aggregateRows(previous7QueryPages,[0]),queryPages:previous7QueryPages},
    current28d:{...current28Dates,summary:current28Summary,queries:current28Queries,queryPages:current28QueryPages,pages,countries:[],daily:currentTrafficDaily},
    previous28d:{...previous28Dates,summary:previous28Summary},
  };
  const traffic:GscTrafficSnapshot={
    siteUrl:status.siteUrl,
    startDate:current28Dates.startDate,
    endDate:current28Dates.endDate,
    previousStartDate:previous28Dates.startDate,
    previousEndDate:previous28Dates.endDate,
    current:current28Summary,
    previous:previous28Summary,
    pages,
    queries:current28Queries,
    queryPages:current28QueryPages,
    daily:currentTrafficDaily,
  };
  const firstIncompleteDate=trafficRaw.metadata?.first_incomplete_date??detailRaw.metadata?.first_incomplete_date??null;
  const finalDataThrough=firstIncompleteDate?shiftIsoDate(firstIncompleteDate,-1):current28Dates.endDate;
  const snapshot:GscDailySnapshot={
    version:1,
    refreshedAt,
    finalDataThrough,
    requestedDataThrough:current28Dates.endDate,
    firstIncompleteDate,
    dataset,
    traffic,
  };
  await writeGscDailySnapshot(snapshot);
  return {snapshot,apiCalls:counter.apiCalls,upstreamSubrequests:counter.upstreamSubrequests+1,searchAnalyticsCalls:counter.searchAnalyticsCalls};
}
