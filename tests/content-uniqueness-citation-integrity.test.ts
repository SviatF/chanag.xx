import {readFileSync,readdirSync,statSync} from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";
import {findCityBySlug,type City} from "../lib/cities";
import {buildChoghadiyaNarrative,buildDailyDataNarrative,buildFestivalCityNarrative,buildVratCityNarrative,jaccardTextSimilarity} from "../lib/content-uniqueness";
import {festivalBySlugYear} from "../lib/festivals";
import {buildMuhuratSeoSummary} from "../lib/muhurat-seo";
import type {MuhuratRow} from "../lib/muhurat";
import type {Panchang} from "../lib/panchang";
import {regionalPureLocale} from "../lib/regional-pure-copy";
import {regionalLanguageSlugs} from "../lib/regional-seo";
import {findVratBySlug,type VratOccurrence} from "../lib/vrat";

const competitor=/Drik\s*Panchang|drikpanchang|Astro\s*Sage|Astrosage|mPanchang|ProKerala|ড্রিক|দৃক|ட்ரிக்|திரிக்|ഡ്രിക്|ദ്രിക്|ડ્રિક|દ્રિક|ड्रिक|दृक/i;

function source(relative:string){return readFileSync(path.join(process.cwd(),relative),"utf8");}
function countMatches(value:string,pattern:RegExp){return value.match(pattern)?.length??0;}
function sourceWithoutEngineeringComments(value:string){
  return value.replace(/^\s*\/\/.*$/gm,"").replace(/\/\*[\s\S]*?\*\//g,"");
}
function sourceFiles(root:string):string[]{
  const absolute=path.join(process.cwd(),root);
  return readdirSync(absolute).flatMap(name=>{
    const relative=path.join(root,name),target=path.join(process.cwd(),relative);
    if(statSync(target).isDirectory())return sourceFiles(relative);
    return /\.(?:ts|tsx|json)$/.test(name)?[relative]:[];
  });
}
function maxPairwise(values:string[],ignored:string[]){
  let max=0;
  for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)max=Math.max(max,jaccardTextSimilarity(values[i],values[j],ignored));
  return max;
}

const cities=["mumbai","delhi","kolkata","chennai","hyderabad"].map(slug=>findCityBySlug(slug)!).filter(Boolean);
const weekdays=["Monday","Tuesday","Wednesday","Thursday","Friday"];
const tithis=["Ekadashi","Panchami","Trayodashi","Ashtami","Purnima"];
const nakshatras=["Rohini","Swati","Anuradha","Pushya","Revati"];
const goodNames=["Amrit","Shubh","Labh","Char","Amrit"];

function panchangFixture(index:number,city:City):Panchang{
  const sunrise=["06:20","05:58","05:24","05:55","06:02"][index];
  const sunset=["18:39","18:25","17:47","18:07","18:16"][index];
  const start=["07:50","09:12","10:03","11:31","13:06"][index];
  const periods=Array.from({length:8},(_,periodIndex)=>({
    name:periodIndex===index%8?goodNames[index]:["Kaal","Rog","Udveg","Char"][periodIndex%4],
    start:`${String(6+periodIndex).padStart(2,"0")}:${String((index*7+periodIndex*3)%60).padStart(2,"0")}`,
    end:`${String(7+periodIndex).padStart(2,"0")}:${String((index*11+periodIndex*5)%60).padStart(2,"0")}`,
    effect:periodIndex===index%8||periodIndex===(index+3)%8?"good":"bad",
  }));
  return {
    date:`2026-09-${String(10+index).padStart(2,"0")}`,
    weekday:weekdays[index],tithi:tithis[index],paksha:index%2?"Krishna":"Shukla",nakshatra:nakshatras[index],
    sunrise,sunset,moonIllumination:[16,38,62,81,94][index],
    rahu:{start,end:["09:21","10:41","11:30","13:01","14:36"][index]},
    abhijit:index===2?null:{start:["11:51","11:45","11:40","11:36","11:48"][index],end:["12:40","12:34","12:29","12:25","12:37"][index]},
    dayChoghadiya:periods,
  } as unknown as Panchang;
}

function vratRows(index:number):VratOccurrence[]{
  const count=3+index;
  return Array.from({length:count},(_,rowIndex)=>({
    date:`2026-${String(1+rowIndex*2).padStart(2,"0")}-${String(5+index).padStart(2,"0")}`,
    weekday:weekdays[(rowIndex+index)%weekdays.length],
    paksha:(rowIndex+index)%2?"Krishna":"Shukla",
    tithi:"Ekadashi",
    sunrise:["06:20","05:58","05:24","05:55","06:02"][index],
    tithiEnd:"14:20",tithiEndDate:`2026-${String(1+rowIndex*2).padStart(2,"0")}-${String(5+index).padStart(2,"0")}`,
    repeatedAtSunrise:index%2===0&&rowIndex===1,
    sequence:rowIndex+1,
  }));
}

function muhuratRows(index:number):MuhuratRow[]{
  const count=1+index;
  return Array.from({length:count},(_,rowIndex)=>({
    date:`2026-09-${String(4+index*3+rowIndex).padStart(2,"0")}`,
    recommendedWindows:rowIndex===0&&index===4?[]:[{start:`0${7+index}:10`,end:`${9+index}:00`,sources:[index%2?"Amrit Choghadiya":"Abhijit Muhurat"]}],
    avoidWindows:[],reasons:[`${tithis[index]} Tithi`,`${nakshatras[index]} Nakshatra`],
    planning:{score:92-index*7-rowIndex*3,grade:index===0?"Excellent":index<3?"Strong":"Good",totalCleanMinutes:210-index*27,longestWindowMinutes:index===4?0:130-index*22,sourceCount:2,hasAbhijit:index%2===0,idealContinuousMinutes:90,factors:[]},
  })) as unknown as MuhuratRow[];
}

describe("global content uniqueness and citation integrity",()=>{
  it("contains no competitor brand or outbound competitor citation in rendered-source layers",()=>{
    const files=[...sourceFiles("app"),...sourceFiles("components"),...sourceFiles("lib")];
    for(const file of files){
      const text=sourceWithoutEngineeringComments(source(file));
      expect(text,`${file} contains a competitor reference`).not.toMatch(competitor);
      expect(text,`${file} contains a competitor domain`).not.toMatch(/drikpanchang\.com|astrosage\.|mpanchang\.|prokerala\./i);
    }
    for(const language of regionalLanguageSlugs){
      const copy=regionalPureLocale(language);
      const strings=Object.values(copy).filter((value):value is string=>typeof value==="string").join(" ");
      expect(strings,`${language} regional locale contains competitor copy`).not.toMatch(competitor);
    }
  });

  it("keeps the Muhurat scope disclosure once, after primary content rather than in the hero",()=>{
    const pages=[
      "app/muhurat/page.tsx",
      "app/muhurat/[event]/[year]/page.tsx",
      "app/muhurat/[event]/[year]/[month]/page.tsx",
      "app/muhurat/[event]/[year]/[month]/[city]/page.tsx",
    ];
    for(const file of pages){
      const text=source(file);
      const render=text.slice(text.indexOf("return <main"));
      const firstContent=render.indexOf("<section");
      const hero=firstContent>0?render.slice(0,firstContent):render.slice(0,render.indexOf("<div className=\"data-grid\""));
      const noteIndex=render.indexOf("<MethodologyNote");
      expect(noteIndex,`${file} must render a final methodology disclosure`).toBeGreaterThan(0);
      expect(countMatches(render,/<MethodologyNote/g),`${file} methodology disclosure count`).toBe(1);
      expect(hero,`${file} hero must not lead with the Muhurat limitation`).not.toContain("muhuratScreeningStatement");
      expect(render.slice(noteIndex),`${file} final disclosure must retain the scope statement`).toContain("muhuratScreeningStatement");
      expect(noteIndex,`${file} disclosure must follow the page H1`).toBeGreaterThan(render.indexOf("page-title"));
    }
    const seo=source("lib/muhurat-seo.ts");
    expect(seo).not.toMatch(/not a complete Panchang Shuddhi|religiously certified Muhurat|personalized ceremony certification/i);
  });

  it("keeps generated prose below the 80 percent boilerplate threshold across representative variants",()=>{
    const ignored=cities.flatMap(city=>[city.name,city.state]);
    const daily=cities.map((city,index)=>buildDailyDataNarrative(panchangFixture(index,city),city));
    const choghadiya=cities.map((city,index)=>buildChoghadiyaNarrative(panchangFixture(index,city),city));
    const vrat=findVratBySlug("ekadashi")!;
    const vratCopy=cities.map((city,index)=>buildVratCityNarrative(vrat,2026,city,vratRows(index)));
    const muhurat=cities.map((city,index)=>{
      const value=buildMuhuratSeoSummary("wedding",2026,9,city,muhuratRows(index),"city");
      return [value.headline,value.overview,value.rankingInsight,value.timingInsight,value.alternatives].join(" ");
    });
    const festival=festivalBySlugYear("ganesh-chaturthi",2026)!;
    const festivalCopy=cities.map((city,index)=>{
      const data={...panchangFixture(index,city),date:festival.date} as Panchang;
      const value=buildFestivalCityNarrative(festival,data,city,{label:"Local festival reference",value:`${data.sunrise}–${data.sunset}`});
      return [value.heading,...value.paragraphs].join(" ");
    });
    expect(maxPairwise(daily,ignored)).toBeLessThan(0.8);
    expect(maxPairwise(choghadiya,ignored)).toBeLessThan(0.8);
    expect(maxPairwise(vratCopy,ignored)).toBeLessThan(0.8);
    expect(maxPairwise(muhurat,ignored)).toBeLessThan(0.8);
    expect(maxPairwise(festivalCopy,ignored)).toBeLessThan(0.8);
  });

  it("keeps active festival SEO experiments isolated from generalized local enrichment",()=>{
    const festivalPage=source("app/festivals/[festival]/[year]/[city]/page.tsx");
    expect(festivalPage).toContain("const isSeoExperiment=isGaneshAhmedabad||isDussehraHyderabad");
    expect(festivalPage).toContain("const localNarrative=isSeoExperiment?null:buildFestivalCityNarrative");
    expect(festivalPage).toContain("Ganesh Chaturthi 2026 timing in Ahmedabad");
    expect(festivalPage).toContain("Dasara 2026 date in Telangana");
  });
});
