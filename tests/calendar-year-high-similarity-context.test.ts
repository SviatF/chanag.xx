import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {buildCalendarYearHighSimilarityContext} from "../lib/calendar-year-high-similarity-context";
import {findCityBySlug} from "../lib/cities";
import {wave2ControlledCities} from "../lib/seo-policy";
import type {Panchang} from "../lib/panchang";

function snapshot(year:number,month:number,cityShift:number):Panchang{
  const date=`${year}-${String(month).padStart(2,"0")}-01`;
  const names=["Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit"] as const;
  const day=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String(6+index).padStart(2,"0")}:10`,end:`${String(7+index).padStart(2,"0")}:10`,startDayOffset:0 as const,endDayOffset:0 as const}));
  const night=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String((18+index)%24).padStart(2,"0")}:20`,end:`${String((19+index)%24).padStart(2,"0")}:20`,startDayOffset:(18+index>=24?1:0) as 0|1,endDayOffset:(19+index>=24?1:0) as 0|1}));
  const tithis=["Panchami","Ashtami","Ekadashi","Purnima","Dvitiya","Dashami"];
  const nakshatras=["Rohini","Swati","Pushya","Revati","Hasta","Anuradha"];
  const rashis=["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya"];
  const shift=(year+month+cityShift)%6;
  return {date,weekday:"Thursday",tithi:tithis[(month+shift)%6],tithiEnd:"14:20",tithiEndDate:date,paksha:month%2?"Shukla":"Krishna",nakshatra:nakshatras[(month+shift*2)%6],nakshatraEnd:"17:45",nakshatraEndDate:date,nakshatraPada:2,rashi:rashis[(month+shift)%6],solarRashi:rashis[(month+2)%6],yoga:"Siddhi",karana:"Bava",sunrise:`06:${String(6+Math.abs(6-month)+cityShift).padStart(2,"0")}`,sunset:`18:${String(17+Math.abs(6-month)+(cityShift%2)).padStart(2,"0")}`,moonrise:"19:04",moonriseDate:date,moonset:"05:20",moonsetDate:date,moonIllumination:(month*7+year+cityShift)%100,rahu:{start:"13:20",end:"15:00"},yamaganda:{start:"06:10",end:"07:40"},gulika:{start:"09:10",end:"10:40"},abhijit:{start:"11:50",end:"12:40"},dayChoghadiya:day,nightChoghadiya:night,hinduMonth:["Chaitra","Vaishakha","Jyeshtha","Ashadha","Shravana","Bhadrapada"][(month+shift)%6],vikramSamvat:2083,shakaSamvat:1948,samvatYearStart:`${year}-03-19`,dayLord:"Jupiter",sunriseConvention:"Upper limb + atmospheric refraction · sea-level horizon",engine:"Swiss Ephemeris · Moshier"};
}

function festivals(year:number){return [
  {name:"Makar Sankranti",slug:"makar-sankranti",date:`${year}-01-14`},
  {name:"Holi",slug:"holi",date:`${year}-03-04`},
  {name:"Ganesh Chaturthi",slug:"ganesh-chaturthi",date:`${year}-09-12`},
  {name:"Diwali",slug:"diwali",date:`${year}-11-08`},
];}
const comparisonCities=["pune","thane",...wave2ControlledCities] as const;
const removable=comparisonCities.flatMap(slug=>{const city=findCityBySlug(slug)!;return [city.name.toLowerCase(),city.state.toLowerCase()]}).sort((a,b)=>b.length-a.length);
function normalized(value:string){let out=value.toLowerCase();for(const token of removable)out=out.replaceAll(token," ");return out.replace(/\b\d+(?:\.\d+)?(?::\d+)?\b/g," ").replace(/[^a-z]+/g," ").replace(/\s+/g," ").trim();}
function trigrams(value:string){const words=value.split(/\s+/).filter(Boolean),out=new Set<string>();for(let i=0;i<=words.length-3;i++)out.add(words.slice(i,i+3).join(" "));return out;}
function similarity(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const item of left)if(right.has(item))overlap++;return overlap/(left.size+right.size-overlap||1);}
function text(slug:string,year:number){const city=findCityBySlug(slug)!;const shift=2;const snapshots=Array.from({length:12},(_,i)=>snapshot(year,i+1,shift));const context=buildCalendarYearHighSimilarityContext(city,year,snapshots,festivals(year));expect(context).not.toBeNull();const x=context!;return normalized([x.title,x.localityBody,x.solarTitle,x.solarBody,x.lunarTitle,x.lunarBody,x.festivalTitle,x.festivalBody,...x.facts.map(f=>`${f.label} ${f.value} ${f.note??""}`)].join(" "));}

describe("final yearly calendar city HIGH cleanup",()=>{
  it("keeps Pune and Thane semantically separate after city names and numbers are stripped",()=>{
    for(const year of [2026,2027])expect(similarity(text("pune",year),text("thane",year))).toBeLessThan(0.58);
  });

  it("keeps all targeted annual locality lenses separated even on identical snapshots",()=>{
    const values=comparisonCities.map(slug=>text(slug,2026));
    expect(new Set(values).size).toBe(comparisonCities.length);
    let max=0;
    for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)max=Math.max(max,similarity(values[i],values[j]));
    expect(max).toBeLessThan(0.58);
  });

  it("adds yearly comparison lenses only to explicit risk cities",()=>{
    const mumbai=findCityBySlug("mumbai")!;
    const snapshots=Array.from({length:12},(_,i)=>snapshot(2026,i+1,2));
    expect(buildCalendarYearHighSimilarityContext(mumbai,2026,snapshots,festivals(2026))).toBeNull();
    for(const slug of wave2ControlledCities){
      expect(buildCalendarYearHighSimilarityContext(findCityBySlug(slug)!,2026,snapshots,festivals(2026))).not.toBeNull();
    }
  });

  it("renders the targeted yearly comparison lens on the public route",()=>{
    const source=readFileSync("app/calendar/[city]/[year]/page.tsx","utf8");
    expect(source).toContain("buildCalendarYearHighSimilarityContext");
    expect(source).toContain("highSimilarityContext");
  });
});
