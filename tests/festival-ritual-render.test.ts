import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {festivalBySlugYear} from "../lib/festivals";
import {getPanchang} from "../lib/panchang";
import {chhathFollowingSunrise} from "../lib/festival-content-engine";

describe("Chhath city pages explain real sunset and next-day sunrise",()=>{
  it("renders only the Chhath-specific solar sequence rather than generic ritual bodies",()=>{
    const jsx=readFileSync("app/festivals/[festival]/[year]/[city]/page.tsx","utf8");
    expect(jsx).not.toContain("content.ritualBody");
    expect(jsx).not.toContain("content.ritualTitle");
    expect(jsx).toContain('festival.slug==="chhath-puja"?chhathFollowingSunrise(data):null');
    expect(jsx).toContain("Sandhya Arghya falls at local sunset");
    expect(jsx).toContain("The following Usha Arghya is at local sunrise");
    expect(jsx).toContain("{nextChhathSunrise.date}");
  });
  it("Patna 2026 sunset and the next sunrise have distinct local dates",async()=>{
    const festival=festivalBySlugYear("chhath-puja",2026)!;
    const data=await getPanchang(new Date(festival.date+"T06:00:00Z"),cityBySlug("patna"));
    const sunrise=chhathFollowingSunrise(data);
    expect(sunrise?.date).toBe("2026-11-16");
    expect(sunrise?.time).toMatch(/^[0-2][0-9]:[0-5][0-9]$/);
    expect(data.date).toBe("2026-11-15");
    expect(data.nightChoghadiya.at(-1)?.end).toBe(sunrise?.time);
  });
});
