import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {calculateVratCalendar} from "../lib/vrat";
import {compareEkadashiArunodaya,ARUNODAYA_MINUTES_BEFORE_SUNRISE} from "../lib/ekadashi-observance-research";
import {wave3zSourceObservations,wave3zMethodSources} from "./fixtures/wave3z-source-observations";

describe("Wave 3Z: research-only tradition and dawn decision boundary",()=>{
  it("uses exact UT Julian instants for upper-limb sunrise and 96-minute arunodaya",()=>{
    const result=compareEkadashiArunodaya(cityBySlug("delhi"),"2027-01-19");
    expect(ARUNODAYA_MINUTES_BEFORE_SUNRISE).toBe(96);
    expect(result.conventionProfile).toContain("research-arunodaya-96m");
    expect(result.city).toBe("delhi");
    expect(result.date).toBe("2027-01-19");
    expect(result.sunrise.date).toBe(result.date);
    expect(result.followingSunrise.date).toBe("2027-01-20");
    expect(result.closestSunriseBoundarySeconds).toBeGreaterThanOrEqual(0);
    expect(result.closestArunodayaBoundarySeconds).toBeGreaterThanOrEqual(0);
    expect(result.sunriseTithiIndex).toBeGreaterThanOrEqual(0);
    expect(result.sunriseTithiIndex).toBeLessThan(30);
    expect(result.chosenSmartaFastDate).toBeNull();
    expect(result.chosenVaishnavaFastDate).toBeNull();
    expect(result.chosenISKCONFastDate).toBeNull();
    expect(result.independentlyCertifiedFast).toBe(false);
    expect(result.paranaWindowCertified).toBe(false);
    expect(result.safeForCeremonyFiltering).toBe(false);
  });
  it("keeps boundary-sensitive Kanpur ISKCON fast observation separate from sunrise Tithi",()=>{
    const r=compareEkadashiArunodaya(cityBySlug("kanpur"),"2026-11-21");
    expect(r.sunriseTithi).toBe("Shukla Dwadashi");
    expect(r.dashamiArunodayaScreen).toBe("not-ekadashi-at-sunrise");
    expect(r.chosenISKCONFastDate).toBeNull();
    const printed=wave3zSourceObservations.find(s=>s.city==="kanpur")!;
    expect(printed.observedFastingDate).toBe("2026-11-21");
    expect(printed.independentlyMethodCertified).toBe(false);
  });
  it("does not reinterpret a published Delhi Jan 18 fast as a universal sunrise-only selector",()=>{
    const first=compareEkadashiArunodaya(cityBySlug("delhi"),"2027-01-18");
    const second=compareEkadashiArunodaya(cityBySlug("delhi"),"2027-01-19");
    expect(first.date).not.toBe(second.date);
    expect(first.independentlyCertifiedFast).toBe(false);
    expect(second.mahadvadashiSubtypesReviewed).toBe(false);
    expect(wave3zSourceObservations.filter(s=>s.city==="delhi").map(s=>s.observedFastingDate))
      .toEqual(["2027-01-18","2027-01-19"]);
    expect(new Set(wave3zSourceObservations.map(s=>new URL(s.url).hostname))).toHaveProperty("size",1);
  });
  it("can scan actual annual sunrise-Ekadashi candidates without claiming fasting eligibility",()=>{
    const city=cityBySlug("mumbai");
    const rows=calculateVratCalendar("ekadashi",2027,city);
    expect(rows.length).toBeGreaterThan(20);
    const checked=rows.slice(0,4).map(row=>compareEkadashiArunodaya(city,row.date));
    expect(checked.length).toBe(4);
    for(const caseResult of checked){
      expect([10,25]).toContain(caseResult.sunriseTithiIndex);
      expect(caseResult.chosenVaishnavaFastDate).toBeNull();
      expect(caseResult.paranaWindowCertified).toBe(false);
      expect(caseResult.safeForCeremonyFiltering).toBe(false);
    }
    const audit=readFileSync("scripts/wave3z-ekadashi-observance-audit.ts","utf8");
    expect(audit).toContain("annualSunriseEkadashiDaysScreened");
    expect(audit).toContain("annualDashamiArunodayaCandidates");
    expect(audit).toContain("skippedEkadashiWithoutSunriseNotSearched:true");
  });
  it("does not treat an astronomical Hari Vasara quarter as approved Parana",()=>{
    const x=compareEkadashiArunodaya(cityBySlug("delhi"),"2027-01-03");
    expect(x.paranaWindowCertified).toBe(false);
    if(x.hariVasara){
      expect(x.dwadashiNextSunrise).toBe(true);
      expect(x.hariVasara.validOrder).toBe(true);
      expect(x.hariVasara.firstQuarterEnds.time).toMatch(/^\d\d:\d\d$/);
      expect(x.hariVasara.researchEarliestPostSunriseAndQuarter.date)
        .toMatch(/^\d{4}-\d\d-\d\d$/);
    }
  });
  it("rejects malformed civil dates, without defaulting to a city or fast",()=>{
    expect(()=>compareEkadashiArunodaya(cityBySlug("mumbai"),"bad-date")).toThrow();
    expect(()=>compareEkadashiArunodaya(cityBySlug("mumbai"),"2027-02-31")).toThrow();
  });
  it("makes the full audit mandatory but leaves all published engines unchanged",()=>{
    const pkg=JSON.parse(readFileSync("package.json","utf8"));
    const ci=readFileSync(".github/workflows/quality.yml","utf8");
    expect(pkg.scripts["audit:ekadashi-observance"]).toContain("wave3z-ekadashi-observance-audit.ts");
    expect(ci).toContain("npm run audit:ekadashi-observance");
    expect(ci).toContain("wave3z-ekadashi-tradition");
    expect(wave3zMethodSources.length).toBeGreaterThanOrEqual(2);
    for(const path of [
      "lib/vrat.ts","lib/panchang.ts","lib/muhurat.ts","lib/festivals.ts",
      "lib/festival-night-eligibility.ts","app/vrat/[vrat]/[year]/[city]/page.tsx"
    ]){
      const text=readFileSync(path,"utf8");
      expect(text).not.toContain("ekadashi-observance-research");
      expect(text).not.toContain("wave3z-ekadashi-observance-audit");
    }
  });
});
