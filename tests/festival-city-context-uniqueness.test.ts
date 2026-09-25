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
    .replace(/\b\d+(?::\d+)?(?:\.\d+)?%?\b/g," ")
    .replace(/[^a-z]+/g," ")
    .replace(/\s+/g," ")
    .trim();
}
function trigrams(value:string){const words=value.split(/\s+/).filter(Boolean),out=new Set<string>();for(let i=0;i<=words.length-3;i++)out.add(words.slice(i,i+3).join(" "));return out;}
function jaccard(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const item of left)if(right.has(item))overlap++;return overlap/(left.size+right.size-overlap||1);}
function maxPairwise(values:string[]){let max=0;for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)max=Math.max(max,jaccard(values[i],values[j]));return max;}
function context(festivalSlug:string,citySlug:string){
  const festival=festivalBySlugYear(festivalSlug,2026)!;
  const city=findCityBySlug(citySlug)!;
  return {city,value:buildFestivalCityContext(festival,city,panchang(),null)};
}
function localitySerialized(festivalSlug:string,citySlug:string){
  const {city,value}=context(festivalSlug,citySlug);
  const localityFacts=value.facts.filter(item=>["Geographic setting","Latitude profile","Solar-clock relation","Solar-day shape"].includes(item.label));
  const text=[value.localityTitle,value.localityBody,...localityFacts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" ");
  return normalized(text,city.name,city.state);
}
function fullSerialized(festivalSlug:string,citySlug:string){
  const {city,value}=context(festivalSlug,citySlug);
  const text=[value.focusTitle,value.focusBody,value.title,value.body,value.secondaryBody,value.localityTitle,value.localityBody,value.chronologyTitle,value.chronologyBody,value.observanceTitle,value.observanceBody,...value.facts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" ");
  return normalized(text,city.name,city.state);
}

describe("Festival city semantic dedup layer",()=>{
  it("keeps the dedicated locality lens distinct across every phase-one city",()=>{
    const values=phase1PriorityCities.map(slug=>localitySerialized("makar-sankranti",slug));
    expect(new Set(values).size).toBe(phase1PriorityCities.length);
    expect(maxPairwise(values)).toBeLessThan(0.65);
  });

  it("keeps different festival intents semantically distinct inside one city",()=>{
    const values=["diwali","janmashtami","karwa-chauth","chhath-puja","ganesh-chaturthi"].map(slug=>fullSerialized(slug,"ahmedabad"));
    expect(new Set(values).size).toBe(values.length);
    expect(maxPairwise(values)).toBeLessThan(0.78);
  });

  it("renders the locality lens instead of legacy ritual and generic city prose",()=>{
    const source=readFileSync("app/festivals/[festival]/[year]/[city]/page.tsx","utf8");
    expect(source).toContain("buildFestivalCityContext");
    expect(source).toContain("LOCAL CITY SIGNATURE");
    expect(source).toContain("FESTIVAL LOCALITY LENS");
    expect(source).toContain("cityContext.localityBody");
    expect(source).toContain("cityContext.observanceBody");
    expect(source).not.toContain("content.ritualBody");
    expect(source).not.toContain("content.cityBody");
  });
});
