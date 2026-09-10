export type GscRow={
  keys?:string[];
  clicks:number;
  impressions:number;
  ctr:number;
  position:number;
};

export type GscSummary={
  clicks:number;
  impressions:number;
  ctr:number;
  position:number;
};

export type GscTrafficSnapshot={
  siteUrl:string;
  startDate:string;
  endDate:string;
  previousStartDate:string;
  previousEndDate:string;
  current:GscSummary;
  previous:GscSummary;
  pages:GscRow[];
  queries:GscRow[];
  queryPages:GscRow[];
  daily:GscRow[];
};

export type GscOutcomeWindow={
  startDate:string;
  endDate:string;
  clicks:number;
  impressions:number;
  ctr:number;
  position:number;
  topLanding:string|null;
};

export type GscOutcomeComparison={
  query:string;
  pre:GscOutcomeWindow;
  post:GscOutcomeWindow;
};

export type GscOutcomeRequest={
  key:string;
  query:string;
  shippedAt:string;
  days:14|28|56;
};

const GOOGLE_TOKEN_URL="https://oauth2.googleapis.com/token";
const GSC_SCOPE="https://www.googleapis.com/auth/webmasters.readonly";

export function getGscConnectionStatus(){
  const required={
    GOOGLE_SERVICE_ACCOUNT_EMAIL:Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL),
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
    GSC_SITE_URL:Boolean(process.env.GSC_SITE_URL),
  };
  return {
    configured:Boolean(
      required.GOOGLE_SERVICE_ACCOUNT_EMAIL&&
      required.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    ),
    required,
    siteUrl:process.env.GSC_SITE_URL??"sc-domain:panchvani.com",
    authMode:"service-account" as const,
  };
}

function iso(date:Date){
  return date.toISOString().slice(0,10);
}

function shift(date:Date,days:number){
  const next=new Date(date);
  next.setUTCDate(next.getUTCDate()+days);
  return next;
}

function base64Url(input:Uint8Array|string){
  const bytes=typeof input==="string"?new TextEncoder().encode(input):input;
  let binary="";
  for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

function pemToArrayBuffer(pem:string){
  const normalized=pem.replace(/\\n/g,"\n").trim();
  const base64=normalized
    .replace(/-----BEGIN PRIVATE KEY-----/g,"")
    .replace(/-----END PRIVATE KEY-----/g,"")
    .replace(/\s+/g,"");
  const binary=atob(base64);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes.buffer;
}

async function createServiceAccountJwt(){
  const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey=process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if(!email||!privateKey)throw new Error("Google service account credentials are not configured.");

  const now=Math.floor(Date.now()/1000);
  const header=base64Url(JSON.stringify({alg:"RS256",typ:"JWT"}));
  const payload=base64Url(JSON.stringify({
    iss:email,
    scope:GSC_SCOPE,
    aud:GOOGLE_TOKEN_URL,
    iat:now,
    exp:now+3600,
  }));
  const unsigned=`${header}.${payload}`;

  const key=await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    {name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},
    false,
    ["sign"]
  );

  const signature=await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned)
  );

  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

async function accessToken(){
  const status=getGscConnectionStatus();
  if(!status.configured)throw new Error("Google Search Console service account is not configured.");

  const assertion=await createServiceAccountJwt();
  const body=new URLSearchParams({
    grant_type:"urn:ietf:params:oauth2:grant-type:jwt-bearer",
    assertion,
  });

  const response=await fetch(GOOGLE_TOKEN_URL,{
    method:"POST",
    headers:{"content-type":"application/x-www-form-urlencoded"},
    body,
    cache:"no-store",
  });

  if(!response.ok){
    const text=await response.text();
    throw new Error(`Google service-account auth failed (${response.status}): ${text.slice(0,240)}`);
  }

  const json=await response.json() as {access_token?:string};
  if(!json.access_token)throw new Error("Google service-account auth returned no access token.");
  return json.access_token;
}

type SearchAnalyticsFilter={dimension:"query"|"page";operator:"equals"|"contains";expression:string};

async function query(
  token:string,
  siteUrl:string,
  payload:{
    startDate:string;
    endDate:string;
    dimensions?:string[];
    rowLimit?:number;
    filters?:SearchAnalyticsFilter[];
  }
){
  const {filters,...rest}=payload;
  const response=await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method:"POST",
      headers:{
        authorization:`Bearer ${token}`,
        "content-type":"application/json",
      },
      body:JSON.stringify({
        ...rest,
        ...(filters?.length?{dimensionFilterGroups:[{groupType:"and",filters}]}:{}),
        dataState:"final",
        aggregationType:"auto",
      }),
      cache:"no-store",
    }
  );

  if(!response.ok){
    const text=await response.text();
    throw new Error(`Search Console API failed (${response.status}): ${text.slice(0,240)}`);
  }

  return await response.json() as {rows?:GscRow[]};
}

function summary(rows:GscRow[]|undefined):GscSummary{
  const row=rows?.[0];
  return row?{
    clicks:row.clicks??0,
    impressions:row.impressions??0,
    ctr:row.ctr??0,
    position:row.position??0,
  }:{clicks:0,impressions:0,ctr:0,position:0};
}

function aggregateOutcomeWindow(startDate:string,endDate:string,rows:GscRow[]|undefined):GscOutcomeWindow{
  const items=rows??[];
  const clicks=items.reduce((sum,row)=>sum+(row.clicks??0),0);
  const impressions=items.reduce((sum,row)=>sum+(row.impressions??0),0);
  const weightedPosition=items.reduce((sum,row)=>sum+(row.position??0)*(row.impressions??0),0);
  const top=items.slice().sort((a,b)=>(b.impressions??0)-(a.impressions??0)||(b.clicks??0)-(a.clicks??0))[0];
  return {
    startDate,
    endDate,
    clicks,
    impressions,
    ctr:impressions?clicks/impressions:0,
    position:impressions?weightedPosition/impressions:0,
    topLanding:top?.keys?.[1]??null,
  };
}

export function gscCheckpointWindow(shippedAt:string,days:14|28|56){
  const shipped=new Date(`${shippedAt.slice(0,10)}T00:00:00Z`);
  if(Number.isNaN(shipped.getTime()))throw new Error("Invalid shippedAt date for GSC checkpoint.");
  const preEnd=shift(shipped,-1);
  const preStart=shift(shipped,-days);
  const postStart=new Date(shipped);
  const postEnd=shift(shipped,days-1);
  return {preStart:iso(preStart),preEnd:iso(preEnd),postStart:iso(postStart),postEnd:iso(postEnd)};
}

export function isGscCheckpointReady(shippedAt:string,days:14|28|56,asOf=new Date()){
  const {postEnd}=gscCheckpointWindow(shippedAt,days);
  const finalAvailableEnd=iso(shift(asOf,-2));
  return finalAvailableEnd>=postEnd;
}

export async function getGscOutcomeComparisons(requests:GscOutcomeRequest[]):Promise<Record<string,GscOutcomeComparison>>{
  if(!requests.length)return {};
  const status=getGscConnectionStatus();
  if(!status.configured)throw new Error("Google Search Console service account is not configured.");
  const token=await accessToken();
  const output:Record<string,GscOutcomeComparison>={};

  await Promise.all(requests.map(async request=>{
    const window=gscCheckpointWindow(request.shippedAt,request.days);
    const filters:SearchAnalyticsFilter[]=[{dimension:"query",operator:"equals",expression:request.query}];
    const [preRaw,postRaw]=await Promise.all([
      query(token,status.siteUrl,{startDate:window.preStart,endDate:window.preEnd,dimensions:["query","page"],rowLimit:5000,filters}),
      query(token,status.siteUrl,{startDate:window.postStart,endDate:window.postEnd,dimensions:["query","page"],rowLimit:5000,filters}),
    ]);
    output[`${request.key}:${request.days}`]={
      query:request.query,
      pre:aggregateOutcomeWindow(window.preStart,window.preEnd,preRaw.rows),
      post:aggregateOutcomeWindow(window.postStart,window.postEnd,postRaw.rows),
    };
  }));

  return output;
}

export async function getGscTrafficSnapshot():Promise<GscTrafficSnapshot>{
  const status=getGscConnectionStatus();
  if(!status.configured)throw new Error("Google Search Console service account is not configured.");

  const today=new Date();
  const end=shift(today,-2);
  const start=shift(end,-27);
  const previousEnd=shift(start,-1);
  const previousStart=shift(previousEnd,-27);

  const startDate=iso(start);
  const endDate=iso(end);
  const previousStartDate=iso(previousStart);
  const previousEndDate=iso(previousEnd);

  const token=await accessToken();

  const [currentRaw,previousRaw,pagesRaw,queriesRaw,queryPagesRaw,dailyRaw]=await Promise.all([
    query(token,status.siteUrl,{startDate,endDate,rowLimit:1}),
    query(token,status.siteUrl,{startDate:previousStartDate,endDate:previousEndDate,rowLimit:1}),
    query(token,status.siteUrl,{startDate,endDate,dimensions:["page"],rowLimit:5000}),
    query(token,status.siteUrl,{startDate,endDate,dimensions:["query"],rowLimit:10000}),
    query(token,status.siteUrl,{startDate,endDate,dimensions:["query","page"],rowLimit:25000}),
    query(token,status.siteUrl,{startDate,endDate,dimensions:["date"],rowLimit:1000}),
  ]);

  return {
    siteUrl:status.siteUrl,
    startDate,endDate,previousStartDate,previousEndDate,
    current:summary(currentRaw.rows),
    previous:summary(previousRaw.rows),
    pages:pagesRaw.rows??[],
    queries:queriesRaw.rows??[],
    queryPages:queryPagesRaw.rows??[],
    daily:(dailyRaw.rows??[]).sort((a,b)=>(a.keys?.[0]??"").localeCompare(b.keys?.[0]??"")),
  };
}
