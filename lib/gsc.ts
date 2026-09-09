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
};

export function getGscConnectionStatus(){
  const required={
    GOOGLE_CLIENT_ID:Boolean(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET:Boolean(process.env.GOOGLE_CLIENT_SECRET),
    GOOGLE_REFRESH_TOKEN:Boolean(process.env.GOOGLE_REFRESH_TOKEN),
  };
  return {
    configured:Object.values(required).every(Boolean),
    required,
    siteUrl:process.env.GSC_SITE_URL??"sc-domain:panchvani.com",
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

async function accessToken(){
  const status=getGscConnectionStatus();
  if(!status.configured)throw new Error("Google Search Console is not configured.");

  const body=new URLSearchParams({
    client_id:process.env.GOOGLE_CLIENT_ID!,
    client_secret:process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token:process.env.GOOGLE_REFRESH_TOKEN!,
    grant_type:"refresh_token",
  });

  const response=await fetch("https://oauth2.googleapis.com/token",{
    method:"POST",
    headers:{"content-type":"application/x-www-form-urlencoded"},
    body,
    cache:"no-store",
  });

  if(!response.ok)throw new Error(`Google OAuth failed (${response.status}).`);
  const json=await response.json() as {access_token?:string};
  if(!json.access_token)throw new Error("Google OAuth returned no access token.");
  return json.access_token;
}

async function query(
  token:string,
  siteUrl:string,
  payload:{
    startDate:string;
    endDate:string;
    dimensions?:string[];
    rowLimit?:number;
  }
){
  const response=await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method:"POST",
      headers:{
        authorization:`Bearer ${token}`,
        "content-type":"application/json",
      },
      body:JSON.stringify({
        ...payload,
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

export async function getGscTrafficSnapshot():Promise<GscTrafficSnapshot>{
  const status=getGscConnectionStatus();
  if(!status.configured)throw new Error("Google Search Console is not configured.");

  // GSC final data normally trails real time. End two days ago for stable reporting.
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

  const [currentRaw,previousRaw,pagesRaw,queriesRaw]=await Promise.all([
    query(token,status.siteUrl,{startDate,endDate,rowLimit:1}),
    query(token,status.siteUrl,{startDate:previousStartDate,endDate:previousEndDate,rowLimit:1}),
    query(token,status.siteUrl,{startDate,endDate,dimensions:["page"],rowLimit:5000}),
    query(token,status.siteUrl,{startDate,endDate,dimensions:["query"],rowLimit:10000}),
  ]);

  return {
    siteUrl:status.siteUrl,
    startDate,endDate,previousStartDate,previousEndDate,
    current:summary(currentRaw.rows),
    previous:summary(previousRaw.rows),
    pages:pagesRaw.rows??[],
    queries:queriesRaw.rows??[],
  };
}
