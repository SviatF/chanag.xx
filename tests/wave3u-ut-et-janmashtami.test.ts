import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {compareVratTimeScales} from "../lib/vrat-ut-et-diagnostic";
import {getPanchang} from "../lib/panchang";
import {festivalNightEligibility} from "../lib/festival-night-eligibility";
import {festivalBySlugYear} from "../lib/festivals";

describe("Wave 3U UT/ET and Janmashtami event definitions",()=>{
  it("uses sweCalcUt for UT, instead of treating a Julian sunrise in UT as ET",()=>{
    const d=compareVratTimeScales(cityBySlug("delhi"),"2026-06-30");
    expect(d.date).toBe("2026-06-30");
    expect(d.city).toBe("delhi");
    expect(d.sunriseIst).toMatch(/^\d\d:\d\d$/);
    expect(d.sunriseUtJd).toBeGreaterThan(2460000);
    expect(d.utCorrectTithiIndex).toBeGreaterThanOrEqual(0);
    expect(d.utCorrectTithiIndex).toBeLessThan(30);
    // This is an observed *different* Tithi state, not a formatting issue:
    // UT-correct ends Purnima before sunrise, while legacy ET-as-UT
    // incorrectly retains it beyond sunrise.
    expect(d.legacyTithiIndex).toBe(14); // Shukla Purnima
    expect(d.utCorrectTithiIndex).toBe(15); // following Krishna Pratipada
    expect(d.sameTithiAtSunrise).toBe(false);
    expect(d.localDateSelectionPotentiallyChanges).toBe(true);
    expect(d.utLastTransitionSecondsBeforeSunrise).toBeGreaterThan(20);
    expect(d.utLastTransitionSecondsBeforeSunrise).toBeLessThan(70);
    expect(d.legacyNextTransitionSecondsAfterSunrise).toBeGreaterThan(10);
    expect(d.legacyNextTransitionSecondsAfterSunrise).toBeLessThan(60);
    expect(d.withinFiveMinutesOfUtBoundary).toBe(true);
    expect(d.closestUtBoundaryDistanceSeconds).toBeGreaterThanOrEqual(0);
    expect(d.utLastTransitionSecondsBeforeSunrise).toBeGreaterThanOrEqual(0);
    expect(d.utNextTransitionSecondsAfterSunrise).toBeGreaterThanOrEqual(0);
    expect(d.safeToPatchProductionWithoutShardRebuild).toBe(false);
  });
  it("correctly brackets sunrise transitions on both sides even at calendar midnight",()=>{
    const m=compareVratTimeScales(cityBySlug("mumbai"),"2027-08-25");
    expect(m.utLastTransitionSecondsBeforeSunrise).toBeGreaterThanOrEqual(0);
    expect(m.utNextTransitionSecondsAfterSunrise).toBeGreaterThanOrEqual(0);
    expect(m.nextTransitionClockDriftSeconds).not.toBeNull();
    expect(Math.abs(m.nextTransitionClockDriftSeconds!)).toBeLessThan(300);
    expect(m.safeToPatchProductionWithoutShardRebuild).toBe(false);
  });
  it("does not claim 2027 Janmashtami date is wrong when Ashtami ends before Nishita",async()=>{
    const f=festivalBySlugYear("janmashtami",2027)!;
    const mumbai=cityBySlug("mumbai");
    const date=await getPanchang(new Date("2027-08-25T06:00:00Z"),mumbai);
    const following=await getPanchang(new Date("2027-08-26T06:00:00Z"),mumbai);
    const screen=festivalNightEligibility("janmashtami",date,following);
    expect(f.date).toBe("2027-08-25");
    expect(date.tithi).toBe("Ashtami");
    expect(screen?.status).toBe("none");
    expect(screen?.overlap).toBeNull();
    expect(screen?.tithiEnd).toContain("19:");
  });
  it("does not allow the non-certified 3U audit to change precomputed calendar routes",()=>{
    const audit=readFileSync("scripts/wave3u-time-scale-audit.ts","utf8");
    expect(audit).toContain("safeForCeremonyFiltering:false");
    expect(audit).toContain("productionSunriseTithiCorrectionsApplied:0");
    const ci=readFileSync(".github/workflows/quality.yml","utf8");
    expect(ci).toContain("npm run audit:vrat-time-scale");
    expect(ci).toContain("wave3u-ut-et-janmashtami");
    const pkg=JSON.parse(readFileSync("package.json","utf8"));
    expect(pkg.scripts["audit:vrat-time-scale"]).toContain("wave3u-time-scale-audit.ts");
    expect(pkg.scripts.build).not.toContain("wave3u");
    expect(pkg.scripts["deploy:vinext"]).toBe("vinext-cloudflare deploy");
    for(const path of [
      "lib/vrat.ts","lib/panchang.ts","lib/muhurat.ts",
      "lib/festivals.ts","lib/festival-expansion.ts"
    ]){
      const code=readFileSync(path,"utf8");
      expect(code).not.toContain("vrat-ut-et-diagnostic");
      expect(code).not.toContain("wave3u-time-scale-audit");
    }
  });
});
