import type {City} from "./cities";
import {getMonthlyMuhurat,muhuratRules,type MuhuratRow} from "./muhurat";

export const yearlyMonths=Array.from({length:12},(_,index)=>{
  const month=index+1;
  const slug=String(month).padStart(2,"0");
  const name=new Intl.DateTimeFormat("en-IN",{month:"long",timeZone:"Asia/Kolkata"}).format(new Date(Date.UTC(2026,index,1,6)));
  return {month,slug,name};
});

export function hinduCalendarYearPath(year:number){return `/hindu-calendar/${year}`;}
export function cityCalendarYearPath(city:Pick<City,"slug">,year:number){return `/calendar/${city.slug}/${year}`;}
export function muhuratYearPath(event:string,year:number){return `/muhurat/${event}/${year}`;}

export type YearlyMuhuratMonth={
  month:number;
  slug:string;
  name:string;
  qualified:number;
  excellent:number;
  strong:number;
  averageScore:number;
  top:MuhuratRow|null;
};

export type YearlyMuhuratSummary={
  event:string;
  year:number;
  title:string;
  months:YearlyMuhuratMonth[];
  rows:MuhuratRow[];
  topRows:MuhuratRow[];
  totalQualified:number;
  excellentCount:number;
  strongCount:number;
  averageScore:number;
  strongestMonth:YearlyMuhuratMonth|null;
};

export async function buildYearlyMuhuratSummary(event:string,year:number,city:City):Promise<YearlyMuhuratSummary>{
  const rule=muhuratRules[event];
  if(!rule)throw new Error(`Unsupported Muhurat event: ${event}`);
  const results=await Promise.all(yearlyMonths.map(async item=>{
    const {rows}=await getMonthlyMuhurat(event,year,item.month,city);
    const total=rows.reduce((sum,row)=>sum+row.planning.score,0);
    return {
      ...item,
      qualified:rows.length,
      excellent:rows.filter(row=>row.planning.grade==="Excellent").length,
      strong:rows.filter(row=>row.planning.grade==="Strong").length,
      averageScore:rows.length?Math.round(total/rows.length):0,
      top:rows[0]??null,
      rows,
    };
  }));
  const rows=results.flatMap(item=>item.rows).sort((a,b)=>b.planning.score-a.planning.score||b.planning.longestWindowMinutes-a.planning.longestWindowMinutes||a.date.localeCompare(b.date));
  const months:YearlyMuhuratMonth[]=results.map(({rows:_rows,...item})=>item);
  const strongestMonth=[...months].filter(item=>item.qualified>0).sort((a,b)=>(b.top?.planning.score??0)-(a.top?.planning.score??0)||b.averageScore-a.averageScore||b.qualified-a.qualified||a.month-b.month)[0]??null;
  const totalScore=rows.reduce((sum,row)=>sum+row.planning.score,0);
  return {
    event,year,title:rule.title,months,rows,topRows:rows.slice(0,10),
    totalQualified:rows.length,
    excellentCount:rows.filter(row=>row.planning.grade==="Excellent").length,
    strongCount:rows.filter(row=>row.planning.grade==="Strong").length,
    averageScore:rows.length?Math.round(totalScore/rows.length):0,
    strongestMonth,
  };
}