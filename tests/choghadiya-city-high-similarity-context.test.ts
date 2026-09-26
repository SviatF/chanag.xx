import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {buildChoghadiyaCityHighSimilarityContext} from "../lib/choghadiya-city-high-similarity-context";
import {findCityBySlug} from "../lib/cities";
import type {Panchang} from "../lib/panchang";

const riskCities=["ahmedabad","vadodara","surat","indore","bhopal","mumbai","pune","bengaluru","hyderabad","patna","varanasi"] as const;

function panchang():Panchang{
  const date="2026-09-26";
  const names=["Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit"] as const;
  const day=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String(6+index).padStart(2,"0")}:1${index}`,end:`${String(7+index).padStart(2,"0")}:1${index}`,startDayOffset:0 as const,endDayOffset:0 as const}));
  const night=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String((18+index)%24).padStart(2,"0")}:2${index}`,end:`${String((19+index)%24).padStart(2,"0")}:2${index}`,startDayOffset:(18+index>=24?1:0) as 0|1,endDayOffset:(19+index>=24?1:0) as 0|1}));
  return {date,weekday:"Saturday",tithi:"Purnima",tithiEnd:"14:20",tithiEndDate:date,paksha:"Shukla",nakshatra:"Uttara Bhadrapada",nakshatraEnd:"17:45",nakshatraEndDate:date,nakshatraPada:2,rashi:"Meena",solarRashi:"Kanya",yoga:"Siddhi",karana:"Bava",sunrise:"06:12",sunset:"18:14",moonrise:"18:54",moonriseDate:date,moonset:"05:20",moonsetDate:date,moonIllumination:99,rahu:{start:"09:12",end:"10:42"},yamaganda:{start:"13:43",end:"15:13"},gulika:{start:"06:12",end:"07:42"},abhijit:{start:"11:49",end:"12:37"},dayChoghadiya:day,nightChoghadiya:night,hinduMonth:"Bhadrapada",vikramSamvat:2083,shakaSamvat:1948,samvatYearStart:"2026-03-19",dayLord:"Saturn",sunriseConvention:"Upper limb + atmospheric refraction · sea-level horizon",engine:"Swiss Ephemeris · Moshier"};
}

const removable=riskCities.flatMap(slug=>{const city=findCityBySlug(slug)!;return [city.name.toLowerCase(),city.state.toLowerCase()];});
function normalized(value:string){
  let out=value.toLowerCase();
  for(const token of removable)out=out.replaceAll(token," ");
  return out.replace(/\b\d+(?:\.\d+)?(?::\d+)?\b/g," ").replace(/[^a-z]+/g," ").replace(/\s+/g," ").trim();
}
function trigrams(value:string){const words=normalized(value).split(/\s+/).filter(Boolean);return new Set(words.length<3?words:words.slice(0,-2).map((_,index)=>words.slice(index,index+3).join(" ")));}
function similarity(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const item of left)if(right.has(item))overlap++;return overlap/(left.size+right.size-overlap||1);}
function text(slug:string){const city=findCityBySlug(slug)!;const context=buildChoghadiyaCityHighSimilarityContext(panchang(),city);expect(context).not.toBeNull();const c=context!;return [c.title,c.localityBody,c.solarTitle,c.solarBody,c.planningTitle,c.planningBody,...c.facts.map(item=>`${item.label} ${item.value} ${item.note??""}`)].join(" ");}

describe("Choghadiya city HIGH-similarity cleanup",()=>{
  it("keeps the rendered risk-city lenses distinct after city names, states and numbers are stripped",()=>{
    const outputs=riskCities.map(text);
    expect(new Set(outputs.map(normalized)).size).toBe(riskCities.length);
    let max=0;
    for(let i=0;i<outputs.length;i++)for(let j=i+1;j<outputs.length;j++)max=Math.max(max,similarity(outputs[i],outputs[j]));
    expect(max).toBeLessThan(0.60);
  });

  it("covers the current Gangetic rollover risk pair without broadening to clean cities",()=>{
    expect(buildChoghadiyaCityHighSimilarityContext(panchang(),findCityBySlug("delhi")!)).toBeNull();
    expect(buildChoghadiyaCityHighSimilarityContext(panchang(),findCityBySlug("patna")!)).not.toBeNull();
    expect(buildChoghadiyaCityHighSimilarityContext(panchang(),findCityBySlug("varanasi")!)).not.toBeNull();
  });

  it("renders the comparison lens on the public Choghadiya route",()=>{
    const source=readFileSync("app/tools/choghadiya/[city]/page.tsx","utf8");
    expect(source).toContain("buildChoghadiyaCityHighSimilarityContext");
    expect(source).toContain("LOCAL CLOCK COMPARISON LENS");
    expect(source).toContain("highSimilarityContext.planningBody");
  });
});
