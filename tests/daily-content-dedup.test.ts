import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {buildDailyPanchangQualityContent} from "../lib/daily-content-engine";
import type {Panchang} from "../lib/panchang";
import {phase1PriorityCities} from "../lib/seo-policy";

function fixture():Panchang{
  const dayNames=["Amrit","Kaal","Shubh","Rog","Udveg","Char","Labh","Amrit"] as const;
  const day=dayNames.map((name,index)=>({
    name,
    effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",
    start:`${String(6+index).padStart(2,"0")}:10`,
    end:`${String(7+index).padStart(2,"0")}:35`,
    startDayOffset:0 as const,
    endDayOffset:0 as const,
  }));
  const night=dayNames.map((name,index)=>({
    name,
    effect:(name==="Amrit"||name==="Shubh"||name==="Labh"?"good":name==="Char"?"neutral":"bad") as "good"|"neutral"|"bad",
    start:`${String((18+index)%24).padStart(2,"0")}:15`,
    end:`${String((19+index)%24).padStart(2,"0")}:40`,
    startDayOffset:(18+index>=24?1:0) as 0|1,
    endDayOffset:(19+index>=24?1:0) as 0|1,
  }));
  return {
    date:"2026-09-25",weekday:"Friday",tithi:"Trayodashi",tithiEnd:"16:42",tithiEndDate:"2026-09-25",paksha:"Shukla",
    nakshatra:"Dhanishta",nakshatraEnd:"21:18",nakshatraEndDate:"2026-09-25",nakshatraPada:3,rashi:"Makara",solarRashi:"Kanya",
    yoga:"Dhriti",karana:"Taitila",sunrise:"06:08",sunset:"18:17",moonrise:"17:36",moonriseDate:"2026-09-25",moonset:"05:05",moonsetDate:"2026-09-25",moonIllumination:82,
    rahu:{start:"10:41",end:"12:12"},yamaganda:{start:"15:14",end:"16:45"},gulika:{start:"07:39",end:"09:10"},abhijit:{start:"11:48",end:"12:36"},
    dayChoghadiya:day,nightChoghadiya:night,hinduMonth:"Ashwin",vikramSamvat:2083,shakaSamvat:1948,samvatYearStart:"2026-03-19",dayLord:"Venus",
    sunriseConvention:"Upper limb + atmospheric refraction · sea-level horizon",engine:"Swiss Ephemeris · Moshier",
  };
}

function normalized(value:string,cityName:string,state:string){
  let text=value.toLowerCase().normalize("NFKC");
  for(const token of [cityName,state,"2026-09-25"].filter(Boolean).sort((a,b)=>b.length-a.length))text=text.replaceAll(token.toLowerCase()," ");
  return text.replace(/\b\d+(?::\d+)?(?:\.\d+)?%?\b/g," ").replace(/[^\p{L}\p{M}]+/gu," ").replace(/\s+/g," ").trim();
}

describe("daily Panchang semantic dedup engine",()=>{
  it("keeps every phase-one city structurally distinct after city, state, date and digits are removed",()=>{
    const data=fixture();
    const outputs=phase1PriorityCities.map(slug=>{
      const city=findCityBySlug(slug)!;
      const copy=buildDailyPanchangQualityContent(city,data,{amantaLabel:"Ashwin",purnimantaLabel:"Ashwin"});
      const full=[copy.directAnswer,copy.fingerprintTitle,copy.fingerprintBody,copy.transitionTitle,copy.transitionBody,copy.solarTitle,copy.solarBody,copy.lunarTitle,copy.lunarBody,...copy.facts.flatMap(item=>[item.label,item.value,item.note??""])].join(" ");
      return normalized(full,city.name,city.state);
    });
    expect(new Set(outputs).size).toBe(phase1PriorityCities.length);
  });

  it("uses real geography and timing classes rather than a city-name substitution template",()=>{
    const mumbai=findCityBySlug("mumbai")!;
    const kolkata=findCityBySlug("kolkata")!;
    const data=fixture();
    const west=buildDailyPanchangQualityContent(mumbai,data,{amantaLabel:"Ashwin",purnimantaLabel:"Ashwin"});
    const east=buildDailyPanchangQualityContent(kolkata,data,{amantaLabel:"Ashwin",purnimantaLabel:"Ashwin"});
    expect(west.fingerprintBody).toContain("IST standard meridian");
    expect(east.fingerprintBody).toContain("IST standard meridian");
    expect(normalized(west.fingerprintBody,mumbai.name,mumbai.state)).not.toBe(normalized(east.fingerprintBody,kolkata.name,kolkata.state));
    expect(west.facts.map(item=>item.label)).toEqual(expect.arrayContaining(["Solar geography","Lunar transition order","Rahu position","Choghadiya shape"]));
  });

  it("wires the public daily route to the dedicated dedup engine",()=>{
    const page=readFileSync("app/panchang/[city]/[[...date]]/page.tsx","utf8");
    expect(page).toContain('from "@/lib/daily-content-engine"');
    expect(page).not.toContain('buildDailyPanchangQualityContent} from "@/lib/calendar-content-engine"');
  });
});
