import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("Wave 3Q cannot silently certify Guru/Shukra ceremony exclusions",()=>{
  it("keeps method comparison research outside production Muhurat",()=>{
    for(const path of [
      "lib/muhurat.ts","lib/verified-muhurat-closures.ts",
      "lib/muhurat-verification-notice.ts"
    ]){
      const source=readFileSync(path,"utf8");
      expect(source).not.toContain("asta-uncertainty-audit");
      expect(source).not.toContain("asta-wave3q-reconciliation");
    }
    const audit=readFileSync("scripts/asta-wave3q-reconciliation.ts","utf8");
    expect(audit).toContain("safeForCeremonyFiltering:false");
    expect(audit).toContain("methodCrosswalkVerified:false");
    expect(audit).toContain("isConfidenceInterval:false");
    expect(audit).toContain("modelsApprovedForWedding:0");
    expect(audit).toContain("native-event-outside-target-year");
  });
  it("chains the Wave 3Q report AFTER the Wave 3O and 3P source artifacts",()=>{
    const workflow=readFileSync(".github/workflows/quality.yml","utf8");
    expect(workflow.indexOf("npm run research:asta-models")).toBeLessThan(
      workflow.indexOf("npm run audit:asta-methodology"));
    expect(workflow.indexOf("npm run research:asta-heliacal")).toBeLessThan(
      workflow.indexOf("npm run audit:asta-methodology"));
    expect(workflow).toContain("asta-wave3q-methodology-uncertainty");
    const pkg=JSON.parse(readFileSync("package.json","utf8"));
    expect(pkg.scripts["audit:asta-methodology"]).toContain("scripts/asta-wave3q-reconciliation.ts");
    expect(pkg.scripts.build).not.toContain("asta-wave3q");
    expect(pkg.scripts["deploy:vinext"]).toBe("vinext-cloudflare deploy");
  });
});
