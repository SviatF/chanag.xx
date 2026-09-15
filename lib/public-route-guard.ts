const MIN_YEAR=1900;
const MAX_YEAR=2100;
const MAX_PATH_LENGTH=768;
const MAX_SEGMENTS=10;

const SCANNER_PATTERNS=[
  /(?:^|\/)wp-admin(?:\/|$)/i,
  /(?:^|\/)wp-login\.php$/i,
  /(?:^|\/)xmlrpc\.php$/i,
  /(?:^|\/)phpmyadmin(?:\/|$)/i,
  /(?:^|\/)cgi-bin(?:\/|$)/i,
  /(?:^|\/)vendor(?:\/|$)/i,
  /(?:^|\/)actuator(?:\/|$)/i,
  /(?:^|\/)server-status(?:\/|$)/i,
  /(?:^|\/)\.env(?:\.|\/|$)/i,
  /(?:^|\/)\.git(?:\/|$)/i,
  /\.php(?:\/|$)/i,
];

export type PublicRouteGuardDecision={blocked:boolean;reason:string};

function validYear(raw:string|undefined){
  if(!raw||!/^\d{4}$/.test(raw))return false;
  const year=Number(raw);
  return year>=MIN_YEAR&&year<=MAX_YEAR;
}

function validMonth(raw:string|undefined){return !!raw&&/^(0[1-9]|1[0-2])$/.test(raw);}

function validDate(raw:string|undefined){
  if(!raw||!/^\d{4}-\d{2}-\d{2}$/.test(raw))return false;
  const year=Number(raw.slice(0,4));
  if(year<MIN_YEAR||year>MAX_YEAR)return false;
  const value=new Date(`${raw}T06:00:00Z`);
  return !Number.isNaN(value.getTime())&&value.toISOString().slice(0,10)===raw;
}

export function publicRouteGuard(pathname:string):PublicRouteGuardDecision{
  if(pathname==="/admin"||pathname.startsWith("/admin/")||pathname==="/api"||pathname.startsWith("/api/"))return {blocked:false,reason:"private-route"};
  if(pathname.length>MAX_PATH_LENGTH)return {blocked:true,reason:"path-too-long"};
  if(SCANNER_PATTERNS.some(pattern=>pattern.test(pathname)))return {blocked:true,reason:"scanner-path"};

  const parts=pathname.split("/").filter(Boolean);
  if(parts.length>MAX_SEGMENTS)return {blocked:true,reason:"too-many-segments"};
  const [family,,third,fourth]=parts;

  if(family==="panchang"){
    if(parts.length>3)return {blocked:true,reason:"panchang-shape"};
    if(parts.length===3&&!validDate(third))return {blocked:true,reason:"panchang-date"};
  }
  if(family==="calendar"){
    if(parts.length>4)return {blocked:true,reason:"calendar-shape"};
    if(parts.length>=3&&!validYear(third))return {blocked:true,reason:"calendar-year"};
    if(parts.length===4&&!validMonth(fourth))return {blocked:true,reason:"calendar-month"};
  }
  if(family==="festivals"){
    if(parts.length>4)return {blocked:true,reason:"festival-shape"};
    if(parts.length>=3&&!validYear(third))return {blocked:true,reason:"festival-year"};
  }
  if(family==="muhurat"){
    if(parts.length>5)return {blocked:true,reason:"muhurat-shape"};
    if(parts.length>=3&&!validYear(third))return {blocked:true,reason:"muhurat-year"};
    if(parts.length>=4&&!validMonth(fourth))return {blocked:true,reason:"muhurat-month"};
  }
  if(family==="vrat"){
    if(parts.length>4)return {blocked:true,reason:"vrat-shape"};
    if(parts.length>=3&&!validYear(third))return {blocked:true,reason:"vrat-year"};
  }

  return {blocked:false,reason:"pass"};
}

export function guardedNotFoundResponse(reason:string){
  return new Response("<!doctype html><html><head><meta name=\"robots\" content=\"noindex,nofollow\"><title>Not found</title></head><body><h1>404</h1></body></html>",{
    status:404,
    headers:{
      "content-type":"text/html; charset=utf-8",
      "cache-control":"public, max-age=0, s-maxage=21600",
      "x-robots-tag":"noindex, nofollow",
      "x-panchvani-route-guard":"BLOCK",
      "x-panchvani-route-guard-reason":reason,
    },
  });
}
