import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {cityBySlug} from "../lib/cities";
import {festivalBySlugYear} from "../lib/festivals";
import {getCalendarFestivalsForCity,getFestivalForCity,nextFestivalForCity,reviewedLocalFestivalDates} from "../lib/festival-local-date";
import {festivalRegionalDateEvidence} from "./fixtures/festival-regional-date-evidence";
import {govardhan2026LocalDateSources} from "./fixtures/govardhan-2026-local-date-sources";

const western=["mumbai","pune","jaipur","indore","ahmedabad"] as const;
const cityFestivals=(slug:string)=>getCalendarFestivalsForCity(2026,cityBySlug(slug));
const bySlug=(slug:string,festival:string)=>cityFestivals(slug).filter(f=>f.slug===festival);

describe("DATA-03 actual festival-date consistency across city calendar surfaces",()=>{
  it("uses the local 9 Nov 2026 Govardhan date in every independently reviewed city",()=>{
    expect(reviewedLocalFestivalDates).toHaveLength(5);
    expect(govardhan2026LocalDateSources).toHaveLength(5);
    for(const slug of western){
      const f=bySlug(slug,"govardhan-puja");
      expect(f).toHaveLength(1);
      expect(f[0].date).toBe("2026-11-09");
      expect(cityFestivals(slug).filter(x=>x.date==="2026-11-10"&&x.slug==="govardhan-puja")).toHaveLength(0);
      expect(govardhan2026LocalDateSources.some(x=>x.city===slug&&x.date===f[0].date)).toBe(true);
    }
    expect(bySlug("delhi","govardhan-puja")[0].date).toBe("2026-11-10");
    expect(bySlug("hyderabad","govardhan-puja")[0].date).toBe("2026-11-10");
    // National curated ledger MUST NOT be mutated by a local override.
    expect(festivalBySlugYear("govardhan-puja",2026)?.date).toBe("2026-11-10");
  });
  it("preserves 20 Oct India-wide Dussehra AND the distinct 21 Oct Bengal observance",()=>{
    const observations=bySlug("kolkata","dussehra");
    expect(observations.map(x=>[x.name,x.date])).toEqual([
      ["Dussehra","2026-10-20"],
      ["Bengal Vijayadashami","2026-10-21"]
    ]);
    expect(bySlug("delhi","dussehra")).toHaveLength(1);
    expect(bySlug("delhi","dussehra")[0].date).toBe("2026-10-20");
    expect(getFestivalForCity(festivalBySlugYear("dussehra",2026)!,cityBySlug("kolkata")).date).toBe("2026-10-20");
    expect(festivalRegionalDateEvidence[0].standardDate).toBe("2026-10-20");
    expect(festivalRegionalDateEvidence[0].localDate).toBe(observations[1].date);
    expect(new URL(festivalRegionalDateEvidence[0].source).hostname).toBe("www.drikpanchang.com");
  });
  it("uses actual India midnight to select each city's next local observance",()=>{
    // 2026-11-08 18:31Z is 2026-11-09 00:01 IST.
    expect(nextFestivalForCity(new Date("2026-11-08T18:31:00Z"),cityBySlug("mumbai"))?.date).toBe("2026-11-09");
    expect(nextFestivalForCity(new Date("2026-11-08T18:31:00Z"),cityBySlug("delhi"))?.date).toBe("2026-11-10");
    // 2026-10-20 18:31Z is 2026-10-21 00:01 IST.
    expect(nextFestivalForCity(new Date("2026-10-20T18:31:00Z"),cityBySlug("kolkata"))?.name).toBe("Bengal Vijayadashami");
    expect(nextFestivalForCity(new Date("2026-10-20T18:31:00Z"),cityBySlug("kolkata"))?.date).toBe("2026-10-21");
    expect(nextFestivalForCity(new Date("2026-10-20T18:31:00Z"),cityBySlug("delhi"))?.date).toBe("2026-10-29");
    expect(nextFestivalForCity(new Date("2030-01-01T06:00:00Z"),cityBySlug("mumbai"))).toBeNull();
  });
  it("connects home, monthly and yearly calendar page families to one local source",()=>{
    const home=readFileSync("app/page.tsx","utf8");
    const monthly=readFileSync("app/calendar/[city]/[year]/[month]/page.tsx","utf8");
    const yearly=readFileSync("app/calendar/[city]/[year]/page.tsx","utf8");
    expect(home).toContain("nextFestivalForCity(now,city)");
    expect(home).toContain("getCalendarFestivalsForCity(year,city)");
    expect(monthly).toContain("getCalendarFestivalsForCity(y,city)");
    expect(monthly).toContain("buildMonthlyCalendarQualityContent(city,y,m,entries,monthFestivals)");
    expect(monthly).toContain("key={`${festival.slug}-${festival.date}`}");
    expect(yearly).toContain("getCalendarFestivalsForCity(year,city)");
    expect(yearly).toContain("buildYearlyCalendarQualityContent(city,year,snapshots,festivals)");
    expect(yearly).toContain("key={`${item.slug}-${item.date}`}");
  });
});
