import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("Wave 3P: physically informed research cannot certify Muhurat",()=>{
  it("does not import heliacal observations or atmosphere proxies into runtime calendars",()=>{
    for(const path of ["lib/muhurat.ts","lib/verified-muhurat-closures.ts","lib/muhurat-verification-notice.ts"]){
      const production=readFileSync(path,"utf8");
      expect(production).not.toContain("asta-heliacal-visibility");
      expect(production).not.toContain("asta-heliacal-visibility-research");
      expect(production).not.toContain("sweHeliacalUt");
    }
  });
  it("marks published Asta and independent native heliacal as methodologically unmatched",()=>{
    const src=readFileSync("scripts/asta-heliacal-visibility-research.ts","utf8");
    expect(src).toContain("sweHeliacalUt");
    expect(src).toContain("sweAzalt");
    expect(src).toContain("sweCalcUt");
    expect(src).toContain("publisherAstaEquivalentToNativeHeliacal:false");
    expect(src).toContain("safeForCeremonyFiltering:false");
    expect(src).toContain("claimedPhysicalVisibility:false");
    expect(src).toContain("notComparableToDrikAstaWithoutMethodMapping:true");
    expect(src).toContain("skipped-no-curated-observer-coordinate");
    expect(src).toContain("native-ephemeris-error");
  });
  it("requires explicit separate CI artifacts for scenario geometries and Swiss heliacal events",()=>{
    const ci=readFileSync(".github/workflows/quality.yml","utf8");
    expect(ci).toContain("npm run research:asta-visibility");
    expect(ci).toContain("npm run research:asta-heliacal");
    expect(ci).toContain("asta-wave3p-visibility-geometry");
    expect(ci).toContain("asta-wave3p-heliacal-sensitivity");
    const pkg=JSON.parse(readFileSync("package.json","utf8"));
    expect(pkg.scripts.build).not.toContain("asta-heliacal");
    expect(pkg.scripts["deploy:vinext"]).toBe("vinext-cloudflare deploy");
  });
});
