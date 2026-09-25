import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {buildDailyCityContext} from "../lib/daily-city-context";
import type {Panchang} from "../lib/panchang";
import {phase1PriorityCities} from "../lib/seo-policy";

function fixture():Panchang{
  const names=["Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit"] as const;
  const day=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String(6+index).padStart(2,"0")}:10`,end:`${String(7+index).padStart(2,"0")}:35`,startDayOffset:0 as const,endDayOffset:0 as const}));
  const night=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String((18+index)%24).padStart(2,"0")}:15`,end:`${String((19+index)%24).padStart(2,"0")}:40`,startDayOffset:(18+index>=24?1:0) as 0|1,endDayOffset:(19+index>=24?1:0) as 0|1}));
  return {date:"2026-09-25",weekday:"Friday",tithi:"Trayodashi",tithiEnd:"16:42",tithiEndDate:"2026-09-25",paksha:"Shukla",nakshatra:"Dhanishta",nakshatraEnd:"21:18",nakshatraEndDate:"2026-09-25",nakshatraPada:3,rashi:"Makara",solarRashi:"Kanya",yoga:"Dhriti",karana:"Taitila",sunrise:"06:08",sunset:"18:17",moonrise:"17:36",moonriseDate:"2026-09-25",moonset:"05:05",moonsetDate:"2026-09-25",moonIllumination:82,rahu:{start:"10:41",end:"12:12"},yamaganda:{start:"15:14",end:"16:45"},gulika:{start:"07:39",end:"09:10"},abhijit:{start:"11:48",end:"12:36"},dayChoghadiya:day,nightChoghadiya:night,hinduMonth:"Ashwin",vikramSamvat:2083,shakaSamvat:1948,samvatYearStart:"2026-03-19",dayLord:"Venus",sunriseConvention:"Upper limb + atmospheric refraction · sea-level horizon",engine:"Swiss Ephemeris · Moshier"};
}

function normalized(value:string,city:string,state:string){return value.toLowerCase().replaceAll(city.toLowerCase()," ").replaceAll(state.toLowerCase()," ").replace(/\b\d+(?::\d+)?(?:\.\d+)?%?\b/g," ").replace(/[^\p{L}\p{M}]+/gu," ").replace(/\s+/g," ").trim();}
function trigrams(value:string){const words=value.split(/\s+/).filter(Boolean);const set=new Set<string>();for(let i=0;i<=words.length-3;i++)set.add(words.slice(i,i+3).join(" "));return set;}
function similarity(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const item of left)if(right.has(item))overlap++;return overlap/(left.size+right.size-overlap||1);}

describe("Daily local-context similarity layer",()=>{
  it("keeps phase-one city narratives structurally differentiated",()=>{
    const data=fixture();
    const values=phase1PriorityCities.map(slug=>{const city=findCityBySlug(slug)!;const context=buildDailyCityContext(city,data);return normalized([context.title,context.body,context.secondaryBody,...context.facts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" "),city.name,city.state);});
    expect(new Set(values).size).toBe(phase1PriorityCities.length);
    let max=0;
    for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)max=Math.max(max,similarity(values[i],values[j]));
    expect(max).toBeLessThan(0.6);
  });

  it("renders the local context on the public daily route",()=>{
    const page=readFileSync("app/panchang/[city]/[[...date]]/page.tsx","utf8");
    expect(page).toContain("buildDailyCityContext");
    expect(page).toContain("LOCAL DAY INTERPRETATION");
  });
});
