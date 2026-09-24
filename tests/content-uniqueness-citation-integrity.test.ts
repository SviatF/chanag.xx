import {readFileSync,readdirSync,statSync} from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";
import {buildDailyPanchangQualityContent} from "../lib/calendar-content-engine";
import {buildChoghadiyaQualityContent} from "../lib/choghadiya-content-engine";
import {findCityBySlug,type City} from "../lib/cities";
import {jaccardTextSimilarity} from "../lib/content-uniqueness";
import {buildFestivalCityQualityContent} from "../lib/festival-content-engine";
import {festivalBySlugYear} from "../lib/festivals";
import {buildMuhuratMonthlyQualityContent} from "../lib/muhurat-content-engine";
import type {MuhuratRow} from "../lib/muhurat";
import type {Panchang} from "../lib/panchang";
import {regionalPureLocale} from "../lib/regional-pure-copy";
import {regionalLanguageSlugs} from "../lib/regional-seo";
import {findVratBySlug,type VratOccurrence} from "../lib/vrat";
import {buildVratQualityContent} from "../lib/vrat-content-engine";

const competitor=/Drik\s*Panchang|drikpanchang|Astro\s*Sage|Astrosage|mPanchang|ProKerala|ড্রিক|দৃক|ட்ரிக்|திரிக்|ഡ്രിക്|ദ്രിക്|ડ્રિક|દ્રિક|ड्रिक|दृक/i;

function source(relative:string){return readFileSync(path.join(process.cwd(),relative),"utf8");}
function sourceWithoutEngineeringComments(value:string){return value.replace(/^\s*\/\/.*$/gm,"").replace(/\/\*[\s\S]*?\*\//g,"");}
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
function hhmm(total:number){const value=((total%1440)+1440)%1440;return `${String(Math.floor(value/60)).padStart(2,"0")}:${String(value%60).padStart(2,"0")}`;}

const cities=["mumbai","delhi","kolkata","chennai","hyderabad"].map(slug=>findCityBySlug(slug)!).filter(Boolean);
const weekdays=["Monday","Tuesday","Wednesday","Thursday","Friday"];
const tithis=["Ekadashi","Panchami","Trayodashi","Ashtami","Purnima"];
const nakshatras=["Rohini","Swati","Anuradha","Pushya","Revati"];
const goodNames=["Amrit","Shubh","Labh","Char","Amrit"];
const periodNames=["Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit"] as const;

function panchangFixture(index:number,city:City):Panchang{
  const sunrise=["06:20","05:58","05:24","05:55","06:02"][index];
  const sunset=["18:39","18:25","17:47","18:07","18:16"][index];
  const start=["07:50","09:12","10:03","11:31","13:06"][index];
  const dayStart=6*60+index*3;
  const dayPeriods=Array.from({length:8},(_,periodIndex)=>{
    const startMin=dayStart+periodIndex*90,endMin=startMin+90;
    const name=periodIndex===index%8?goodNames[index]:periodNames[periodIndex];
    return {name,start:hhmm(startMin),end:hhmm(endMin),effect:periodIndex===index%8||periodIndex===(index+3)%8?"good":name==="Char"?"neutral":"bad",startDayOffset:0,endDayOffset:0};
  });
  const nightStart=18*60+index*4;
  const nightPeriods=Array.from({length:8},(_,periodIndex)=>{
    const startMin=nightStart+periodIndex*90,endMin=startMin+90;
    const name=periodNames[(periodIndex+index+2)%periodNames.length];
    return {name,start:hhmm(startMin),end:hhmm(endMin),effect:periodIndex===(index+1)%8||periodIndex===(index+4)%8?"good":name==="Char"?"neutral":"bad",startDayOffset:(startMin>=1440?1:0) as 0|1,endDayOffset:(endMin>=1440?1:0) as 0|1};
  });
  const date=`2026-09-${String(10+index).padStart(2,"0")}`;
  return {
    date,weekday:weekdays[index],tithi:tithis[index],paksha:index%2?"Krishna":"Shukla",nakshatra:nakshatras[index],nakshatraPada:index%4+1,
    tithiEnd:["14:11","16:24","19:07","21:31","23:18"][index],tithiEndDate:date,nakshatraEnd:["09:42","12:18","15:26","18:33","22:04"][index],nakshatraEndDate:date,
    rashi:["Mesha","Vrishabha","Mithuna","Karka","Simha"][index],solarRashi:["Kanya","Tula","Vrishchika","Dhanu","Makara"][index],yoga:["Siddhi","Shubha","Dhruva","Harshana","Sukarma"][index],karana:["Bava","Balava","Kaulava","Taitila","Garaja"][index],
    sunrise,sunset,moonIllumination:[16,38,62,81,94][index],moonrise:["19:11","20:02","20:51","21:36","22:19"][index],moonriseDate:date,moonset:["05:02","05:44","06:18","07:02","07:48"][index],moonsetDate:date,
    rahu:{start,end:["09:21","10:41","11:30","13:01","14:36"][index]},yamaganda:{start:"10:45",end:"12:15"},gulika:{start:"15:15",end:"16:45"},
    abhijit:index===2?null:{start:["11:51","11:45","11:40","11:36","11:48"][index],end:["12:40","12:34","12:29","12:25","12:37"][index]},
    dayChoghadiya:dayPeriods as Panchang["dayChoghadiya"],nightChoghadiya:nightPeriods as Panchang["nightChoghadiya"],
    hinduMonth:["Bhadrapada","Ashwin","Kartika","Margashirsha","Pausha"][index],vikramSamvat:2083,shakaSamvat:1948,samvatYearStart:"2026-03-19",dayLord:["Moon","Mars","Mercury","Jupiter","Venus"][index],sunriseConvention:"Upper limb + atmospheric refraction · sea-level horizon",engine:"Swiss Ephemeris · Moshier"
  };
}

function vratRows(index:number):VratOccurrence[]{
  const count=3+index;
  const months=[1,2,4,5,7,9,11];
  return Array.from({length:count},(_,rowIndex)=>{
    const month=months[rowIndex];
    const day=5+index;
    const date=`2026-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const nextDate=rowIndex===count-1&&index%3===0?`2026-${String(month).padStart(2,"0")}-${String(day+1).padStart(2,"0")}`:date;
    return {date,weekday:weekdays[(rowIndex+index)%weekdays.length],paksha:(rowIndex+index)%2?"Krishna":"Shukla",tithi:"Ekadashi",sunrise:["06:20","05:58","05:24","05:55","06:02"][index],tithiEnd:["10:20","13:05","16:40","19:15","23:10"][index],tithiEndDate:nextDate,repeatedAtSunrise:index%2===0&&rowIndex===1,sequence:rowIndex+1};
  });
}

function muhuratRows(index:number):MuhuratRow[]{
  const count=1+index;
  return Array.from({length:count},(_,rowIndex)=>({date:`2026-09-${String(4+index*3+rowIndex).padStart(2,"0")}`,recommendedWindows:rowIndex===0&&index===4?[]:[{start:`0${7+index}:10`,end:`${9+index}:00`,sources:[index%2?"Amrit Choghadiya":"Abhijit Muhurat"]}],avoidWindows:[],reasons:[`${tithis[index]} Tithi`,`${nakshatras[index]} Nakshatra`],planning:{score:92-index*7-rowIndex*3,grade:index===0?"Excellent":index<3?"Strong":"Good",totalCleanMinutes:210-index*27,longestWindowMinutes:index===4?0:130-index*22,sourceCount:2,hasAbhijit:index%2===0,idealContinuousMinutes:90,factors:[]}})) as unknown as MuhuratRow[];
}

describe("global content uniqueness and citation integrity",()=>{
  it("contains no competitor brand or outbound competitor citation in rendered-source layers",()=>{
    const files=[...sourceFiles("app"),...sourceFiles("components"),...sourceFiles("lib")];
    for(const file of files){const text=sourceWithoutEngineeringComments(source(file));expect(text,`${file} contains a competitor reference`).not.toMatch(competitor);expect(text,`${file} contains a competitor domain`).not.toMatch(/drikpanchang\.com|astrosage\.|mpanchang\.|prokerala\./i);}
    for(const language of regionalLanguageSlugs){const copy=regionalPureLocale(language);const strings=Object.values(copy).filter((value):value is string=>typeof value==="string").join(" ");expect(strings,`${language} regional locale contains competitor copy`).not.toMatch(competitor);}
  });

  it("keeps Vrat and Muhurat public pages free of the retired disclaimer shell",()=>{
    const pages=["app/vrat/page.tsx","app/vrat/[vrat]/[year]/page.tsx","app/vrat/[vrat]/[year]/[city]/page.tsx","app/muhurat/page.tsx","app/muhurat/[event]/[year]/page.tsx","app/muhurat/[event]/[year]/[month]/page.tsx","app/muhurat/[event]/[year]/[month]/[city]/page.tsx"];
    for(const file of pages){const text=source(file);expect(text,`${file} still contains MethodologyNote`).not.toContain("MethodologyNote");expect(text,`${file} still contains generic screening disclaimer`).not.toContain("muhuratScreeningStatement");expect(text,`${file} still links to disclaimer route`).not.toContain('/disclaimer');}
  });

  it("keeps semantic prose below the 80 percent boilerplate threshold across representative variants",()=>{
    const ignored=cities.flatMap(city=>[city.name,city.state]);
    const daily=cities.map((city,index)=>{const value=buildDailyPanchangQualityContent(city,panchangFixture(index,city),{amantaLabel:`Amanta ${index}`,purnimantaLabel:`Purnimanta ${index}`});return [value.directAnswer,value.fingerprintBody,value.transitionBody,value.solarBody,value.lunarBody].join(" ");});
    const choghadiya=cities.map((city,index)=>{const value=buildChoghadiyaQualityContent(panchangFixture(index,city),city);return [value.directAnswer,value.fingerprintBody,value.daytimeBody,value.nightBody,value.rahuBody].join(" ");});
    const vrat=findVratBySlug("ekadashi")!;
    const vratCopy=cities.map((city,index)=>{const value=buildVratQualityContent(vrat,2026,city,vratRows(index));return [value.directAnswer,value.fingerprintBody,value.distributionBody,value.transitionBody,value.observanceBody].join(" ");});
    const muhurat=cities.map((city,index)=>{const value=buildMuhuratMonthlyQualityContent("wedding",2026,9,city,muhuratRows(index),"city");return [value.directAnswer,value.fingerprintBody,value.rankingBody,value.timingBody,value.ruleBody].join(" ");});
    expect(maxPairwise(daily,ignored)).toBeLessThan(0.8);
    expect(maxPairwise(choghadiya,ignored)).toBeLessThan(0.8);
    expect(maxPairwise(vratCopy,ignored)).toBeLessThan(0.8);
    expect(maxPairwise(muhurat,ignored)).toBeLessThan(0.8);
  });

  it("uses one semantic festival engine instead of city-specific manual SEO patches",()=>{
    const festivalPage=source("app/festivals/[festival]/[year]/[city]/page.tsx");
    const legacyEngine=source("lib/content-uniqueness.ts");
    expect(festivalPage).toContain("buildFestivalCityQualityContent");
    expect(festivalPage).not.toMatch(/isGaneshAhmedabad|isGaneshDelhi|isDussehraHyderabad|isDussehraKolkata|isDussehraChennai|isShardiyaNavratri|isGaneshHyderabad|isHanumanJayantiChennai/);
    expect(festivalPage).not.toContain("buildFestivalCityNarrative");
    expect(festivalPage).not.toContain("MethodologyNote");
    expect(legacyEngine).not.toContain("buildFestivalCityNarrative");
    expect(legacyEngine).not.toContain("longitudeSolarOffset");
  });

  it("builds festival city content from festival rules, local calculations and regional context",()=>{
    const festival=festivalBySlugYear("shardiya-navratri",2026)!;
    const outputs=cities.map((city,index)=>{const data={...panchangFixture(index,city),date:festival.date,tithiEndDate:festival.date,nakshatraEndDate:festival.date,moonriseDate:festival.date} as Panchang;const lunar={amantaLabel:`Ashwina ${index+1}`,purnimantaLabel:`Ashwina ${index+2}`} as any;return buildFestivalCityQualityContent(festival,city,data,lunar,null);});
    expect(new Set(outputs.map(item=>item.directAnswer)).size).toBe(cities.length);
    expect(outputs.every(item=>item.directFacts.length>=6)).toBe(true);
    expect(outputs.some(item=>Boolean(item.regionalBody))).toBe(true);
    expect(outputs.every(item=>item.ritualTitle.toLowerCase().includes("navratri"))).toBe(true);
  });
});
