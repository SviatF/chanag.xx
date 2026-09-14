import type {GscRow,GscSummary,GscTrafficSnapshot} from "./gsc";
import {getGscConnectionStatus} from "./gsc";
import type {GscSeoOsDataset} from "./gsc-seo-os";
import {writeGscDailySnapshot,type GscDailySnapshot} from "./gsc-daily-store";

const GOOGLE_TOKEN_URL="https://oauth2.googleapis.com/token";
const GSC_SCOPE="https://www.googleapis.com/auth/webmasters.readonly";
const TOKEN_TTL_MS=50*60*1000;
export const GSC_DAILY_REFRESH_QUERY_BUDGET=2;

let tokenCache:{expiresAt:number;value:string}|null=null;
let tokenInflight:Promise<string>|null=null;

type Counter={apiCalls:number;upstreamSubrequests:number;searchAnalyticsCalls:number};

function iso(date:Date){return date.toISOString().slice(0,10);}
function shift(date:Date,days:number){const next=new Date(date);next.setUTCDate(next.getUTCDate()+days);return next;}
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

async function query(counter:Counter,token:string,siteUrl:string,payload:{startDate:string;endDate:string;dimensions?:string[];rowLimit?:number}){
  counter.searchAnalyticsCalls++;
  const response=await countedFetch(counter,`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,{
    method:"POST",
    headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},
    body:JSON.stringify({...payload,dataState:"final",aggregationType:"auto"}),
    cache:"no-store",
  });
  if(!response.ok){const text=await response.text();throw new Error(`Search Console API failed (${response.status}): ${text.slice(0,240)}`);}
  return await response.json() as {rows?:GscRow[]};
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

function aggregateSummary(rows:GscRow[]):GscSummary{
  const clicks=rows.reduce((sum,row)=>sum+(row.clicks??0),0);
  const impressions=rows.reduce((sum,row)=>sum+(row.impressions??0),0);
  const weightedPosition=rows.reduce((sum,row)=>sum+(row.position??0)*(row.impressions??0),0);
  return {clicks,impressions,ctr:impressions?clicks/impressions:0,position:impressions?weightedPosition/impressions:0};
}

function summary(rows:GscRow[]|undefined):GscSummary{
  const row=rows?.[0];
  return row?{clicks:row.clicks??0,impressions:row.impressions??0,ctr:row.ctr??0,position:row.position??0}:{clicks:0,impressions:0,ctr:0,position:0};
}

export type GscDailyRefreshResult={snapshot:GscDailySnapshot;apiCalls:number;upstreamSubrequests:number;searchAnalyticsCalls:number};

export async function refreshGscDailySnapshot(asOf=new Date()):Promise<GscDailyRefreshResult>{
  const status=getGscConnectionStatus();
  if(!status.configured)throw new Error("Google Search Console service account is not configured.");
  const counter:Counter={apiCalls:0,upstreamSubrequests:0,searchAnalyticsCalls:0};
  const end=shift(asOf,-2);
  const current28Start=shift(end,-27);
  const previous28End=shift(current28Start,-1);
  const previous28Start=shift(previous28End,-27);
  const current7Start=shift(end,-6);
  const previous7End=shift(current7Start,-1);
  const previous7Start=shift(previous7End,-6);
  const current28Dates={startDate:iso(current28Start),endDate:iso(end)};
  const previous28Dates={startDate:iso(previous28Start),endDate:iso(previous28End)};
  const current7Dates={startDate:iso(current7Start),endDate:iso(end)};
  const previous7Dates={startDate:iso(previous7Start),endDate:iso(previous7End)};
  const token=await accessToken(counter);

  // Daily-only upstream work: one detailed 28d query and one compact previous-28d baseline.
  // 7d/previous-7d, pages, trends and query/page data are derived locally from the 28d rows.
  const currentRaw=await query(counter,token,status.siteUrl,{...current28Dates,dimensions:["date","query","page"],rowLimit:25000});
  const previousRaw=await query(counter,token,status.siteUrl,{...previous28Dates,rowLimit:1});
  const dated28=currentRaw.rows??[];
  const current28QueryPages=aggregateRows(dated28,[1,2]);
  const current28Queries=aggregateRows(current28QueryPages,[0]);
  const pages=aggregateRows(dated28,[2]).sort((a,b)=>b.impressions-a.impressions);
  const daily=aggregateRows(dated28,[0]).sort((a,b)=>(a.keys?.[0]??"").localeCompare(b.keys?.[0]??""));
  const current7Dated=dated28.filter(row=>{const date=row.keys?.[0]??"";return date>=current7Dates.startDate&&date<=current7Dates.endDate;});
  const previous7Dated=dated28.filter(row=>{const date=row.keys?.[0]??"";return date>=previous7Dates.startDate&&date<=previous7Dates.endDate;});
  const current7QueryPages=aggregateRows(current7Dated,[1,2]);
  const previous7QueryPages=aggregateRows(previous7Dated,[1,2]);
  const previousSummary=summary(previousRaw.rows);
  const refreshedAt=new Date().toISOString();

  const dataset:GscSeoOsDataset={
    siteUrl:status.siteUrl,
    generatedAt:refreshedAt,
    current7d:{...current7Dates,summary:aggregateSummary(current7QueryPages),queries:aggregateRows(current7QueryPages,[0]),queryPages:current7QueryPages},
    previous7d:{...previous7Dates,summary:aggregateSummary(previous7QueryPages),queries:aggregateRows(previous7QueryPages,[0]),queryPages:previous7QueryPages},
    current28d:{...current28Dates,summary:aggregateSummary(current28QueryPages),queries:current28Queries,queryPages:current28QueryPages,pages,countries:[],daily},
    previous28d:{...previous28Dates,summary:previousSummary},
  };
  const traffic:GscTrafficSnapshot={
    siteUrl:status.siteUrl,
    startDate:current28Dates.startDate,
    endDate:current28Dates.endDate,
    previousStartDate:previous28Dates.startDate,
    previousEndDate:previous28Dates.endDate,
    current:dataset.current28d.summary,
    previous:previousSummary,
    pages,
    queries:current28Queries,
    queryPages:current28QueryPages,
    daily,
  };
  const snapshot:GscDailySnapshot={version:1,refreshedAt,finalDataThrough:current28Dates.endDate,dataset,traffic};
  await writeGscDailySnapshot(snapshot);
  return {snapshot,apiCalls:counter.apiCalls,upstreamSubrequests:counter.upstreamSubrequests+1,searchAnalyticsCalls:counter.searchAnalyticsCalls};
}
