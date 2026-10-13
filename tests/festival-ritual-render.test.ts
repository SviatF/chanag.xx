import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {festivalBySlugYear} from "../lib/festivals";
import {getPanchang} from "../lib/panchang";
import {getLunarMonthConventions} from "../lib/calendar-conventions";
import {buildFestivalCityQualityContent} from "../lib/festival-content-engine";
import {getFestivalLocalReference} from "../lib/religious-integrity";

describe("city festival informational value is actually rendered",()=>{
  it("renders dedicated, festival-specific ritual content in the route",()=>{
    const jsx=readFileSync("app/festivals/[festival]/[year]/[city]/page.tsx","utf8");
    expect(jsx).toContain("<h2>{content.ritualTitle}</h2>");
    expect(jsx).toContain("<p>{content.ritualBody}</p>");
  });
  it("Chhath visible ritual copy explains sunset and following sunrise on distinct dates",async()=>{
    const festival=festivalBySlugYear("chhath-puja",2026)!;
    const city=cityBySlug("patna");
    const date=new Date(festival.date+"T06:00:00Z");
    const panchang=await getPanchang(date,city);
    const content=buildFestivalCityQualityContent(festival,city,panchang,getLunarMonthConventions(date,city,panchang),getFestivalLocalReference(festival,panchang));
    expect(content.ritualTitle).toContain("next sunrise");
    expect(content.ritualBody).toContain("Sandhya Arghya");
    expect(content.ritualBody).toContain("Usha Arghya");
    expect(content.ritualBody).toContain("2026-11-16");
    expect(content.ritualBody).toContain(panchang.sunset);
  });
});
