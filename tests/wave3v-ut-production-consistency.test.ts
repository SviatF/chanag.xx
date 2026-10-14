import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {cityBySlug} from "../lib/cities";
import {getPanchang} from "../lib/panchang";
import {calculateVratCalendar} from "../lib/vrat";
import {compareVratTimeScales} from "../lib/vrat-ut-et-diagnostic";
import {MUHURAT_BUILD_DATA_VERSION} from "../lib/muhurat-build-data-schema";

describe("Wave 3V: synchronized UT-correct lunar calendar release",()=>{
  it("fixes the real Delhi 30 June 2026 false Purnima-at-sunrise",async()=>{
    const delhi=cityBySlug("delhi");
    const research=compareVratTimeScales(delhi,"2026-06-30");
    expect(research.utCorrectTithiIndex).toBe(15);
    expect(research.legacyTithiIndex).toBe(14);
    expect(research.utLastTransitionSecondsBeforeSunrise).toBeGreaterThan(0);
    const actual=await getPanchang(new Date("2026-06-30T06:00:00Z"),delhi);
    expect(actual.sunrise).toBe("05:27");
    expect(actual.paksha).toBe("Krishna");
    expect(actual.tithi).toBe("Pratipada");
    const purnima=calculateVratCalendar("purnima",2026,delhi);
    expect(purnima.some(row=>row.date==="2026-06-30")).toBe(false);
  });
  it("runs UT-correct ephemeris consistently in daily Panchang and yearly Vrat",()=>{
    const daily=readFileSync("lib/panchang.ts","utf8");
    const yearly=readFileSync("lib/vrat.ts","utf8");
    expect(daily).toContain("sweCalcUt(swed, jd,");
    expect(yearly).toContain("sweCalcUt(swed,jd,");
    expect(daily).not.toMatch(/\bsweCalc\s*\(/);
    expect(yearly).not.toMatch(/\bsweCalc\s*\(/);
  });
  it("invalidates old V4 shards through a versioned snapshot migration",()=>{
    expect(MUHURAT_BUILD_DATA_VERSION).toBe(5);
    const precompute=readFileSync("scripts/precompute-muhurat.ts","utf8");
    expect(precompute).toContain('readFile(resolve(root,"lib/panchang.ts"');
    expect(precompute).toContain("MUHURAT_BUILD_DATA_VERSION");
    expect(precompute).toContain("isFreshShard");
    const pkg=JSON.parse(readFileSync("package.json","utf8"));
    expect(pkg.scripts.build).toContain("verify:muhurat-precompute");
  });
  it("preserves 3V migration provenance and does not permit precompute in live Next build",()=>{
    const migration=readFileSync(".github/workflows/wave3v-one-time-shard-migration.yml","utf8");
    expect(migration).toContain("npm run precompute:muhurat");
    expect(migration).toContain("npm run verify:muhurat-precompute");
    expect(migration).toContain("wave3v-shard-migration-diff.mjs");
    expect(migration).not.toContain("npm run deploy");
    const quality=readFileSync(".github/workflows/quality.yml","utf8");
    expect(quality).toContain("Verify committed Muhurat build data");
    expect(quality).not.toContain("Generate Muhurat pilot build data");
  });
});