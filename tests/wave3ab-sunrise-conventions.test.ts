import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {compareSunriseConventions,SWISS_HINDU_RISE_MASK,DEFAULT_RISE_MASK,utInstant,istInstant} from "../lib/sunrise-convention-differential";
import {compareVratTimeScales} from "../lib/vrat-ut-et-diagnostic";
import {patnaJan2027PublishedClocks} from "./fixtures/patna-wave3ab-observations";

describe("Wave 3AB: solar convention, exact UT and independent-publisher gap",()=>{
  it("does not silently treat upper-limb rise as Hindu geometric center",()=>{
    expect(SWISS_HINDU_RISE_MASK).toBe(897);
    expect(DEFAULT_RISE_MASK).toBe(1);
    const r=compareSunriseConventions(cityBySlug("patna"),"2027-01-31");
    expect(r.sourceModel).toContain("Moshier");
    expect(r.comparisonIsIndependentEphemeris).toBe(false);
    expect(r.defaultApparentUpperLimb.sunrise.ist.startsWith("2027-01-31T")).toBe(true);
    expect(r.hinduGeometricCenter.sunrise.ist.startsWith("2027-01-31T")).toBe(true);
    expect(r.secondsHinduSunriseAfterApparent).toBeGreaterThan(60);
    expect(r.secondsHinduSunriseAfterApparent).toBeLessThan(900);
    expect(r.defaultApparentUpperLimb.tithi).toBe("Krishna Dashami");
    expect(r.defaultApparentUpperLimb.secondsSincePreviousTithi).toBeGreaterThanOrEqual(0);
    expect(r.hinduGeometricCenter.secondsSincePreviousTithi).toBeGreaterThanOrEqual(0);
    expect(r.externalExactSecondProofAvailable).toBe(false);
    expect(r.safeToSwitchProductionConvention).toBe(false);
    expect(r.certifiedFastingDate).toBeNull();
    expect(r.certifiedCorrectTraditionSunrise).toBeNull();
  });
  it("exposes source-level minute rounding without claiming exact-second confirmation",()=>{
    expect(patnaJan2027PublishedClocks).toHaveLength(4);
    expect(new Set(patnaJan2027PublishedClocks.map(s=>s.domain)).size).toBe(4);
    expect(patnaJan2027PublishedClocks.every(s=>s.date==="2027-01-31")).toBe(true);
    expect(patnaJan2027PublishedClocks.every(s=>s.reportedPrecision==="minute")).toBe(true);
    expect(patnaJan2027PublishedClocks.every(s=>!s.matchedSwissMethodProven)).toBe(true);
    expect(patnaJan2027PublishedClocks.every(s=>!s.exactSecondTithiEndAvailable)).toBe(true);
    expect(compareVratTimeScales(cityBySlug("patna"),"2027-01-31").utCorrectTithiIndex).toBe(24);
  });
  it("preserves second-resolution UT chronology instead of rounding source time first",()=>{
    const d=compareSunriseConventions(cityBySlug("delhi"),"2026-06-30");
    expect(d.defaultApparentUpperLimb.tithi).toBe("Krishna Pratipada");
    const jd=d.defaultApparentUpperLimb.sunrise.jdUT;
    expect(utInstant(jd)).toMatch(/Z$/);
    expect(istInstant(jd)).toMatch(/\+05:30$/);
    expect(Date.parse(utInstant(jd))).toBe(Date.parse(istInstant(jd)));
  });
  it("forbids automatic calendar rewrites or false 8-case Vedha approval",()=>{
    const audit=readFileSync("scripts/wave3ab-sunrise-source-audit.ts","utf8");
    expect(audit).toContain("selectedSmartaFast:null");
    expect(audit).toContain("selectedISKCONFast:null");
    expect(audit).toContain("allowedToPatchAstronomy:false");
    expect(audit).toContain("cityPinnedSecondLevelExternalClocksVerified:0");
    const pkg=JSON.parse(readFileSync("package.json","utf8"));
    const ci=readFileSync(".github/workflows/quality.yml","utf8");
    expect(pkg.scripts["audit:sunrise-conventions"]).toContain("wave3ab-sunrise-source-audit.ts");
    expect(ci).toContain("npm run audit:sunrise-conventions");
    for(const path of ["lib/panchang.ts","lib/vrat.ts","lib/muhurat.ts","lib/festivals.ts"]){
      const source=readFileSync(path,"utf8");
      expect(source).not.toContain("sunrise-convention-differential");
    }
  });
});
