import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {buildCalendarYearSimilarityContext} from "../lib/calendar-year-similarity-context";
import {findCityBySlug} from "../lib/cities";
import type {Panchang} from "../lib/panchang";
import {phase1PriorityCities} from "../lib/seo-policy";

function snapshot(year:number,month:number):Panchang{
  const date=`${year}-${String(month).padStart(2,"0")}-01`;
  const names=["Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit"] as const;
  const day=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String(6+index).padStart(2,"0")}:10`,end:`${String(7+index).padStart(2,"0")}:10`,startDayOffset:0 as const,endDayOffset:0 as const}));
  const night=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String((18+index)%24).padStart(2,"0")}:20`,end:`${String((19+index)%24).padStart(2,"0")}:20`,startDayOffset:(18+index>=24?1:0) as 0|1,endDayOffset:(19+index>=24?1:0) as 0|1}));
  const tithis=["Panchami","Ashtami","Ekadashi","Purnima","Dvitiya","Dashami"];
  const nakshatras=["Rohini","Swati","Pushya","Revati","Hasta","Anuradha"];
  const rashis=["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya"];
  const shift=(year+month)%6;
  return {
    date,weekday:"Thursday",tithi:tithis[(month+shift)%tithis.length],tithiEnd:"14:20",tithiEndDate:date,paksha:month%2?"Shukla":"Krishna",nakshatra:nakshatras[(month+shift*2)%nakshatras.length],nakshatraEnd:"17:45",nakshatraEndDate:date,nakshatraPada:2,rashi:rashis[(month+shift)%rashis.length],solarRashi:rashis[(month+2)%rashis.length],yoga:"Siddhi",karana:"Bava",
    sunrise:`06:${String(8+Math.abs(6-month)+(year%3)).padStart(2,"0")}`,sunset:`18:${String(20+Math.abs(6-month)+(year%2)).padStart(2,"0")}`,moonrise:"19:04",moonriseDate:date,moonset:"05:20",moonsetDate:date,moonIllumination:(month*7+year)%100,
    rahu:{start:"13:20",end:"15:00"},yamaganda:{start:"06:10",end:"07:40"},gulika:{start:"09:10",end:"10:40"},abhijit:{start:"11:50",end:"12:40"},dayChoghadiya:day,nightChoghadiya:night,hinduMonth:["Chaitra","Vaishakha","Jyeshtha","Ashadha","Shravana","Bhadrapada"][(month+shift)%6],vikramSamvat:2083,shakaSamvat:1948,samvatYearStart:`${year}-03-19`,dayLord:"Jupiter",sunriseConvention:"Upper limb + atmospheric refraction · sea-level horizon",engine:"Swiss Ephemeris · Moshier"
  };
}

function festivals(year:number){return [
  {name:"Makar Sankranti",slug:"makar-sankranti",date:`${year}-01-14`},
  {name:"Holi",slug:"holi",date:`${year}-03-${String(2+(year%4)).padStart(2,"0")}`},
  {name:"Ganesh Chaturthi",slug:"ganesh-chaturthi",date:`${year}-09-${String(8+(year%5)).padStart(2,"0")}`},
  {name:"Diwali",slug:"diwali",date:`${year}-11-${String(3+(year%6)).padStart(2,"0")}`},
];}
function normalized(value:string,city:string,state:string){return value.toLowerCase().replaceAll(city.toLowerCase()," ").replaceAll(state.toLowerCase()," ").replace(/\b\d+(?::\d+)?\b/g," ").replace(/[^a-z]+/g," ").replace(/\s+/g," ").trim();}
function trigrams(value:string){const words=value.split(/\s+/).filter(Boolean),out=new Set<string>();for(let i=0;i<=words.length-3;i++)out.add(words.slice(i,i+3).join(" "));return out;}
function jaccard(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const item of left)if(right.has(item))overlap++;return overlap/(left.size+right.size-overlap||1);}
function maxPairwise(values:string[]){let max=0;for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)max=Math.max(max,jaccard(values[i],values[j]));return max;}
function serialize(citySlug:string,year:number){const city=findCityBySlug(citySlug)!;const snapshots=Array.from({length:12},(_,i)=>snapshot(year,i+1));const context=buildCalendarYearSimilarityContext(city,year,snapshots,festivals(year));const text=[context.title,context.localityBody,context.chronologyTitle,context.chronologyBody,context.festivalTitle,context.festivalBody,...context.facts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" ");return normalized(text,city.name,city.state);}

describe("Yearly city calendar similarity layer",()=>{
  it("keeps phase-one city yearly narratives structurally differentiated",()=>{
    const values=phase1PriorityCities.map(slug=>serialize(slug,2026));
    expect(new Set(values).size).toBe(phase1PriorityCities.length);
    expect(maxPairwise(values)).toBeLessThan(0.62);
  });

  it("keeps adjacent indexed years semantically distinct for the same city",()=>{
    const values=[2025,2026,2027,2028].map(year=>serialize("mumbai",year));
    expect(new Set(values).size).toBe(4);
    expect(maxPairwise(values)).toBeLessThan(0.82);
  });

  it("renders the annual locality lens on the public yearly route",()=>{
    const source=readFileSync("app/calendar/[city]/[year]/page.tsx","utf8");
    expect(source).toContain("buildCalendarYearSimilarityContext");
    expect(source).toContain("ANNUAL LOCALITY LENS");
  });
});
