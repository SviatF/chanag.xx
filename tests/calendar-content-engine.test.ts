import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {buildDailyPanchangQualityContent,buildMonthlyCalendarQualityContent,buildYearlyCalendarQualityContent} from "../lib/calendar-content-engine";
import type {Panchang} from "../lib/panchang";

function fixture(date:string,overrides:Partial<Panchang>={}):Panchang{
  return {
    date,
    weekday:"Thursday",
    tithi:"Ekadashi",
    tithiEnd:"14:20",
    tithiEndDate:date,
    paksha:"Shukla",
    nakshatra:"Rohini",
    nakshatraEnd:"17:45",
    nakshatraEndDate:date,
    nakshatraPada:2,
    rashi:"Vrishabha",
    solarRashi:"Kanya",
    yoga:"Siddhi",
    karana:"Bava",
    sunrise:"06:10",
    sunset:"18:20",
    moonrise:"15:20",
    moonriseDate:date,
    moonset:"03:10",
    moonsetDate:date,
    moonIllumination:62,
    rahu:{start:"13:46",end:"15:17"},
    yamaganda:{start:"06:10",end:"07:41"},
    gulika:{start:"09:12",end:"10:43"},
    abhijit:{start:"11:51",end:"12:40"},
    dayChoghadiya:[
      {name:"Shubh",effect:"good",start:"06:10",end:"07:41",startDayOffset:0,endDayOffset:0},
      {name:"Rog",effect:"bad",start:"07:41",end:"09:12",startDayOffset:0,endDayOffset:0},
      {name:"Labh",effect:"good",start:"09:12",end:"10:43",startDayOffset:0,endDayOffset:0},
    ],
    nightChoghadiya:[],
    hinduMonth:"Ashwin",
    vikramSamvat:2083,
    shakaSamvat:1948,
    samvatYearStart:"2026-03-19",
    dayLord:"Jupiter",
    sunriseConvention:"Upper limb + atmospheric refraction · sea-level horizon",
    engine:"Swiss Ephemeris · Moshier",
    ...overrides,
  } as Panchang;
}

describe("Panchang and calendar semantic content",()=>{
  const mumbai=findCityBySlug("mumbai")!;

  it("builds a date-specific daily fingerprint without extra-day calculations",()=>{
    const data=fixture("2026-09-24");
    const content=buildDailyPanchangQualityContent(mumbai,data,{amantaLabel:"Bhadrapada",purnimantaLabel:"Ashwin"});
    expect(content.directAnswer).toContain("Mumbai");
    expect(content.fingerprintBody).toContain("Ekadashi Tithi");
    expect(content.transitionBody).toContain("Dwadashi");
    expect(content.transitionBody).toContain("Mrigashirsha");
    expect(content.lunarBody).toContain("Bhadrapada");
    expect(content.facts.find(item=>item.label==="Daylight span")?.value).toBe("730 minutes");
  });

  it("derives a month fingerprint from the local sunrise sequence",()=>{
    const entries=[
      fixture("2026-09-01",{sunrise:"06:12",sunset:"18:36",tithi:"Purnima",paksha:"Shukla",nakshatra:"Rohini",rahu:{start:"13:50",end:"15:20"}}),
      fixture("2026-09-02",{sunrise:"06:11",sunset:"18:35",tithi:"Pratipada",paksha:"Krishna",nakshatra:"Mrigashirsha",rahu:{start:"13:44",end:"15:15"}}),
      fixture("2026-09-03",{sunrise:"06:09",sunset:"18:34",tithi:"Ekadashi",paksha:"Krishna",nakshatra:"Ardra",rahu:{start:"13:38",end:"15:09"}}),
      fixture("2026-09-04",{sunrise:"06:08",sunset:"18:33",tithi:"Amavasya",paksha:"Krishna",nakshatra:"Punarvasu",rahu:{start:"13:32",end:"15:03"}}),
    ];
    const content=buildMonthlyCalendarQualityContent(mumbai,2026,9,entries,[{name:"Ganesh Chaturthi",slug:"ganesh-chaturthi",date:"2026-09-03"}]);
    expect(content.directAnswer).toContain("4 local Panchang days");
    expect(content.lunarBody).toContain("2026-09-03");
    expect(content.festivalBody).toContain("Ganesh Chaturthi");
    expect(content.fingerprintBody).toContain("4 distinct Tithi labels");
    expect(content.fingerprintBody).toContain("18 minutes");
  });

  it("builds a yearly city fingerprint from month-start states and maintained festivals",()=>{
    const snapshots=Array.from({length:12},(_,index)=>fixture(`2026-${String(index+1).padStart(2,"0")}-01`,{
      sunrise:`06:${String(20-index).padStart(2,"0")}`,
      tithi:index%2?"Dvitiya":"Ekadashi",
      paksha:index%3?"Shukla":"Krishna",
      nakshatra:index%2?"Rohini":"Swati",
    }));
    const content=buildYearlyCalendarQualityContent(mumbai,2026,snapshots,[
      {name:"Diwali",slug:"diwali",date:"2026-11-08"},
      {name:"Govardhan Puja",slug:"govardhan-puja",date:"2026-11-09"},
      {name:"Holi",slug:"holi",date:"2026-03-04"},
    ]);
    expect(content.directAnswer).toContain("12 local monthly Panchang pages");
    expect(content.festivalBody).toContain("November");
    expect(content.festivalBody).toContain("2 maintained festival dates");
    expect(content.seasonalBody).toContain("January 1 to December 1");
  });

  it("wires all three public route layers to the semantic engine",()=>{
    const daily=readFileSync("app/panchang/[city]/[[...date]]/page.tsx","utf8");
    const monthly=readFileSync("app/calendar/[city]/[year]/[month]/page.tsx","utf8");
    const yearly=readFileSync("app/calendar/[city]/[year]/page.tsx","utf8");
    expect(daily).toContain("buildDailyPanchangQualityContent");
    expect(daily).not.toContain("buildDailyDataNarrative");
    expect(monthly).toContain("buildMonthlyCalendarQualityContent");
    expect(yearly).toContain("buildYearlyCalendarQualityContent");
  });
});
