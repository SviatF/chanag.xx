import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {cityBySlug} from "../lib/cities";
import {festivalBySlugYear} from "../lib/festivals";
import {getFestivalForCity,getReviewedLocalFestivalDate,reviewedLocalFestivalDates} from "../lib/festival-local-date";
import {getRegionalFestivalObservance} from "../lib/festival-regional-observances";
import {getPanchang} from "../lib/panchang";

describe("2026 Govardhan Puja city-specific date truth",()=>{
  const national=festivalBySlugYear("govardhan-puja",2026)!;
  it("corrects exactly source-reviewed localities rather than adding a statewide/national offset",()=>{
    expect(national.date).toBe("2026-11-10");
    expect(reviewedLocalFestivalDates).toHaveLength(5);
    for(const citySlug of ["mumbai","pune","jaipur","indore","ahmedabad"]){
      const city=cityBySlug(citySlug);
      const reference=getReviewedLocalFestivalDate(national,city);
      expect(reference?.date).toBe("2026-11-09");
      expect(reference?.source).toMatch(/^https:\/\//);
      expect(new Date(reference!.date+"T12:00:00Z").getUTCDay()).toBe(1); // Monday
      const local=getFestivalForCity(national,city);
      expect(local.date).toBe("2026-11-09");
      expect(getRegionalFestivalObservance(national,city)?.date).toBe(local.date);
    }
    for(const slug of ["delhi","chennai","kolkata","bengaluru","hyderabad"]){
      const city=cityBySlug(slug);
      expect(getFestivalForCity(national,city).date).toBe("2026-11-10");
      expect(getReviewedLocalFestivalDate(national,city)).toBeNull();
    }
    expect(festivalBySlugYear("govardhan-puja",2026)!.date).toBe("2026-11-10");
    expect(getFestivalForCity(festivalBySlugYear("govardhan-puja",2027)!,cityBySlug("mumbai")).date).toBe("2027-10-30");
    expect(getReviewedLocalFestivalDate(festivalBySlugYear("dussehra",2026)!,cityBySlug("mumbai"))).toBeNull();
  });

  it("uses source-reviewed local date for real city Panchang calculations, not only an annotation",async()=>{
    const city=cityBySlug("mumbai");
    const local=getFestivalForCity(national,city);
    const panchang=await getPanchang(new Date(local.date+"T06:00:00Z"),city);
    const baseline=await getPanchang(new Date(national.date+"T06:00:00Z"),city);
    expect(panchang.date).toBe("2026-11-09");
    expect(baseline.date).toBe("2026-11-10");
    expect(panchang.tithi).toBe("Amavasya");
    expect(panchang.paksha).toBe("Krishna");
    expect(baseline.tithi).toBe("Pratipada");
    expect(baseline.paksha).toBe("Shukla");
  });
  it("wires metadata, headings, facts and all other city context to the same corrected date",()=>{
    const jsx=readFileSync("app/festivals/[festival]/[year]/[city]/page.tsx","utf8");
    expect(jsx).toContain('import {getFestivalForCity} from "@/lib/festival-local-date"');
    expect(jsx.match(/const festival=getFestivalForCity\(maintainedFestival,city\);/g)).toHaveLength(2);
    expect(jsx).toContain('new Date(`${festival.date}T06:00:00Z`)');
    expect(jsx).toContain("buildFestivalCityQualityContent(festival,city,data");
    expect(jsx).toContain("getRegionalFestivalObservance(festival,city)");
  });
});
