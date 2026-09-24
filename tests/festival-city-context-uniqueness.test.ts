import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {buildFestivalCityContext} from "../lib/festival-city-context";
import {festivalBySlugYear} from "../lib/festivals";
import type {Panchang} from "../lib/panchang";
import {phase1PriorityCities} from "../lib/seo-policy";

function panchang():Panchang{
  const date="2026-01-14";
  const names=["Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit"] as const;
  const day=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String(6+index).padStart(2,"0")}:10`,end:`${String(7+index).padStart(2,"0")}:10`,startDayOffset:0 as const,endDayOffset:0 as const}));
  const night=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String((18+index)%24).padStart(2,"0")}:20`,end:`${String((19+index)%24).padStart(2,"0")}:20`,startDayOffset:(18+index>=24?1:0) as 0|1,endDayOffset:(19+index>=24?1:0) as 0|1}));
  return {date,weekday:"Wednesday",tithi:"Ekadashi",tithiEnd:"14:20",tithiEndDate:date,paksha:"Shukla",nakshatra:"Rohini",nakshatraEnd:"17:45",nakshatraEndDate:date,nakshatraPada:2,rashi:"Vrishabha",solarRashi:"Makara",yoga:"Siddhi",karana:"Bava",sunrise:"06:28",sunset:"18:12",moonrise:"19:04",moonriseDate:date,moonset:"05:20",moonsetDate:date,moonIllumination:62,rahu:{start:"13:30",end:"15:00"},yamaganda:{start:"06:10",end:"07:40"},gulika:{start:"09:10",end:"10:40"},abhijit:{start:"11:50",end:"12:40"},dayChoghadiya:day,nightChoghadiya:night,hinduMonth:"Pausha",vikramSamvat:2082,shakaSamvat:1947,samvatYearStart:"2025-03-30",dayLord:"Mercury",sunriseConvention:"Upper limb + atmospheric refraction · sea-level horizon",engine:"Swiss Ephemeris · Moshier"};
}

function normalized(value:string,city:string,state:string){
  return value.toLowerCase()
    .replaceAll(city.toLowerCase()," ")
    .replaceAll(state.toLowerCase()," ")
    .replace(/\b\d+(?::\d+)?\b/g," ")
    .replace(/[^a-z]+/g," ")
    .replace(/\s+/g," ")
    .trim();
}

describe("Festival city semantic dedup layer",()=>{
  it("keeps all phase-one city contexts distinct after route names and numbers are stripped",()=>{
    const festival=festivalBySlugYear("makar-sankranti",2026)!;
    const values=phase1PriorityCities.map(slug=>{
      const city=findCityBySlug(slug)!;
      const context=buildFestivalCityContext(festival,city,panchang(),null);
      const text=[context.focusTitle,context.focusBody,context.title,context.body,context.secondaryBody,...context.facts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" ");
      return normalized(text,city.name,city.state);
    });
    expect(new Set(values).size).toBe(phase1PriorityCities.length);
  });

  it("renders the new semantic context instead of legacy ritual and generic city prose",()=>{
    const source=readFileSync("app/festivals/[festival]/[year]/[city]/page.tsx","utf8");
    expect(source).toContain("buildFestivalCityContext");
    expect(source).toContain("LOCAL CITY SIGNATURE");
    expect(source).not.toContain("content.ritualBody");
    expect(source).not.toContain("content.cityBody");
  });
});
