import {describe,expect,it} from "vitest";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose,sweSetSidMode} from "@typescriptify/sweph/dist/sweph.js";
import {SE_SUN,SEFLG_MOSEPH,SEFLG_SIDEREAL,SE_SIDM_LAHIRI} from "@typescriptify/sweph/dist/constants.js";
import {readFileSync} from "node:fs";

import type {City} from "../lib/cities";
import {cityBySlug} from "../lib/cities";
import {getPanchang} from "../lib/panchang";
import {getLunarMonthConventions,getRegionalCalendarConventions} from "../lib/calendar-conventions";

const kochi:City={
  slug:"kochi-convention-test",
  name:"Kochi",
  state:"Kerala",
  lat:9.9312,
  lng:76.2673,
  language:["en","ml"],
};

describe("Indian calendar convention integrity",()=>{
  it("shows different Amanta and Purnimanta month names during a regular Krishna Paksha",async()=>{
    const city=cityBySlug("mumbai");
    const date=new Date("2026-09-09T06:00:00Z");
    const data=await getPanchang(date,city);
    const lunar=getLunarMonthConventions(date,city,data);

    expect(data.paksha).toBe("Krishna");
    expect(lunar.amantaMonth).toBe("Shravana");
    expect(lunar.amantaIsAdhika).toBe(false);
    expect(lunar.purnimantaMonth).toBe("Bhadrapada");
    expect(lunar.purnimantaIsAdhika).toBe(false);
  });

  it("detects Adhika Maas when no Sankranti occurs between bounding new moons",async()=>{
    const city=cityBySlug("mumbai");
    const date=new Date("2023-07-25T06:00:00Z");
    const data=await getPanchang(date,city);
    const lunar=getLunarMonthConventions(date,city,data);

    expect(lunar.amantaLabel).toBe("Shravana (Adhika)");
    expect(lunar.purnimantaLabel).toBe("Shravana (Adhika)");
    expect(lunar.amantaIsAdhika).toBe(true);
  });

  it("uses calendar-specific civil-day rules on Mesha Sankranti",async()=>{
    const date=new Date("2027-04-14T06:00:00Z");

    const chennai=cityBySlug("chennai");
    const chennaiData=await getPanchang(date,chennai);
    const tamil=getRegionalCalendarConventions(date,chennai,chennaiData);
    expect(tamil.solarIngress?.to).toBe("Mesha");
    expect(tamil.tamilSolarRashi).toBe("Mesha");

    const kolkata=cityBySlug("kolkata");
    const kolkataData=await getPanchang(date,kolkata);
    const bengali=getRegionalCalendarConventions(date,kolkata,kolkataData);
    expect(bengali.bengaliSolarRashi).toBe("Meena");

    const kochiData=await getPanchang(date,kochi);
    const malayalam=getRegionalCalendarConventions(date,kochi,kochiData);
    expect(malayalam.malayalamSolarRashi).toBe("Meena");
  });

  it("moves Bengali and Malayalam solar month to Mesha on the following civil day",async()=>{
    const date=new Date("2027-04-15T06:00:00Z");

    const kolkata=cityBySlug("kolkata");
    const kolkataData=await getPanchang(date,kolkata);
    const bengali=getRegionalCalendarConventions(date,kolkata,kolkataData);
    expect(bengali.bengaliSolarRashi).toBe("Mesha");

    const kochiData=await getPanchang(date,kochi);
    const malayalam=getRegionalCalendarConventions(date,kochi,kochiData);
    expect(malayalam.malayalamSolarRashi).toBe("Mesha");
  });

  it("uses Kartika Shukla Pratipada for Gujarati Samvat year rollover",async()=>{
    const city=cityBySlug("ahmedabad");

    const beforeDate=new Date("2026-11-09T06:00:00Z");
    const beforeData=await getPanchang(beforeDate,city);
    const before=getRegionalCalendarConventions(beforeDate,city,beforeData);
    expect(before.gujaratiSamvat).toBe(2082);

    const startDate=new Date("2026-11-10T06:00:00Z");
    const startData=await getPanchang(startDate,city);
    const start=getRegionalCalendarConventions(startDate,city,startData);
    expect(start.gujaratiSamvat).toBe(2083);
    expect(start.gujaratiSamvatYearStart).toBe("2026-11-10");
  });

  it("uses UT (not TT) for the Mumbai 2026-10-17 Tula Sankranti physical instant",async()=>{
    const city=cityBySlug("mumbai");
    const date=new Date("2026-10-17T12:00:00Z");
    const data=await getPanchang(date,city);
    const regional=getRegionalCalendarConventions(date,city,data);
    const ingress=regional.solarIngress;
    expect(ingress).not.toBeNull();
    expect(ingress?.to).toBe("Tula");
    expect(ingress?.from).toBe("Kanya");
    expect(ingress?.date).toBe("2026-10-17");

    // This is an independent UT-root bisector around the reported minute.
    // The production code previously passed UT JD to sweCalc (expects TT),
    // shifting this physical boundary by roughly Delta-T.
    const local=Date.parse(`${ingress!.date}T${ingress!.time}:00+05:30`);
    const jd= (ms:number)=>2440587.5+ms/86400000;
    const swed=createDefaultSweData();
    sweSetSidMode(swed,SE_SIDM_LAHIRI,0,0);
    try{
      const longitude=(ms:number)=>{
        const v=sweCalcUt(swed,jd(ms),SE_SUN,SEFLG_MOSEPH|SEFLG_SIDEREAL).xx[0];
        expect(Number.isFinite(v)).toBe(true);
        return ((v%360)+360)%360;
      };
      const sign=(ms:number)=>Math.floor(longitude(ms)/30);
      const eightMinutes=8*60_000;
      let lo=local-eightMinutes,hi=local+eightMinutes;
      expect(sign(lo)).toBe(5);
      expect(sign(hi)).toBe(6);
      for(let i=0;i<36;i++){
        const mid=(lo+hi)/2;
        if(sign(mid)===5)lo=mid;else hi=mid;
      }
      // The regional result rounds to a local minute, not a second.
      // This catches the former UT-as-TT shift (~one minute) while
      // allowing ordinary <=30-second clock formatting.
      expect(Math.abs((lo+hi)/2-local)).toBeLessThanOrEqual(30_500);
    }finally{sweClose(swed);}
  });

  it("never reintroduces a silent fake sunrise or ET-only positions",()=>{
    const source=readFileSync("lib/calendar-conventions.ts","utf8");
    expect(source).toContain("sweCalcUt(swed,jdUt");
    expect(source).not.toMatch(/\bsweCalc\s*\(/);
    expect(source).not.toContain("baseJd+0.25");
    expect(source).not.toContain("baseJd+0.75");
    expect(source).toContain('requireSolarEvent(rise,city.slug,data.date,"sunrise")');
    expect(source).toContain('requireSolarEvent(set,city.slug,data.date,"sunset")');
  });

});
