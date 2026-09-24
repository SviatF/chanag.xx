import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {buildChoghadiyaQualityContent} from "../lib/choghadiya-content-engine";
import {findCityBySlug} from "../lib/cities";
import type {Panchang} from "../lib/panchang";
import {buildRegionalIntentQualityContent,buildRegionalPanchangQualityContent} from "../lib/regional-content-engine";

function data(date:string,sunrise:string,sunset:string,rahu:{start:string;end:string},shift=0):Panchang{
  const names=["Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit"] as const;
  const day=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String(6+index).padStart(2,"0")}:${String((shift+index*3)%60).padStart(2,"0")}`,end:`${String(7+index).padStart(2,"0")}:${String((shift+index*3+20)%60).padStart(2,"0")}`,startDayOffset:0 as const,endDayOffset:0 as const}));
  const night=names.map((name,index)=>({name,effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",start:`${String((18+index)%24).padStart(2,"0")}:${String((shift+index*4)%60).padStart(2,"0")}`,end:`${String((19+index)%24).padStart(2,"0")}:${String((shift+index*4+20)%60).padStart(2,"0")}`,startDayOffset:(18+index>=24?1:0) as 0|1,endDayOffset:(19+index>=24?1:0) as 0|1}));
  return {
    date,weekday:"Thursday",tithi:"Ekadashi",tithiEnd:"14:20",tithiEndDate:date,paksha:"Shukla",nakshatra:"Rohini",nakshatraEnd:"17:45",nakshatraEndDate:date,nakshatraPada:2,rashi:"Vrishabha",solarRashi:"Kanya",yoga:"Siddhi",karana:"Bava",sunrise,sunset,moonrise:"18:40",moonriseDate:date,moonset:"05:20",moonsetDate:date,moonIllumination:62,rahu,yamaganda:{start:"06:10",end:"07:40"},gulika:{start:"09:10",end:"10:40"},abhijit:{start:"11:50",end:"12:40"},dayChoghadiya:day,nightChoghadiya:night,hinduMonth:"Ashwin",vikramSamvat:2083,shakaSamvat:1948,samvatYearStart:"2026-03-19",dayLord:"Jupiter",sunriseConvention:"Upper limb + atmospheric refraction · sea-level horizon",engine:"Swiss Ephemeris · Moshier"
  };
}

describe("regional and Choghadiya semantic content",()=>{
  it("creates city-reactive native Gujarati Panchang copy",()=>{
    const ahmedabad=findCityBySlug("ahmedabad")!;
    const surat=findCityBySlug("surat")!;
    const a=buildRegionalPanchangQualityContent("gujarati",ahmedabad,data("2026-09-24","06:28","18:31",{start:"13:51",end:"15:22"}),"આસો");
    const s=buildRegionalPanchangQualityContent("gujarati",surat,data("2026-09-24","06:32","18:35",{start:"15:23",end:"16:54"},11),"આસો");
    expect(a.directAnswer).toContain("અમદાવાદ");
    expect(s.directAnswer).toContain("સુરત");
    expect(a.fingerprintBody).not.toBe(s.fingerprintBody);
    expect(a.facts.length).toBeGreaterThanOrEqual(6);
  });

  it("separates Rahu and Choghadiya intent analysis from the same local day",()=>{
    const city=findCityBySlug("mumbai")!;
    const p=data("2026-09-24","06:25","18:34",{start:"13:48",end:"15:19"},7);
    const rahu=buildRegionalIntentQualityContent("marathi",city,"rahu-kalam",p);
    const choghadiya=buildRegionalIntentQualityContent("marathi",city,"choghadiya",p);
    expect(rahu.directAnswer).toContain("मुंबई");
    expect(rahu.analysisBody).toContain("मिनिट");
    expect(choghadiya.analysisBody).not.toBe(rahu.analysisBody);
    expect(choghadiya.relationBody).toContain("राहुकाल");
  });

  it("builds an English Choghadiya fingerprint from the full day and night sequence",()=>{
    const city=findCityBySlug("chennai")!;
    const value=buildChoghadiyaQualityContent(data("2026-09-24","05:58","18:04",{start:"13:33",end:"15:04"},13),city);
    expect(value.directAnswer).toContain("Chennai");
    expect(value.facts.length).toBe(6);
    expect(value.fingerprintTitle).toContain("Chennai");
    expect(value.fingerprintBody).toContain("daytime chain");
    expect(value.nightBody).toContain("night");
    expect(value.rahuTitle).toContain("Rahu relationship");
    expect(value.facts.find(item=>item.label==="Solar clock signature")?.value).toContain("/");
  });

  it("wires regional city, regional intent and English Choghadiya routes to semantic engines",()=>{
    const regionalCity=readFileSync("app/regional/[language]/[city]/page.tsx","utf8");
    const regionalIntent=readFileSync("app/regional/[language]/[city]/[intent]/page.tsx","utf8");
    const choghadiya=readFileSync("app/tools/choghadiya/[city]/page.tsx","utf8");
    expect(regionalCity).toContain("buildRegionalPanchangQualityContent");
    expect(regionalIntent).toContain("buildRegionalIntentQualityContent");
    expect(regionalIntent).not.toContain("copy.methodologyText");
    expect(regionalIntent).not.toContain("copy.rahuExplanation");
    expect(regionalIntent).not.toContain("copy.choghadiyaExplanation");
    expect(choghadiya).toContain("buildChoghadiyaQualityContent");
    expect(choghadiya).not.toContain("buildChoghadiyaNarrative");
  });
});
