import {afterEach,describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {isYearlyCalendarIndexable,isYearlyMuhuratIndexable,yearlyIndexYears} from "../lib/seo-policy";
import {cityCalendarYearPath,hinduCalendarYearPath,muhuratYearPath,yearlyMonths} from "../lib/yearly-expansion";

const originalCities=process.env.SEO_EXTRA_INDEX_CITIES;
afterEach(()=>{if(originalCities===undefined)delete process.env.SEO_EXTRA_INDEX_CITIES;else process.env.SEO_EXTRA_INDEX_CITIES=originalCities;});

describe("Yearly SEO expansion policy",()=>{
  it("keeps a four-year rolling search window",()=>{
    expect(yearlyIndexYears()).toEqual([2025,2026,2027,2028]);
    expect(isYearlyCalendarIndexable(2027)).toBe(true);
    expect(isYearlyCalendarIndexable(2030)).toBe(false);
  });

  it("creates exactly twelve canonical month descriptors",()=>{
    expect(yearlyMonths).toHaveLength(12);
    expect(yearlyMonths[0]).toMatchObject({month:1,slug:"01",name:"January"});
    expect(yearlyMonths[11]).toMatchObject({month:12,slug:"12",name:"December"});
    expect(new Set(yearlyMonths.map(item=>item.slug)).size).toBe(12);
  });

  it("requires city approval for city-year calendars",()=>{
    const city=findCityBySlug("coimbatore")!;
    delete process.env.SEO_EXTRA_INDEX_CITIES;
    expect(isYearlyCalendarIndexable(2027,city.slug)).toBe(false);
    process.env.SEO_EXTRA_INDEX_CITIES="coimbatore";
    expect(isYearlyCalendarIndexable(2027,city.slug)).toBe(true);
  });

  it("allows only primary Muhurat families inside the rolling year window",()=>{
    expect(isYearlyMuhuratIndexable("wedding",2027)).toBe(true);
    expect(isYearlyMuhuratIndexable("griha-pravesh",2028)).toBe(true);
    expect(isYearlyMuhuratIndexable("gold-purchase",2027)).toBe(false);
    expect(isYearlyMuhuratIndexable("wedding",2030)).toBe(false);
  });

  it("builds stable yearly owner paths",()=>{
    const delhi=findCityBySlug("delhi")!;
    expect(hinduCalendarYearPath(2027)).toBe("/hindu-calendar/2027");
    expect(cityCalendarYearPath(delhi,2027)).toBe("/calendar/delhi/2027");
    expect(muhuratYearPath("wedding",2027)).toBe("/muhurat/wedding/2027");
  });
});