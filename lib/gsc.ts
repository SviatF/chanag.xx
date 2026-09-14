import {ADMIN_PROVIDER_TTL_MS,cachedCoalesced} from "./worker-data-cache";

export type GscRow={keys?:string[];clicks:number;impressions:number;ctr:number;position:number;};
export type GscSummary={clicks:number;impressions:number;ctr:number;position:number;};
export type GscTrafficSnapshot={siteUrl:string;startDate:string;endDate:string;previousStartDate:string;previousEndDate:string;current:GscSummary;previous:GscSummary;pages:GscRow[];queries:GscRow[];queryPages:GscRow[];daily:GscRow[];};
export type GscOutcomeWindow={startDate:string;endDate:string;clicks:number;impressions:number;ctr:number;position:number;topLanding:string|null;};
export type GscOutcomeComparison={query:string;pre:GscOutcomeWindow;post:GscOutcomeWindow;};
export type GscOutcomeRequest={key:string;query:string;shippedAt:string;days:14|28|56;};
export type GscIndexInspection={inspectedUrl:string;verdict:string;coverageState:string;robotsTxtState:string;indexingState:string;lastCrawlTime:string|null;pageFetchState:string;googleCanonical:string|null;userCanonical:string|null;crawledAs:string|null;sitemaps:string[];referringUrls:string[];inspectedAt:string;};

const GOOGLE_TOKEN_URL="https://oauth2.googleapis.com/token";
const GSC_SCOPE="https://www.googleapis.com/auth/webmasters.readonly";
const TOKEN_TTL_MS=50*60*1000;
let tokenCache:{expiresAt:number;value:string}|null=null;
let tokenInflight:Promise<string>|null=null;

export function getGscConnectionStatus(){
  const required={GOOGLE_SERVICE_ACCOUNT_EMAIL:Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL),GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),GSC_SITE_URL:Boolean(process.env.GSC_SITE_URL)};
  return {configured:Boolean(required.GOOGLE_SERVICE_ACCOUNT_EMAIL&&required.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),required,siteUrl:process.env.GSC_SITE_URL??"sc-domain:panchvani.com",authMode:"service-account" as const};
}

function iso(date:Date){return date.toISOString().slice(0,10);}
function shift(date:Date,days:number){const next=new Date(date);next.setUTCDate(next.getUTCDate()+days);return next;}
function base64Url(input:Uint8Array|string){const bytes=typeof input==="string"?new TextEncoder().encode(input):input;let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}
function pemToArrayBuffer(pem:string){const normalized=pem.replace(/\\n/g,"\n").trim();const base64=normalized.replace(/-----BEGIN PRIVATE KEY-----/g,"").replace(/-----END PRIVATE KEY-----/g,"").replace(/\s+/g,"");const binary=atob(base64);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}

async function createServiceAccountJwt(){
  const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;const privateKey=process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if(!email||!privateKey)throw new Error("Google service account credentials are not configured.");
  const now=Math.floor(Date.now()/1000),header=base64Url(JSON.stringify({alg:"RS256",typ:"JWT"})),payload=base64Url(JSON.stringify({iss:email,scope:GSC_SCOPE,aud:GOOGLE_TOKEN_URL,iat:now,exp:now+3600})),unsigned=`${header}.${payload}`;
  const key=await crypto.subtle.importKey("pkcs8",pemToArrayBuffer(privateKey),{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
  const signature=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

async function accessToken(){
  const now=Date.now();if(tokenCache&&tokenCache.expiresAt>now)return tokenCache.value;if(tokenInflight)return tokenInflight;
  const request=(async()=>{
    const status=getGscConnectionStatus();if(!status.configured)throw new Error("Google Search Console service account is not configured.");
    const assertion=await createServiceAccountJwt();
    const response=await fetch(GOOGLE_TOKEN_URL,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion}),cache:"no-store"});
    if(!response.ok){const text=await response.text();throw new Error(`Google service-account auth failed (${response.status}): ${text.slice(0,240)}`);}
    const json=await response.json() as {access_token?:string};if(!json.access_token)throw new Error("Google service-account auth returned no access token.");
    tokenCache={value:json.access_token,expiresAt:Date.now()+TOKEN_TTL_MS};return json.access_token;
  })().finally(()=>{tokenInflight=null;});tokenInflight=request;return request;
}

type SearchAnalyticsFilter={dimension:"query"|"page";operator:"equals"|"contains";expression:string};
async function query(token:string,siteUrl:string,payload:{startDate:string;endDate:string;dimensions?:string[];rowLimit?:number;filters?:SearchAnalyticsFilter[];}){
  const {filters,...rest}=payload;
  const response=await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},body:JSON.stringify({...rest,...(filters?.length?{dimensionFilterGroups:[{groupType:"and",filters}]}:{}),dataState:"final",aggregationType:"auto"}),cache:"no-store"});
  if(!response.ok){const text=await response.text();throw new Error(`Search Console API failed (${response.status}): ${text.slice(0,240)}`);}return await response.json() as {rows?:GscRow[]};
}

function summary(rows:GscRow[]|undefined):GscSummary{const row=rows?.[0];return row?{clicks:row.clicks??0,impressions:row.impressions??0,ctr:row.ctr??0,position:row.position??0}:{clicks:0,impressions:0,ctr:0,position:0};}
function aggregateSummary(rows:GscRow[]):GscSummary{const clicks=rows.reduce((s,r)=>s+(r.clicks??0),0),impressions=rows.reduce((s,r)=>s+(r.impressions??0),0),weighted=rows.reduce((s,r)=>s+(r.position??0)*(r.impressions??0),0);return {clicks,impressions,ctr:impressions?clicks/impressions:0,position:impressions?weighted/impressions:0};}
function aggregateRows(rows:GscRow[],indexes:number[]):GscRow[]{const map=new Map<string,{keys:string[];clicks:number;impressions:number;weighted:number}>();for(const row of rows){const keys=indexes.map(i=>row.keys?.[i]??"");if(keys.some(v=>!v))continue;const id=JSON.stringify(keys),a=map.get(id)??{keys,clicks:0,impressions:0,weighted:0};a.clicks+=row.clicks??0;a.impressions+=row.impressions??0;a.weighted+=(row.position??0)*(row.impressions??0);map.set(id,a);}return [...map.values()].map(a=>({keys:a.keys,clicks:a.clicks,impressions:a.impressions,ctr:a.impressions?a.clicks/a.impressions:0,position:a.impressions?a.weighted/a.impressions:0}));}
function aggregateOutcomeWindow(startDate:string,endDate:string,rows:GscRow[]|undefined):GscOutcomeWindow{const items=rows??[];const clicks=items.reduce((sum,row)=>sum+(row.clicks??0),0);const impressions=items.reduce((sum,row)=>sum+(row.impressions??0),0);const weightedPosition=items.reduce((sum,row)=>sum+(row.position??0)*(row.impressions??0),0);const top=items.slice().sort((a,b)=>(b.impressions??0)-(a.impressions??0)||(b.clicks??0)-(a.clicks??0))[0];return {startDate,endDate,clicks,impressions,ctr:impressions?clicks/impressions:0,position:impressions?weightedPosition/impressions:0,topLanding:top?.keys?.[1]??null};}

export function gscCheckpointWindow(shippedAt:string,days:14|28|56){const shipped=new Date(`${shippedAt.slice(0,10)}T00:00:00Z`);if(Number.isNaN(shipped.getTime()))throw new Error("Invalid shippedAt date for GSC checkpoint.");const preEnd=shift(shipped,-1),preStart=shift(shipped,-days),postStart=new Date(shipped),postEnd=shift(shipped,days-1);return {preStart:iso(preStart),preEnd:iso(preEnd),postStart:iso(postStart),postEnd:iso(postEnd)};}
export function isGscCheckpointReady(shippedAt:string,days:14|28|56,asOf=new Date()){const {postEnd}=gscCheckpointWindow(shippedAt,days),finalAvailableEnd=iso(shift(asOf,-2));return finalAvailableEnd>=postEnd;}

export async function getGscOutcomeComparisons(requests:GscOutcomeRequest[]):Promise<Record<string,GscOutcomeComparison>>{
  if(!requests.length)return {};const status=getGscConnectionStatus();if(!status.configured)throw new Error("Google Search Console service account is not configured.");const token=await accessToken();const output:Record<string,GscOutcomeComparison>={};
  // Deliberately sequential: outcome checks are scheduled/manual work and must not
  // fan out 2×N simultaneous upstream requests.
  for(const request of requests){const window=gscCheckpointWindow(request.shippedAt,request.days),filters:SearchAnalyticsFilter[]=[{dimension:"query",operator:"equals",expression:request.query}];const preRaw=await query(token,status.siteUrl,{startDate:window.preStart,endDate:window.preEnd,dimensions:["query","page"],rowLimit:5000,filters});const postRaw=await query(token,status.siteUrl,{startDate:window.postStart,endDate:window.postEnd,dimensions:["query","page"],rowLimit:5000,filters});output[`${request.key}:${request.days}`]={query:request.query,pre:aggregateOutcomeWindow(window.preStart,window.preEnd,preRaw.rows),post:aggregateOutcomeWindow(window.postStart,window.postEnd,postRaw.rows)};}
  return output;
}

async function buildGscTrafficSnapshot():Promise<GscTrafficSnapshot>{
  const status=getGscConnectionStatus();if(!status.configured)throw new Error("Google Search Console service account is not configured.");
  const today=new Date(),end=shift(today,-2),start=shift(end,-27),previousEnd=shift(start,-1),previousStart=shift(previousEnd,-27),startDate=iso(start),endDate=iso(end),previousStartDate=iso(previousStart),previousEndDate=iso(previousEnd),token=await accessToken();
  // One detailed current-period call derives pages, queries, query/page and daily
  // locally; one compact call supplies the previous-period baseline.
  const detailed=await query(token,status.siteUrl,{startDate,endDate,dimensions:["date","query","page"],rowLimit:25000});
  const previousRaw=await query(token,status.siteUrl,{startDate:previousStartDate,endDate:previousEndDate,rowLimit:1});
  const raw=detailed.rows??[];
  const queryPages=aggregateRows(raw,[1,2]);
  return {siteUrl:status.siteUrl,startDate,endDate,previousStartDate,previousEndDate,current:aggregateSummary(raw),previous:summary(previousRaw.rows),pages:aggregateRows(raw,[2]).sort((a,b)=>b.impressions-a.impressions),queries:aggregateRows(queryPages,[0]).sort((a,b)=>b.impressions-a.impressions),queryPages,daily:aggregateRows(raw,[0]).sort((a,b)=>(a.keys?.[0]??"").localeCompare(b.keys?.[0]??""))};
}

export async function getGscTrafficSnapshot():Promise<GscTrafficSnapshot>{return (await cachedCoalesced("gsc:traffic:28d:v3",ADMIN_PROVIDER_TTL_MS.gsc,buildGscTrafficSnapshot)).value;}

type RawIndexStatus={verdict?:string;coverageState?:string;robotsTxtState?:string;indexingState?:string;lastCrawlTime?:string;pageFetchState?:string;googleCanonical?:string;userCanonical?:string;crawledAs?:string;sitemap?:string[];referringUrls?:string[];};
type RawInspectionResponse={inspectionResult?:{indexStatusResult?:RawIndexStatus}};
async function inspectIndexUrl(token:string,siteUrl:string,inspectionUrl:string):Promise<GscIndexInspection>{const response=await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},body:JSON.stringify({inspectionUrl,siteUrl,languageCode:"en-US"}),cache:"no-store"});if(!response.ok){const text=await response.text();throw new Error(`Search Console URL Inspection failed for ${inspectionUrl} (${response.status}): ${text.slice(0,220)}`);}const json=await response.json() as RawInspectionResponse,row=json.inspectionResult?.indexStatusResult??{};return {inspectedUrl:inspectionUrl,verdict:row.verdict??"VERDICT_UNSPECIFIED",coverageState:row.coverageState??"Unknown",robotsTxtState:row.robotsTxtState??"ROBOTS_TXT_STATE_UNSPECIFIED",indexingState:row.indexingState??"INDEXING_STATE_UNSPECIFIED",lastCrawlTime:row.lastCrawlTime??null,pageFetchState:row.pageFetchState??"PAGE_FETCH_STATE_UNSPECIFIED",googleCanonical:row.googleCanonical??null,userCanonical:row.userCanonical??null,crawledAs:row.crawledAs??null,sitemaps:row.sitemap??[],referringUrls:row.referringUrls??[],inspectedAt:new Date().toISOString()};}

export async function getGscUrlInspections(urls:string[],concurrency=4):Promise<{rows:GscIndexInspection[];errors:string[]}>{const unique=[...new Set(urls.map(url=>url.trim()).filter(Boolean))];if(!unique.length)return {rows:[],errors:[]};const status=getGscConnectionStatus();if(!status.configured)throw new Error("Google Search Console service account is not configured.");const token=await accessToken(),rows:GscIndexInspection[]=[],errors:string[]=[];const width=Math.max(1,Math.min(8,Math.floor(concurrency)));for(let index=0;index<unique.length;index+=width){const chunk=unique.slice(index,index+width),results=await Promise.allSettled(chunk.map(url=>inspectIndexUrl(token,status.siteUrl,url)));results.forEach((result,offset)=>{if(result.status==="fulfilled")rows.push(result.value);else errors.push(result.reason instanceof Error?result.reason.message:`URL Inspection failed for ${chunk[offset]}`);});}return {rows,errors};}
