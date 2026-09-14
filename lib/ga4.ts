import {ADMIN_PROVIDER_TTL_MS,cachedCoalesced} from "./worker-data-cache";

export type Ga4Summary={activeUsers:number;sessions:number;engagedSessions:number;engagementRate:number;averageSessionDuration:number;eventCount:number;keyEvents:number;screenPageViews:number;};
export type Ga4Row={dimension:string;metrics:number[];};
export type Ga4Snapshot={propertyId:string;startDate:string;endDate:string;current:Ga4Summary;previous:Ga4Summary;daily:Ga4Row[];landingPages:Ga4Row[];countries:Ga4Row[];devices:Ga4Row[];};
export type Ga4TodaySnapshot={propertyId:string;date:string;summary:Ga4Summary;pages:Ga4Row[];countries:Ga4Row[];devices:Ga4Row[];};

type RawReport={rows?:Array<{dimensionValues?:Array<{value?:string}>;metricValues?:Array<{value?:string}>}>;};

const GOOGLE_TOKEN_URL="https://oauth2.googleapis.com/token";
const GA4_SCOPE="https://www.googleapis.com/auth/analytics.readonly";
const TOKEN_TTL_MS=50*60*1000;
let tokenCache:{expiresAt:number;value:string}|null=null;
let tokenInflight:Promise<string>|null=null;

function base64Url(input:Uint8Array|string){const bytes=typeof input==="string"?new TextEncoder().encode(input):input;let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
function pemToArrayBuffer(pem:string){const normalized=pem.replace(/\\n/g,"\n").trim();const base64=normalized.replace(/-----BEGIN PRIVATE KEY-----/g,"").replace(/-----END PRIVATE KEY-----/g,"").replace(/\s+/g,"");const binary=atob(base64);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}

async function serviceAccountAccessToken(){
  const now=Date.now();
  if(tokenCache&&tokenCache.expiresAt>now)return tokenCache.value;
  if(tokenInflight)return tokenInflight;
  const request=(async()=>{
    const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey=process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    if(!email||!privateKey)throw new Error("Google service account credentials are not configured.");
    const issued=Math.floor(Date.now()/1000);
    const header=base64Url(JSON.stringify({alg:"RS256",typ:"JWT"}));
    const payload=base64Url(JSON.stringify({iss:email,scope:GA4_SCOPE,aud:GOOGLE_TOKEN_URL,iat:issued,exp:issued+3600}));
    const unsigned=`${header}.${payload}`;
    const key=await crypto.subtle.importKey("pkcs8",pemToArrayBuffer(privateKey),{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
    const signature=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(unsigned));
    const assertion=`${unsigned}.${base64Url(new Uint8Array(signature))}`;
    const response=await fetch(GOOGLE_TOKEN_URL,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion}),cache:"no-store"});
    if(!response.ok){const text=await response.text();throw new Error(`GA4 service-account auth failed (${response.status}): ${text.slice(0,220)}`);}
    const json=await response.json() as {access_token?:string};
    if(!json.access_token)throw new Error("GA4 auth returned no access token.");
    tokenCache={value:json.access_token,expiresAt:Date.now()+TOKEN_TTL_MS};
    return json.access_token;
  })().finally(()=>{tokenInflight=null;});
  tokenInflight=request;
  return request;
}

function iso(date:Date){return date.toISOString().slice(0,10)}
function shift(date:Date,days:number){const d=new Date(date);d.setUTCDate(d.getUTCDate()+days);return d}
function num(value?:string){const parsed=Number(value??0);return Number.isFinite(parsed)?parsed:0}

async function batchRunReports(token:string,propertyId:string,requests:Record<string,unknown>[]):Promise<RawReport[]>{
  if(!requests.length)return [];
  const response=await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`,{
    method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},body:JSON.stringify({requests}),cache:"no-store",
  });
  if(!response.ok){const text=await response.text();throw new Error(`GA4 Data API failed (${response.status}): ${text.slice(0,260)}`);}
  const json=await response.json() as {reports?:RawReport[]};
  return json.reports??[];
}

function summary(row?:{metricValues?:Array<{value?:string}>}):Ga4Summary{const m=row?.metricValues??[];return {activeUsers:num(m[0]?.value),sessions:num(m[1]?.value),engagedSessions:num(m[2]?.value),engagementRate:num(m[3]?.value),averageSessionDuration:num(m[4]?.value),eventCount:num(m[5]?.value),keyEvents:num(m[6]?.value),screenPageViews:num(m[7]?.value)};}
function rows(report:RawReport|undefined):Ga4Row[]{return (report?.rows??[]).map(row=>({dimension:row.dimensionValues?.[0]?.value??"(not set)",metrics:(row.metricValues??[]).map(item=>num(item.value))}));}

export function getGa4ConnectionStatus(){return {configured:Boolean(process.env.GA4_PROPERTY_ID&&process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL&&process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),propertyId:process.env.GA4_PROPERTY_ID??""};}

async function buildGa4TodaySnapshot():Promise<Ga4TodaySnapshot>{
  const status=getGa4ConnectionStatus();if(!status.configured)throw new Error("GA4 is not configured.");
  const token=await serviceAccountAccessToken();
  const metrics=["activeUsers","sessions","engagedSessions","engagementRate","averageSessionDuration","eventCount","keyEvents","screenPageViews"].map(name=>({name}));
  const date=iso(new Date());
  const reports=await batchRunReports(token,status.propertyId,[
    {dateRanges:[{startDate:"today",endDate:"today"}],metrics},
    {dateRanges:[{startDate:"today",endDate:"today"}],dimensions:[{name:"pagePath"}],metrics:[{name:"screenPageViews"},{name:"activeUsers"},{name:"sessions"}],orderBys:[{metric:{metricName:"screenPageViews"},desc:true}],limit:"12"},
    {dateRanges:[{startDate:"today",endDate:"today"}],dimensions:[{name:"country"}],metrics:[{name:"activeUsers"},{name:"sessions"}],orderBys:[{metric:{metricName:"activeUsers"},desc:true}],limit:"8"},
    {dateRanges:[{startDate:"today",endDate:"today"}],dimensions:[{name:"deviceCategory"}],metrics:[{name:"activeUsers"},{name:"sessions"}],orderBys:[{metric:{metricName:"activeUsers"},desc:true}],limit:"6"},
  ]);
  return {propertyId:status.propertyId,date,summary:summary(reports[0]?.rows?.[0]),pages:rows(reports[1]),countries:rows(reports[2]),devices:rows(reports[3])};
}

export async function getGa4TodaySnapshot():Promise<Ga4TodaySnapshot>{
  return (await cachedCoalesced("ga4:today:v2",ADMIN_PROVIDER_TTL_MS.ga4,buildGa4TodaySnapshot)).value;
}

async function buildGa4Snapshot():Promise<Ga4Snapshot>{
  const status=getGa4ConnectionStatus();if(!status.configured)throw new Error("GA4 is not configured.");
  const today=new Date(),end=shift(today,-1),start=shift(end,-27),prevEnd=shift(start,-1),prevStart=shift(prevEnd,-27);
  const startDate=iso(start),endDate=iso(end),token=await serviceAccountAccessToken();
  const metrics=["activeUsers","sessions","engagedSessions","engagementRate","averageSessionDuration","eventCount","keyEvents","screenPageViews"].map(name=>({name}));
  const first=await batchRunReports(token,status.propertyId,[
    {dateRanges:[{startDate,endDate}],metrics},
    {dateRanges:[{startDate:iso(prevStart),endDate:iso(prevEnd)}],metrics},
    {dateRanges:[{startDate,endDate}],dimensions:[{name:"date"}],metrics:[{name:"activeUsers"},{name:"sessions"},{name:"engagedSessions"}],orderBys:[{dimension:{dimensionName:"date"}}],limit:"100"},
    {dateRanges:[{startDate,endDate}],dimensions:[{name:"landingPagePlusQueryString"}],metrics:[{name:"sessions"},{name:"activeUsers"},{name:"engagementRate"},{name:"keyEvents"}],orderBys:[{metric:{metricName:"sessions"},desc:true}],limit:"20"},
    {dateRanges:[{startDate,endDate}],dimensions:[{name:"country"}],metrics:[{name:"activeUsers"},{name:"sessions"}],orderBys:[{metric:{metricName:"activeUsers"},desc:true}],limit:"12"},
  ]);
  const second=await batchRunReports(token,status.propertyId,[
    {dateRanges:[{startDate,endDate}],dimensions:[{name:"deviceCategory"}],metrics:[{name:"activeUsers"},{name:"sessions"}],orderBys:[{metric:{metricName:"activeUsers"},desc:true}],limit:"10"},
  ]);
  return {propertyId:status.propertyId,startDate,endDate,current:summary(first[0]?.rows?.[0]),previous:summary(first[1]?.rows?.[0]),daily:rows(first[2]),landingPages:rows(first[3]),countries:rows(first[4]),devices:rows(second[0])};
}

export async function getGa4Snapshot():Promise<Ga4Snapshot>{
  return (await cachedCoalesced("ga4:28d:v2",ADMIN_PROVIDER_TTL_MS.ga4,buildGa4Snapshot)).value;
}
