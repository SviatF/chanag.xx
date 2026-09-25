import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {buildFestivalCityContext} from "../lib/festival-city-context";
import {buildFestivalCityHighSimilarityContext} from "../lib/festival-city-high-similarity-context";
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

function serialized(citySlug:string,lensOnly=false){
  const festival=festivalBySlugYear("makar-sankranti",2026)!;
  const city=findCityBySlug(citySlug)!;
  const data=panchang();
  const high=buildFestivalCityHighSimilarityContext(festival,city,data);
  const highText=[high.title,high.localityBody,high.timingTitle,high.timingBody,...high.facts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" ");
  if(lensOnly)return normalized(highText,city.name,city.state);
  const base=buildFestivalCityContext(festival,city,data,null);
  const baseText=[base.focusTitle,base.focusBody,base.title,base.body,base.secondaryBody,base.localityTitle,base.localityBody,base.chronologyTitle,base.chronologyBody,base.observanceTitle,base.observanceBody,...base.facts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" ");
  return normalized(`${baseText} ${highText}`,city.name,city.state);
}

describe("Festival city HIGH-similarity cleanup",()=>{
  it("keeps the new comparison lens strongly separated after city/state/numbers are stripped",()=>{
    const values=phase1PriorityCities.map(slug=>serialized(slug,true));
    expect(new Set(values).size).toBe(phase1PriorityCities.length);
    expect(maxPairwise(values)).toBeLessThan(0.58);
  });

  it("pushes the known full-context high-risk city pairs below a stricter ceiling",()=>{
    expect(jaccard(serialized("lucknow"),serialized("varanasi"))).toBeLessThan(0.68);
    expect(jaccard(serialized("nagpur"),serialized("bhopal"))).toBeLessThan(0.68);
    expect(jaccard(serialized("indore"),serialized("vadodara"))).toBeLessThan(0.68);
  });

  it("renders the comparison lens as visible festival content",()=>{
    const source=readFileSync("app/festivals/[festival]/[year]/[city]/page.tsx","utf8");
    expect(source).toContain("buildFestivalCityHighSimilarityContext");
    expect(source).toContain("FESTIVAL CITY COMPARISON LENS");
    expect(source).toContain("comparisonContext.localityBody");
    expect(source).toContain("comparisonContext.timingBody");
  });
});
