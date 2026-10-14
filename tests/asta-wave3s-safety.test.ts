import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {assessAstaEvidenceForFiltering} from "./fixtures/planetary-asta-2027-provenance";

describe("Wave 3S source integrity never grants ceremony permission",()=>{
  it("closes the legacy count-based ceremony approval pathway",()=>{
    const checked=assessAstaEvidenceForFiltering("Jupiter",2027,"Mumbai, Maharashtra");
    expect(checked.readyForCeremonyFiltering).toBe(false);
    expect(checked.safeForCeremonyFiltering).toBe(false);
    const src=readFileSync("tests/fixtures/planetary-asta-2027-provenance.ts","utf8");
    expect(src).toContain("readyForCeremonyFiltering:false as const");
    expect(src).not.toContain("readyForCeremonyFiltering:publisherCount>=2");
  });
  it("keeps provenance snapshots and city audits out of public Muhurat / SEO",()=>{
    for(const path of [
      "lib/muhurat.ts","lib/verified-muhurat-closures.ts",
      "lib/muhurat-verification-notice.ts"
    ]){
      const code=readFileSync(path,"utf8");
      expect(code).not.toContain("asta-city-source-reproducibility");
      expect(code).not.toContain("asta-wave3s-source-reproducibility");
    }
    const pkg=JSON.parse(readFileSync("package.json","utf8"));
    expect(pkg.scripts["audit:asta-city-sources"])
      .toContain("scripts/asta-wave3s-source-reproducibility.ts");
    expect(pkg.scripts.build).not.toContain("asta-city-sources");
    expect(pkg.scripts["deploy:vinext"]).toBe("vinext-cloudflare deploy");
  });
  it("requires source-locality reproducibility report in CI",()=>{
    const ci=readFileSync(".github/workflows/quality.yml","utf8");
    expect(ci).toContain("npm run audit:asta-city-sources");
    expect(ci).toContain("asta-wave3s-city-source-reproducibility");
    expect(ci.indexOf("npm run audit:asta-evidence")).toBeLessThan(
      ci.indexOf("npm run audit:asta-city-sources"));
  });
});
