export type CloudflarePoint={
  dimension:string;
  requests:number;
  visits:number;
  bytes:number;
};

export type CloudflareSummary={
  requests:number;
  visits:number;
  bytes:number;
};

export type CloudflareSnapshot={
  zoneId:string;
  current:CloudflareSummary;
  previous:CloudflareSummary;
  hourly:CloudflarePoint[];
  countries:CloudflarePoint[];
  paths:CloudflarePoint[];
  statusCodes:CloudflarePoint[];
};

type Group={
  count?:number;
  sum?:{visits?:number;edgeResponseBytes?:number};
  dimensions?:{
    datetimeHour?:string;
    clientCountryName?:string;
    clientRequestPath?:string;
    edgeResponseStatus?:number;
  };
};

type GraphResponse={
  data?:{viewer?:{zones?:Array<{
    current?:Group[];
    previous?:Group[];
    countries?:Group[];
    paths?:Group[];
    statusCodes?:Group[];
  }>}};
  errors?:Array<{message?:string}>;
};

function isoTime(date:Date){return date.toISOString()}
function shift(date:Date,days:number){const d=new Date(date);d.setUTCDate(d.getUTCDate()+days);return d}
function analyticsToken(){return process.env.CLOUDFLARE_ANALYTICS_API_TOKEN??process.env.CLOUDFLARE_API_TOKEN??"";}

function sumGroups(groups:Group[]|undefined):CloudflareSummary{
  return (groups??[]).reduce((acc,row)=>({
    requests:acc.requests+(row.count??0),
    visits:acc.visits+(row.sum?.visits??0),
    bytes:acc.bytes+(row.sum?.edgeResponseBytes??0),
  }),{requests:0,visits:0,bytes:0});
}

function mapGroups(groups:Group[]|undefined,kind:"hour"|"country"|"path"|"status"):CloudflarePoint[]{
  return (groups??[]).map(row=>({
    dimension:
      kind==="hour"?(row.dimensions?.datetimeHour??"unknown"):
      kind==="country"?(row.dimensions?.clientCountryName??"unknown"):
      kind==="path"?(row.dimensions?.clientRequestPath??"/"):
      String(row.dimensions?.edgeResponseStatus??"unknown"),
    requests:row.count??0,
    visits:row.sum?.visits??0,
    bytes:row.sum?.edgeResponseBytes??0,
  }));
}

export function getCloudflareConnectionStatus(){
  const token=analyticsToken();
  return {
    configured:Boolean(token&&process.env.CLOUDFLARE_ZONE_ID),
    accountId:process.env.CLOUDFLARE_ACCOUNT_ID??"",
    zoneId:process.env.CLOUDFLARE_ZONE_ID??"",
    tokenMode:process.env.CLOUDFLARE_ANALYTICS_API_TOKEN?"dedicated":"shared",
  };
}

export async function getCloudflareSnapshot():Promise<CloudflareSnapshot>{
  const status=getCloudflareConnectionStatus();
  const token=analyticsToken();
  if(!status.configured||!token)throw new Error("Cloudflare Analytics is not configured. Set CLOUDFLARE_ANALYTICS_API_TOKEN (preferred) or CLOUDFLARE_API_TOKEN plus CLOUDFLARE_ZONE_ID.");

  const end=new Date();
  const start=shift(end,-28);
  const previousEnd=start;
  const previousStart=shift(previousEnd,-28);

  const query=`query PanchvaniAnalytics($zoneTag: string!, $start: Time!, $end: Time!, $previousStart: Time!, $previousEnd: Time!) {
    viewer {
      zones(filter: {zoneTag: $zoneTag}) {
        current: httpRequestsAdaptiveGroups(
          limit: 1000
          orderBy: [datetimeHour_ASC]
          filter: {datetime_geq: $start, datetime_lt: $end, requestSource: "eyeball"}
        ) { count sum { visits edgeResponseBytes } dimensions { datetimeHour } }
        previous: httpRequestsAdaptiveGroups(
          limit: 1000
          orderBy: [datetimeHour_ASC]
          filter: {datetime_geq: $previousStart, datetime_lt: $previousEnd, requestSource: "eyeball"}
        ) { count sum { visits edgeResponseBytes } dimensions { datetimeHour } }
        countries: httpRequestsAdaptiveGroups(
          limit: 20
          orderBy: [count_DESC]
          filter: {datetime_geq: $start, datetime_lt: $end, requestSource: "eyeball"}
        ) { count sum { visits edgeResponseBytes } dimensions { clientCountryName } }
        paths: httpRequestsAdaptiveGroups(
          limit: 20
          orderBy: [count_DESC]
          filter: {datetime_geq: $start, datetime_lt: $end, requestSource: "eyeball"}
        ) { count sum { visits edgeResponseBytes } dimensions { clientRequestPath } }
        statusCodes: httpRequestsAdaptiveGroups(
          limit: 30
          orderBy: [count_DESC]
          filter: {datetime_geq: $start, datetime_lt: $end, requestSource: "eyeball"}
        ) { count sum { visits edgeResponseBytes } dimensions { edgeResponseStatus } }
      }
    }
  }`;

  const response=await fetch("https://api.cloudflare.com/client/v4/graphql",{
    method:"POST",
    headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},
    body:JSON.stringify({query,variables:{zoneTag:status.zoneId,start:isoTime(start),end:isoTime(end),previousStart:isoTime(previousStart),previousEnd:isoTime(previousEnd)}}),
    cache:"no-store",
  });

  if(!response.ok){const text=await response.text();throw new Error(`Cloudflare GraphQL failed (${response.status}): ${text.slice(0,260)}`);}
  const json=await response.json() as GraphResponse;
  if(json.errors?.length){throw new Error(`Cloudflare GraphQL: ${json.errors.map(error=>error.message).filter(Boolean).join(" · ").slice(0,300)}`);}
  const zone=json.data?.viewer?.zones?.[0];
  if(!zone)throw new Error("Cloudflare GraphQL returned no zone. Check Zone ID and token scope.");

  return {zoneId:status.zoneId,current:sumGroups(zone.current),previous:sumGroups(zone.previous),hourly:mapGroups(zone.current,"hour"),countries:mapGroups(zone.countries,"country"),paths:mapGroups(zone.paths,"path"),statusCodes:mapGroups(zone.statusCodes,"status")};
}
