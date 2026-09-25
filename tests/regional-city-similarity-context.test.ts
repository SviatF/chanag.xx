import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {buildRegionalCityContext} from "../lib/regional-city-context";
import {nativeCityName} from "../lib/regional-i18n";
import type {Panchang} from "../lib/panchang";
import type {RegionalLanguageSlug} from "../lib/regional-seo";

const data={
  date:"2026-09-25",weekday:"Friday",tithi:"Purnima",tithiEnd:"19:40",tithiEndDate:"2026-09-25",paksha:"Shukla",nakshatra:"Revati",nakshatraEnd:"23:15",nakshatraEndDate:"2026-09-25",nakshatraPada:2,rashi:"Meena",solarRashi:"Kanya",yoga:"Dhruva",karana:"Bava",
  sunrise:"06:22",sunset:"18:27",moonrise:"18:10",moonriseDate:"2026-09-25",moonset:"06:01",moonsetDate:"2026-09-26",moonIllumination:96,
  rahu:{start:"10:54",end:"12:25"},yamaganda:{start:"15:26",end:"16:57"},gulika:{start:"07:53",end:"09:24"},abhijit:{start:"11:58",end:"12:46"},
  dayChoghadiya:[
    {name:"Char",effect:"neutral",start:"06:22",end:"07:53",startDayOffset:0,endDayOffset:0},
    {name:"Labh",effect:"good",start:"07:53",end:"09:24",startDayOffset:0,endDayOffset:0},
    {name:"Amrit",effect:"good",start:"09:24",end:"10:54",startDayOffset:0,endDayOffset:0},
    {name:"Kaal",effect:"bad",start:"10:54",end:"12:25",startDayOffset:0,endDayOffset:0},
    {name:"Shubh",effect:"good",start:"12:25",end:"13:56",startDayOffset:0,endDayOffset:0},
    {name:"Rog",effect:"bad",start:"13:56",end:"15:26",startDayOffset:0,endDayOffset:0},
    {name:"Udveg",effect:"bad",start:"15:26",end:"16:57",startDayOffset:0,endDayOffset:0},
    {name:"Char",effect:"neutral",start:"16:57",end:"18:27",startDayOffset:0,endDayOffset:0},
  ],
  nightChoghadiya:[
    {name:"Rog",effect:"bad",start:"18:27",end:"19:56",startDayOffset:0,endDayOffset:0},
    {name:"Kaal",effect:"bad",start:"19:56",end:"21:25",startDayOffset:0,endDayOffset:0},
    {name:"Labh",effect:"good",start:"21:25",end:"22:54",startDayOffset:0,endDayOffset:0},
    {name:"Udveg",effect:"bad",start:"22:54",end:"00:23",startDayOffset:0,endDayOffset:1},
    {name:"Shubh",effect:"good",start:"00:23",end:"01:52",startDayOffset:1,endDayOffset:1},
    {name:"Amrit",effect:"good",start:"01:52",end:"03:21",startDayOffset:1,endDayOffset:1},
    {name:"Char",effect:"neutral",start:"03:21",end:"04:50",startDayOffset:1,endDayOffset:1},
    {name:"Rog",effect:"bad",start:"04:50",end:"06:19",startDayOffset:1,endDayOffset:1},
  ],
  hinduMonth:"Bhadrapada",vikramSamvat:2083,shakaSamvat:1948,samvatYearStart:"2026-03-19",dayLord:"Venus",sunriseConvention:"Upper limb + atmospheric refraction · sea-level horizon",engine:"Swiss Ephemeris · Moshier"
} as Panchang;

function month(language:RegionalLanguageSlug){return language==="gujarati"?"ભાદરવો":language==="marathi"?"भाद्रपद":"Bhadrapada";}
function text(language:RegionalLanguageSlug,slug:string){
  const city=findCityBySlug(slug)!;
  const c=buildRegionalCityContext(language,city,data,month(language));
  return [c.localityTitle,c.localityBody,c.solarTitle,c.solarBody,c.lunarTitle,c.lunarBody,c.dayTitle,c.dayBody,...c.facts.map(f=>`${f.label} ${f.value} ${f.note??""}`)].join(" ");
}
function normalized(language:RegionalLanguageSlug,slug:string,value:string){
  const city=findCityBySlug(slug)!,native=nativeCityName(language,city);
  return value.toLowerCase().replaceAll(native.toLowerCase()," ").replace(new RegExp(city.name,"gi")," ").replace(/\b\d+(?::\d+)?(?:\.\d+)?\b/g," ").replace(/[^\p{L}\p{M}]+/gu," ").replace(/\s+/g," ").trim();
}
function trigrams(value:string){const words=value.split(" ").filter(Boolean);return new Set(words.length<3?words:words.slice(0,-2).map((_,i)=>words.slice(i,i+3).join(" ")));}
function similarity(a:string,b:string){const left=trigrams(a),right=trigrams(b);let overlap=0;for(const item of left)if(right.has(item))overlap++;return overlap/(left.size+right.size-overlap||1);}
function assertDistinct(language:RegionalLanguageSlug,slugs:string[]){
  const outputs=slugs.map(slug=>normalized(language,slug,text(language,slug)));
  expect(new Set(outputs).size).toBe(slugs.length);
  let max=0;for(let i=0;i<outputs.length;i++)for(let j=i+1;j<outputs.length;j++)max=Math.max(max,similarity(outputs[i],outputs[j]));
  expect(max).toBeLessThan(0.72);
}

describe("regional city base similarity context",()=>{
  it("keeps Gujarati city Panchang contexts distinct after city names and numbers are stripped",()=>{assertDistinct("gujarati",["ahmedabad","surat","vadodara"]);});
  it("keeps Marathi city Panchang contexts distinct after city names and numbers are stripped",()=>{assertDistinct("marathi",["mumbai","pune","nagpur","thane"]);});
  it("renders the locality, lunar and day context on the regional city route",()=>{
    const source=readFileSync("app/regional/[language]/[city]/page.tsx","utf8");
    expect(source).toContain("buildRegionalCityContext");
    expect(source).toContain("cityContext.localityBody");
    expect(source).toContain("cityContext.lunarBody");
    expect(source).toContain("cityContext.dayBody");
  });
});
