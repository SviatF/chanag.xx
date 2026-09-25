import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {buildChoghadiyaCityContext} from "../lib/choghadiya-city-context";
import {findCityBySlug} from "../lib/cities";
import type {Panchang} from "../lib/panchang";
import {phase1PriorityCities} from "../lib/seo-policy";

function panchang():Panchang{
  const date="2026-09-25";
  const names=["Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit"] as const;
  const day=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String(6+index).padStart(2,"0")}:1${index}`,end:`${String(7+index).padStart(2,"0")}:1${index}`,startDayOffset:0 as const,endDayOffset:0 as const}));
  const night=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String((18+index)%24).padStart(2,"0")}:2${index}`,end:`${String((19+index)%24).padStart(2,"0")}:2${index}`,startDayOffset:(18+index>=24?1:0) as 0|1,endDayOffset:(19+index>=24?1:0) as 0|1}));
  return {date,weekday:"Friday",tithi:"Chaturdashi",tithiEnd:"14:20",tithiEndDate:date,paksha:"Shukla",nakshatra:"Purva Bhadrapada",nakshatraEnd:"17:45",nakshatraEndDate:date,nakshatraPada:2,rashi:"Kumbha",solarRashi:"Kanya",yoga:"Siddhi",karana:"Bava",sunrise:"06:12",sunset:"18:14",moonrise:"18:54",moonriseDate:date,moonset:"05:20",moonsetDate:date,moonIllumination:92,rahu:{start:"10:42",end:"12:13"},yamaganda:{start:"15:14",end:"16:44"},gulika:{start:"07:42",end:"09:12"},abhijit:{start:"11:49",end:"12:37"},dayChoghadiya:day,nightChoghadiya:night,hinduMonth:"Bhadrapada",vikramSamvat:2083,shakaSamvat:1948,samvatYearStart:"2026-03-19",dayLord:"Venus",sunriseConvention:"Upper limb + atmospheric refraction · sea-level horizon",engine:"Swiss Ephemeris · Moshier"};
}

function normalized(value:string,city:string,state:string){return value.toLowerCase().replaceAll(city.toLowerCase()," ").replaceAll(state.toLowerCase()," ").replace(/\b\d+(?:\.\d+)?(?::\d+)?\b/g," ").replace(/[^a-z]+/g," ").replace(/\s+/g," ").trim();}
function trigrams(value:string){const words=value.split(/\s+/).filter(Boolean),out=new Set<string>();for(let i=0;i<=words.length-3;i++)out.add(words.slice(i,i+3).join(" "));return out;}
function jaccard(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const item of left)if(right.has(item))overlap++;return overlap/(left.size+right.size-overlap||1);}
function maxPairwise(values:string[]){let max=0;for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)max=Math.max(max,jaccard(values[i],values[j]));return max;}

describe("Choghadiya city semantic dedup layer",()=>{
  it("keeps phase-one locality lenses distinct after city names and numbers are stripped",()=>{
    const values=phase1PriorityCities.map(slug=>{
      const city=findCityBySlug(slug)!;
      const context=buildChoghadiyaCityContext(panchang(),city);
      const text=[context.localityTitle,context.localityBody,...context.facts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" ");
      return normalized(text,city.name,city.state);
    });
    expect(new Set(values).size).toBe(phase1PriorityCities.length);
    expect(maxPairwise(values)).toBeLessThan(0.68);
  });

  it("keeps boundary and weekday layers data-driven",()=>{
    const city=findCityBySlug("ahmedabad")!;
    const context=buildChoghadiyaCityContext(panchang(),city);
    expect(context.boundaryBody).toContain("06:12");
    expect(context.weekdayBody).toContain("Friday");
    expect(context.weekdayBody).toContain("Amrit");
  });

  it("renders the locality lens on the public Choghadiya city route",()=>{
    const source=readFileSync("app/tools/choghadiya/[city]/page.tsx","utf8");
    expect(source).toContain("buildChoghadiyaCityContext");
    expect(source).toContain("CHOGHADIYA LOCALITY LENS");
  });
});
