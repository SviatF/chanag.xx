export type Ga4Summary={
  activeUsers:number;
  sessions:number;
  engagedSessions:number;
  engagementRate:number;
  averageSessionDuration:number;
  eventCount:number;
  keyEvents:number;
  screenPageViews:number;
};

export type Ga4Row={
  dimension:string;
  metrics:number[];
};

export type Ga4Snapshot={
  propertyId:string;
  startDate:string;
  endDate:string;
  current:Ga4Summary;
  previous:Ga4Summary;
  daily:Ga4Row[];
  landingPages:Ga4Row[];
  countries:Ga4Row[];
  devices:Ga4Row[];
};

const GOOGLE_TOKEN_URL="https://oauth2.googleapis.com/token";
const GA4_SCOPE="https://www.googleapis.com/auth/analytics.readonly";

function base64Url(input:Uint8Array|string){
  const bytes=typeof input==="string"?new TextEncoder().encode(input):input;
  let binary="";
  for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
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

async function serviceAccountAccessToken(){
  const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey=process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if(!email||!privateKey)throw new Error("Google service account credentials are not configured.");

  const now=Math.floor(Date.now()/1000);
  const header=base64Url(JSON.stringify({alg:"RS256",typ:"JWT"}));
  const payload=base64Url(JSON.stringify({
    iss:email,
    scope:GA4_SCOPE,
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
  const assertion=`${unsigned}.${base64Url(new Uint8Array(signature))}`;
  const body=new URLSearchParams({
    grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",
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
    throw new Error(`GA4 service-account auth failed (${response.status}): ${text.slice(0,220)}`);
  }
  const json=await response.json() as {access_token?:string};
  if(!json.access_token)throw new Error("GA4 auth returned no access token.");
  return json.access_token;
}

function iso(date:Date){return date.toISOString().slice(0,10)}
function shift(date:Date,days:number){const d=new Date(date);d.setUTCDate(d.getUTCDate()+days);return d}
function num(value?:string){const parsed=Number(value??0);return Number.isFinite(parsed)?parsed:0}

async function runReport(token:string,propertyId:string,body:Record<string,unknown>){
  const response=await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,{
    method:"POST",
    headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},
    body:JSON.stringify(body),
    cache:"no-store",
  });
  if(!response.ok){
    const text=await response.text();
    throw new Error(`GA4 Data API failed (${response.status}): ${text.slice(0,260)}`);
  }
  return await response.json() as {
    rows?:Array<{dimensionValues?:Array<{value?:string}>;metricValues?:Array<{value?:string}>}>;
  };
}

function summary(row?:{metricValues?:Array<{value?:string}>}):Ga4Summary{
  const m=row?.metricValues??[];
  return {
    activeUsers:num(m[0]?.value),
    sessions:num(m[1]?.value),
    engagedSessions:num(m[2]?.value),
    engagementRate:num(m[3]?.value),
    averageSessionDuration:num(m[4]?.value),
    eventCount:num(m[5]?.value),
    keyEvents:num(m[6]?.value),
    screenPageViews:num(m[7]?.value),
  };
}

function rows(report:{rows?:Array<{dimensionValues?:Array<{value?:string}>;metricValues?:Array<{value?:string}>}>}):Ga4Row[]{
  return (report.rows??[]).map(row=>({
    dimension:row.dimensionValues?.[0]?.value??"(not set)",
    metrics:(row.metricValues??[]).map(item=>num(item.value)),
  }));
}

export function getGa4ConnectionStatus(){
  return {
    configured:Boolean(
      process.env.GA4_PROPERTY_ID&&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL&&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    ),
    propertyId:process.env.GA4_PROPERTY_ID??"",
  };
}

export async function getGa4Snapshot():Promise<Ga4Snapshot>{
  const status=getGa4ConnectionStatus();
  if(!status.configured)throw new Error("GA4 is not configured.");

  const today=new Date();
  const end=shift(today,-1);
  const start=shift(end,-27);
  const prevEnd=shift(start,-1);
  const prevStart=shift(prevEnd,-27);
  const startDate=iso(start),endDate=iso(end);
  const token=await serviceAccountAccessToken();
  const metrics=["activeUsers","sessions","engagedSessions","engagementRate","averageSessionDuration","eventCount","keyEvents","screenPageViews"].map(name=>({name}));

  const [currentRaw,previousRaw,dailyRaw,landingRaw,countryRaw,deviceRaw]=await Promise.all([
    runReport(token,status.propertyId,{dateRanges:[{startDate,endDate}],metrics}),
    runReport(token,status.propertyId,{dateRanges:[{startDate:iso(prevStart),endDate:iso(prevEnd)}],metrics}),
    runReport(token,status.propertyId,{dateRanges:[{startDate,endDate}],dimensions:[{name:"date"}],metrics:[{name:"activeUsers"},{name:"sessions"},{name:"engagedSessions"}],orderBys:[{dimension:{dimensionName:"date"}}],limit:"100"}),
    runReport(token,status.propertyId,{dateRanges:[{startDate,endDate}],dimensions:[{name:"landingPagePlusQueryString"}],metrics:[{name:"sessions"},{name:"activeUsers"},{name:"engagementRate"},{name:"keyEvents"}],orderBys:[{metric:{metricName:"sessions"},desc:true}],limit:"20"}),
    runReport(token,status.propertyId,{dateRanges:[{startDate,endDate}],dimensions:[{name:"country"}],metrics:[{name:"activeUsers"},{name:"sessions"}],orderBys:[{metric:{metricName:"activeUsers"},desc:true}],limit:"12"}),
    runReport(token,status.propertyId,{dateRanges:[{startDate,endDate}],dimensions:[{name:"deviceCategory"}],metrics:[{name:"activeUsers"},{name:"sessions"}],orderBys:[{metric:{metricName:"activeUsers"},desc:true}],limit:"10"}),
  ]);

  return {
    propertyId:status.propertyId,
    startDate,endDate,
    current:summary(currentRaw.rows?.[0]),
    previous:summary(previousRaw.rows?.[0]),
    daily:rows(dailyRaw),
    landingPages:rows(landingRaw),
    countries:rows(countryRaw),
    devices:rows(deviceRaw),
  };
}
