import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {buildCalendarYearCityContext} from "../lib/calendar-year-city-context";
import {findCityBySlug} from "../lib/cities";
import type {Panchang} from "../lib/panchang";
import {phase1PriorityCities} from "../lib/seo-policy";

function snapshot(month:number):Panchang{
  const date=`2026-${String(month).padStart(2,"0")}-01`,names=["Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit"] as const;
  const day=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String(6+index).padStart(2,"0")}:10`,end:`${String(7+index).padStart(2,"0")}:10`,startDayOffset:0 as const,endDayOffset:0 as const}));
  const night=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String((18+index)%24).padStart(2,"0")}:20`,end:`${String((19+index)%24).padStart(2,"0")}:20`,startDayOffset:(18+index>=24?1:0) as 0|1,endDayOffset:(19+index>=24?1:0) as 0|1}));
  return {date,weekday:"Thursday",tithi:["Panchami","Ashtami","Ekadashi","Purnima"][month%4],tithiEnd:"14:20",tithiEndDate:date,paksha:month%2?"Shukla":"Krishna",nakshatra:["Rohini","Swati","Pushya","Revati"][month%4],nakshatraEnd:"17:45",nakshatraEndDate:date,nakshatraPada:2,rashi:["Mesha","Vrishabha","Mithuna","Karka"][month%4],solarRashi:["Makara","Mesha","Karka","Tula"][month%4],yoga:"Siddhi",karana:"Bava",sunrise:`06:${String(10+Math.abs(6-month)).padStart(2,"0")}`,sunset:`18:${String(25+Math.abs(6-month)).padStart(2,"0")}`,moonrise:"19:04",moonriseDate:date,moonset:"05:20",moonsetDate:date,moonIllumination:(month*8)%100,rahu:{start:"13:20",end:"15:00"},yamaganda:{start:"06:10",end:"07:40"},gulika:{start:"09:10",end:"10:40"},abhijit:{start:"11:50",end:"12:40"},dayChoghadiya:day,nightChoghadiya:night,hinduMonth:["Chaitra","Vaishakha","Jyeshtha","Ashadha"][month%4],vikramSamvat:2083,shakaSamvat:1948,samvatYearStart:"2026-03-19",dayLord:"Jupiter",sunriseConvention:"Upper limb + atmospheric refraction · sea-level horizon",engine:"Swiss Ephemeris · Moshier"};
}
function normalized(value:string,city:string,state:string){return value.toLowerCase().replaceAll(city.toLowerCase()," ").replaceAll(state.toLowerCase()," ").replace(/\b\d+(?::\d+)?\b/g," ").replace(/[^a-z]+/g," ").replace(/\s+/g," ").trim();}
function trigrams(value:string){const words=value.split(/\s+/).filter(Boolean),out=new Set<string>();for(let i=0;i<=words.length-3;i++)out.add(words.slice(i,i+3).join(" "));return out;}
function jaccard(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const item of left)if(right.has(item))overlap++;return overlap/(left.size+right.size-overlap||1);}
function maxPairwise(values:string[]){let max=0;for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)max=Math.max(max,jaccard(values[i],values[j]));return max;}

describe("Yearly calendar city semantic dedup layer",()=>{
  it("keeps every phase-one city distinct after city names and numbers are stripped",()=>{
    const snapshots=Array.from({length:12},(_,index)=>snapshot(index+1));
    const festivals=[{name:"Makar Sankranti",slug:"makar-sankranti",date:"2026-01-14"},{name:"Holi",slug:"holi",date:"2026-03-04"},{name:"Diwali",slug:"diwali",date:"2026-11-08"}];
    const values=phase1PriorityCities.map(slug=>{const city=findCityBySlug(slug)!;const context=buildCalendarYearCityContext(city,2026,snapshots,festivals);const text=[context.title,context.body,context.seasonalTitle,context.seasonalBody,context.lunarTitle,context.lunarBody,context.festivalTitle,context.festivalBody,...context.facts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" ");return normalized(text,city.name,city.state);});
    expect(new Set(values).size).toBe(phase1PriorityCities.length);
    expect(maxPairwise(values)).toBeLessThan(0.8);
  });

  it("renders the city context on the public yearly calendar route",()=>{
    const source=readFileSync("app/calendar/[city]/[year]/page.tsx","utf8");
    expect(source).toContain("buildCalendarYearCityContext");
    expect(source).toContain("LOCAL YEAR SIGNATURE");
  });
});
