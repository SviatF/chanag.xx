import { todayInIndia } from "./dates";

export const MIN_ROUTE_YEAR = 1900;
export const MAX_ROUTE_YEAR = 2100;

export function parseRouteYear(raw:string){
  if(!/^\d{4}$/.test(raw)) return null;
  const year=Number(raw);
  if(year<MIN_ROUTE_YEAR||year>MAX_ROUTE_YEAR) return null;
  return year;
}

export function parseRouteMonth(raw:string){
  if(!/^(0[1-9]|1[0-2])$/.test(raw)) return null;
  return Number(raw);
}

export function parseIsoRouteDate(raw:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const year=Number(raw.slice(0,4));
  if(year<MIN_ROUTE_YEAR||year>MAX_ROUTE_YEAR) return null;
  const date=new Date(raw+"T06:00:00Z");
  if(Number.isNaN(date.getTime())) return null;
  if(date.toISOString().slice(0,10)!==raw) return null;
  return date;
}

export function resolveDailyRouteDate(parts?:string[]){
  if(!parts||parts.length===0) return todayInIndia();
  if(parts.length!==1) return null;
  return parseIsoRouteDate(parts[0]);
}
