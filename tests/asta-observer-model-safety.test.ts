import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("Wave 3O is a research instrument, never a production Muhurat filter",()=>{
  it("does not leak mathematical Asta model variants into ceremony date selection",()=>{
    const targets=[
      "lib/muhurat.ts","lib/verified-muhurat-closures.ts",
      "lib/muhurat-verification-notice.ts"
    ];
    for(const target of targets){
      const source=readFileSync(target,"utf8");
      expect(source).not.toContain("asta-model-benchmark");
      expect(source).not.toContain("asta-observer-model-comparison");
    }
  });
  it("always identifies the incomplete observational and source-provenance model",()=>{
    const src=readFileSync("scripts/asta-observer-model-comparison.ts","utf8");
    expect(src).toContain("safeForCeremonyFiltering:false");
    expect(src).toContain('atmosphereAndHorizonModel:"NOT IMPLEMENTED"');
    expect(src).toContain("sourceLocationMode");
    expect(src).toContain("stationSwitchUnresolved");
    expect(src).not.toContain("getMonthlyMuhurat(");
  });
  it("requires an explicit non-production report in CI, not a runtime client script",()=>{
    const workflow=readFileSync(".github/workflows/quality.yml","utf8");
    expect(workflow).toContain("npm run research:asta-models");
    expect(workflow).toContain("asta-wave3o-model-comparison");
    const pkg=JSON.parse(readFileSync("package.json","utf8")) as {scripts:Record<string,string>};
    expect(pkg.scripts["research:asta-models"]).toContain("scripts/asta-observer-model-comparison.ts");
    expect(pkg.scripts.build).not.toContain("asta-observer-model-comparison");
    expect(pkg.scripts["deploy:vinext"]).toBe("vinext-cloudflare deploy");
  });
});
