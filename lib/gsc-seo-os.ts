import type {GscRow,GscSummary} from "./gsc";
import {getGscConnectionStatus} from "./gsc";
import {ADMIN_PROVIDER_TTL_MS,cachedCoalesced,type RuntimeCacheStatus} from "./worker-data-cache";

export type GscSeoRange={
  startDate:string;
  endDate:string;
  summary:GscSummary;
  queries:GscRow[];
  queryPages:GscRow[];
};

export type GscSeoOsDataset={
  siteUrl:string;
  generatedAt:string;
  current7d:GscSeoRange;
  previous7d:GscSeoRange;
  current28d:GscSeoRange&{pages:GscRow[];countries:GscRow[];daily:GscRow[]};
  previous28d:{startDate:string;endDate:string;summary:GscSummary};
};

export type GscSeoRuntimeMeta={
  cacheStatus:RuntimeCacheStatus;
  apiCalls:number;
  upstreamSubrequests:number;
  cacheOperations:number;
};

export const GSC_COMMAND_CENTER_QUERY_BUDGET=2;
const GOOGLE_TOKEN_URL="https://oauth2.googleapis.com/token";
const GSC_SCOPE="https://www.googleapis.com/auth/webmasters.readonly";
const CACHE_KEY="gsc:seo-command-center:v4";
const TOKEN_TTL_MS=50*60*1000;

let tokenCache:{expiresAt:number;value:string}|null=null;
let tokenInflight:Promise<string>|null=null;

type Counter={apiCalls:number;upstreamSubrequests:number};

function iso(date:Date){return date.toISOString().slice(0,10);}
function shift(date:Date,days:number){const next=new Date(date);next.setUTCDate(next.getUTCDate()+days);return next;}
function base64Url(input:Uint8Array|string){const bytes=typeof input==="string"?new TextEncoder().encode(input):input;let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
function pemToArrayBuffer(pem:string){const normalized=pem.replace(/\\n/g,"\n").trim();const base64=normalized.replace(/-----BEGIN PRIVATE KEY-----/g,"").replace(/-----END PRIVATE KEY-----/g,"").replace(/\s+/g,"");const binary=atob(base64);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}

async function countedFetch(counter:Counter,input:RequestInfo|URL,init?:RequestInit){
  counter.apiCalls+=1;
  counter.upstreamSubrequests+=1;
  return fetch(input,init);
}

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
  return [...map.values()].map(row=>({
    keys:row.keys,
    clicks:row.clicks,
    impressions:row.impressions,
    ctr:row.impressions?row.clicks/row.impressions:0,
    position:row.impressions?row.weightedPosition/row.impressions:0,
  }));
}

function aggregateSummary(rows:GscRow[]):GscSummary{
  const clicks=rows.reduce((sum,row)=>sum+(row.clicks??0),0);
  const impressions=rows.reduce((sum,row)=>sum+(row.impressions??0),0);
  const weightedPosition=rows.reduce((sum,row)=>sum+(row.position??0)*(row.impressions??0),0);
  return {clicks,impressions,ctr:impressions?clicks/impressions:0,position:impressions?weightedPosition/impressions:0};
}

async function buildDataset(counter:Counter):Promise<GscSeoOsDataset>{
  const status=getGscConnectionStatus();
  if(!status.configured)throw new Error("Google Search Console service account is not configured.");

  const today=new Date();
  const end=shift(today,-2);
  const current7Start=shift(end,-6);
  const previous7End=shift(current7Start,-1);
  const previous7Start=shift(previous7End,-6);
  const current28Start=shift(end,-27);
  const previous28End=shift(current28Start,-1);
  const previous28Start=shift(previous28End,-27);
  const token=await accessToken(counter);

  const current7Dates={startDate:iso(current7Start),endDate:iso(end)};
  const previous7Dates={startDate:iso(previous7Start),endDate:iso(previous7End)};
  const current28Dates={startDate:iso(current28Start),endDate:iso(end)};

  // Exactly two GSC data calls on a cold Command Center load:
  // 1) a compact 7-day query/page slice;
  // 2) a dated 28-day query/page slice. Browser-side intelligence derives all
  // filters, scoring, trends, cannibalization and sorting from this shared payload.
  const current7Raw=await query(counter,token,status.siteUrl,{...current7Dates,dimensions:["query","page"],rowLimit:25000});
  const current28Raw=await query(counter,token,status.siteUrl,{...current28Dates,dimensions:["date","query","page"],rowLimit:25000});

  const rows7=current7Raw.rows??[];
  const dated28=current28Raw.rows??[];
  const current7QueryPages=aggregateRows(rows7,[0,1]);
  const current7Queries=aggregateRows(current7QueryPages,[0]);
  const current28QueryPages=aggregateRows(dated28,[1,2]);
  const current28Queries=aggregateRows(current28QueryPages,[0]);
  const previous7Dated=dated28.filter(row=>{const date=row.keys?.[0]??"";return date>=previous7Dates.startDate&&date<=previous7Dates.endDate;});
  const previous7QueryPages=aggregateRows(previous7Dated,[1,2]);
  const previous7Queries=aggregateRows(previous7QueryPages,[0]);
  const pages=aggregateRows(dated28,[2]).sort((a,b)=>b.impressions-a.impressions);
  const daily=aggregateRows(dated28,[0]).sort((a,b)=>(a.keys?.[0]??"").localeCompare(b.keys?.[0]??""));

  return {
    siteUrl:status.siteUrl,
    generatedAt:new Date().toISOString(),
    current7d:{...current7Dates,summary:aggregateSummary(current7QueryPages),queries:current7Queries,queryPages:current7QueryPages},
    previous7d:{...previous7Dates,summary:aggregateSummary(previous7QueryPages),queries:previous7Queries,queryPages:previous7QueryPages},
    current28d:{...current28Dates,summary:aggregateSummary(current28QueryPages),queries:current28Queries,queryPages:current28QueryPages,pages,countries:[],daily},
    // Deliberately not fetched in the Command Center path. It is retained in the
    // shape for compatibility, but no extra historical API request is spent on it.
    previous28d:{startDate:iso(previous28Start),endDate:iso(previous28End),summary:{clicks:0,impressions:0,ctr:0,position:0}},
  };
}

export async function getGscSeoOsDatasetWithMeta(force=false):Promise<{dataset:GscSeoOsDataset;meta:GscSeoRuntimeMeta}>{
  const counter:Counter={apiCalls:0,upstreamSubrequests:0};
  const cached=await cachedCoalesced(CACHE_KEY,ADMIN_PROVIDER_TTL_MS.gsc,()=>buildDataset(counter),{force});
  return {
    dataset:cached.value,
    meta:{cacheStatus:cached.cacheStatus,apiCalls:counter.apiCalls,upstreamSubrequests:counter.upstreamSubrequests,cacheOperations:cached.cacheOperations},
  };
}

export async function getGscSeoOsDataset(force=false):Promise<GscSeoOsDataset>{
  return (await getGscSeoOsDatasetWithMeta(force)).dataset;
}
