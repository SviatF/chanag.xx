import type {GscRow,GscSummary} from "./gsc";
import {getGscConnectionStatus} from "./gsc";

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

const GOOGLE_TOKEN_URL="https://oauth2.googleapis.com/token";
const GSC_SCOPE="https://www.googleapis.com/auth/webmasters.readonly";
const CACHE_TTL_MS=6*60*60*1000;
const FORCE_REFRESH_COOLDOWN_MS=30*60*1000;

let cached:{expiresAt:number;builtAt:number;value:GscSeoOsDataset}|null=null;
let inflight:Promise<GscSeoOsDataset>|null=null;

function iso(date:Date){return date.toISOString().slice(0,10);}
function shift(date:Date,days:number){const next=new Date(date);next.setUTCDate(next.getUTCDate()+days);return next;}
function base64Url(input:Uint8Array|string){const bytes=typeof input==="string"?new TextEncoder().encode(input):input;let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
function pemToArrayBuffer(pem:string){const normalized=pem.replace(/\\n/g,"\n").trim();const base64=normalized.replace(/-----BEGIN PRIVATE KEY-----/g,"").replace(/-----END PRIVATE KEY-----/g,"").replace(/\s+/g,"");const binary=atob(base64);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}

async function accessToken(){
  const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey=process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if(!email||!privateKey)throw new Error("Google service account credentials are not configured.");
  const now=Math.floor(Date.now()/1000);
  const header=base64Url(JSON.stringify({alg:"RS256",typ:"JWT"}));
  const payload=base64Url(JSON.stringify({iss:email,scope:GSC_SCOPE,aud:GOOGLE_TOKEN_URL,iat:now,exp:now+3600}));
  const unsigned=`${header}.${payload}`;
  const key=await crypto.subtle.importKey("pkcs8",pemToArrayBuffer(privateKey),{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
  const signature=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(unsigned));
  const assertion=`${unsigned}.${base64Url(new Uint8Array(signature))}`;
  const response=await fetch(GOOGLE_TOKEN_URL,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion}),cache:"no-store"});
  if(!response.ok){const text=await response.text();throw new Error(`Google service-account auth failed (${response.status}): ${text.slice(0,240)}`);}
  const json=await response.json() as {access_token?:string};
  if(!json.access_token)throw new Error("Google service-account auth returned no access token.");
  return json.access_token;
}

async function query(token:string,siteUrl:string,payload:{startDate:string;endDate:string;dimensions?:string[];rowLimit?:number}){
  const response=await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,{
    method:"POST",
    headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},
    body:JSON.stringify({...payload,dataState:"final",aggregationType:"auto"}),
    cache:"no-store",
  });
  if(!response.ok){const text=await response.text();throw new Error(`Search Console API failed (${response.status}): ${text.slice(0,240)}`);}
  return await response.json() as {rows?:GscRow[]};
}

function aggregateSummary(rows:GscRow[]|undefined):GscSummary{
  const items=rows??[];
  const clicks=items.reduce((sum,row)=>sum+(row.clicks??0),0);
  const impressions=items.reduce((sum,row)=>sum+(row.impressions??0),0);
  const weightedPosition=items.reduce((sum,row)=>sum+(row.position??0)*(row.impressions??0),0);
  return {clicks,impressions,ctr:impressions?clicks/impressions:0,position:impressions?weightedPosition/impressions:0};
}
function summary(rows:GscRow[]|undefined):GscSummary{const row=rows?.[0];return row?{clicks:row.clicks??0,impressions:row.impressions??0,ctr:row.ctr??0,position:row.position??0}:{clicks:0,impressions:0,ctr:0,position:0};}

async function buildDataset():Promise<GscSeoOsDataset>{
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
  const token=await accessToken();

  const current7Dates={startDate:iso(current7Start),endDate:iso(end)};
  const previous7Dates={startDate:iso(previous7Start),endDate:iso(previous7End)};
  const current28Dates={startDate:iso(current28Start),endDate:iso(end)};
  const previous28Dates={startDate:iso(previous28Start),endDate:iso(previous28End)};

  // Cost-safe payload: Queries + Command Center only need query and query/page rows.
  // This deliberately avoids extra page/country/daily calls on every cache miss.
  const [
    current7Queries,current7QueryPages,
    previous7Queries,previous7QueryPages,
    current28Queries,current28QueryPages,
    previous28Summary,
  ]=await Promise.all([
    query(token,status.siteUrl,{...current7Dates,dimensions:["query"],rowLimit:10000}),
    query(token,status.siteUrl,{...current7Dates,dimensions:["query","page"],rowLimit:25000}),
    query(token,status.siteUrl,{...previous7Dates,dimensions:["query"],rowLimit:10000}),
    query(token,status.siteUrl,{...previous7Dates,dimensions:["query","page"],rowLimit:25000}),
    query(token,status.siteUrl,{...current28Dates,dimensions:["query"],rowLimit:10000}),
    query(token,status.siteUrl,{...current28Dates,dimensions:["query","page"],rowLimit:25000}),
    query(token,status.siteUrl,{...previous28Dates,rowLimit:1}),
  ]);

  const current7Rows=current7Queries.rows??[];
  const previous7Rows=previous7Queries.rows??[];
  const current28Rows=current28Queries.rows??[];

  return {
    siteUrl:status.siteUrl,
    generatedAt:new Date().toISOString(),
    current7d:{...current7Dates,summary:aggregateSummary(current7Rows),queries:current7Rows,queryPages:current7QueryPages.rows??[]},
    previous7d:{...previous7Dates,summary:aggregateSummary(previous7Rows),queries:previous7Rows,queryPages:previous7QueryPages.rows??[]},
    current28d:{...current28Dates,summary:aggregateSummary(current28Rows),queries:current28Rows,queryPages:current28QueryPages.rows??[],pages:[],countries:[],daily:[]},
    previous28d:{...previous28Dates,summary:summary(previous28Summary.rows)},
  };
}

export async function getGscSeoOsDataset(force=false):Promise<GscSeoOsDataset>{
  const now=Date.now();
  if(cached){
    if(force&&now-cached.builtAt<FORCE_REFRESH_COOLDOWN_MS)return cached.value;
    if(!force&&cached.expiresAt>now)return cached.value;
  }
  if(inflight)return inflight;
  const request=buildDataset().then(value=>{
    const builtAt=Date.now();
    cached={value,builtAt,expiresAt:builtAt+CACHE_TTL_MS};
    return value;
  }).finally(()=>{inflight=null;});
  inflight=request;
  return request;
}
