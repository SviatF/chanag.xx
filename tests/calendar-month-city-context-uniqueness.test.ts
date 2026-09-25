import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {buildCalendarMonthCityContext} from "../lib/calendar-month-city-context";
import {findCityBySlug} from "../lib/cities";
import type {Panchang} from "../lib/panchang";
import {phase1PriorityCities} from "../lib/seo-policy";

function entry(day:number):Panchang{
  const date=`2026-09-${String(day).padStart(2,"0")}`;
  const names=["Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit"] as const;
  const dayPeriods=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String(6+index).padStart(2,"0")}:10`,end:`${String(7+index).padStart(2,"0")}:10`,startDayOffset:0 as const,endDayOffset:0 as const}));
  const nightPeriods=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String((18+index)%24).padStart(2,"0")}:20`,end:`${String((19+index)%24).padStart(2,"0")}:20`,startDayOffset:(18+index>=24?1:0) as 0|1,endDayOffset:(19+index>=24?1:0) as 0|1}));
  const tithi=day===4?"Ekadashi":day===14?"Purnima":day===24?"Amavasya":day%2?"Panchami":"Ashtami";
  return {
    date,weekday:"Thursday",tithi,tithiEnd:"14:20",tithiEndDate:day===24?`2026-09-25`:date,paksha:day<15?"Shukla":"Krishna",nakshatra:day%2?"Rohini":"Swati",nakshatraEnd:"17:45",nakshatraEndDate:day===14?`2026-09-15`:date,nakshatraPada:2,rashi:"Vrishabha",solarRashi:"Kanya",yoga:"Siddhi",karana:"Bava",
    sunrise:`06:${String(10+Math.floor(day/3)).padStart(2,"0")}`,sunset:`18:${String(35-Math.floor(day/4)).padStart(2,"0")}`,moonrise:"19:04",moonriseDate:date,moonset:"05:20",moonsetDate:date,moonIllumination:(day*7)%100,
    rahu:{start:`13:${String(20+Math.floor(day/5)).padStart(2,"0")}`,end:"15:00"},yamaganda:{start:"06:10",end:"07:40"},gulika:{start:"09:10",end:"10:40"},abhijit:day%7===0?null:{start:"11:50",end:"12:40"},
    dayChoghadiya:dayPeriods,nightChoghadiya:nightPeriods,hinduMonth:"Ashwin",vikramSamvat:2083,shakaSamvat:1948,samvatYearStart:"2026-03-19",dayLord:"Jupiter",sunriseConvention:"Upper limb + atmospheric refraction · sea-level horizon",engine:"Swiss Ephemeris · Moshier"
  };
}
function normalized(value:string,city:string,state:string){return value.toLowerCase().replaceAll(city.toLowerCase()," ").replaceAll(state.toLowerCase()," ").replace(/\b\d+(?::\d+)?\b/g," ").replace(/[^a-z]+/g," ").replace(/\s+/g," ").trim();}
function trigrams(value:string){const words=value.split(/\s+/).filter(Boolean),out=new Set<string>();for(let i=0;i<=words.length-3;i++)out.add(words.slice(i,i+3).join(" "));return out;}
function jaccard(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const item of left)if(right.has(item))overlap++;return overlap/(left.size+right.size-overlap||1);}
function maxPairwise(values:string[]){let max=0;for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)max=Math.max(max,jaccard(values[i],values[j]));return max;}

describe("Monthly calendar city semantic dedup layer",()=>{
  it("keeps every phase-one city distinct after city names and numbers are stripped",()=>{
    const entries=Array.from({length:30},(_,index)=>entry(index+1));
    const festivals=[{name:"Ganesh Chaturthi",slug:"ganesh-chaturthi",date:"2026-09-15"}];
    const values=phase1PriorityCities.map(slug=>{
      const city=findCityBySlug(slug)!;
      const context=buildCalendarMonthCityContext(city,2026,9,entries,festivals);
      const text=[context.title,context.body,context.secondaryBody,context.lunarTitle,context.lunarBody,...context.facts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" ");
      return normalized(text,city.name,city.state);
    });
    expect(new Set(values).size).toBe(phase1PriorityCities.length);
    expect(maxPairwise(values)).toBeLessThan(0.8);
  });

  it("renders the city context on the public monthly calendar route",()=>{
    const source=readFileSync("app/calendar/[city]/[year]/[month]/page.tsx","utf8");
    expect(source).toContain("buildCalendarMonthCityContext");
    expect(source).toContain("LOCAL CITY SIGNATURE");
  });
});
