import {describe,expect,it} from "vitest";
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
});
