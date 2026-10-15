import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {getPinnedV6HalfTithiTable,JPL_V6_ROOTS_ASSET_SHA256} from "../lib/jpl-v6-pinned-data";
import {jplHalfTithiAtMs} from "../lib/jpl-v6-tithi-karana-canary";
import {
  getJplV6SunriseLunarCanary,
  compareDailyPanchangV6Canary,
  compareYearlyVratV6Canary,
  compareMuhuratMonthV6Canary
} from "../lib/jpl-v6-crossfamily-canary";

describe("Wave 3AG: real checked-in JPL V6 lunar canary",()=>{
  it("verifies exact model-generated asset bytes, trusted kernel and 4512 real 6° roots",()=>{
    const raw=readFileSync("generated/jpl-v6-half-tithi-2025-2030.ts","utf8");
    const json=raw.match(/^export default (.*);\n$/s)?.[1];
    expect(json).toBeDefined();
    const parsed=JSON.parse(json!);
    const hash=createHash("sha256").update(json!+"\n").digest("hex");
    expect(hash).toBe(JPL_V6_ROOTS_ASSET_SHA256);
    const t=getPinnedV6HalfTithiTable();
    expect(t.halfTithiBoundaryCount).toBe(4512);
    expect(t.kernelSha256).toBe("c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2");
    expect(parsed.halfTithiTransitions).toHaveLength(4512);
    const jan=Date.parse("2027-01-31T01:04:15.581Z");
    const november=Date.parse("2026-11-21T01:02:01.531Z");
    expect(jplHalfTithiAtMs(t,jan-2000).tithiIndex).toBe(23);
    expect(jplHalfTithiAtMs(t,jan+2000).tithiIndex).toBe(24);
    expect(jplHalfTithiAtMs(t,november-2000).tithiIndex).toBe(10);
    expect(jplHalfTithiAtMs(t,november+2000).tithiIndex).toBe(11);
    expect(()=>jplHalfTithiAtMs(t,Date.parse("2032-01-01T00:00:00Z"))).toThrow(/coverage/);
  });
  it("compares exact physical sunrise for known Kanpur and Patna JPL lunar-day flips",()=>{
    const t=getPinnedV6HalfTithiTable();
    const patna=getJplV6SunriseLunarCanary("2027-01-31",cityBySlug("patna"),t);
    expect(patna.tithi).toBe("Navami");
    expect(patna.paksha).toBe("Krishna");
    expect(patna.tithiIndex).toBe(23);
    expect(patna.previousNewMoonUtc).toMatch(/^2027-/);
    expect(patna.karanaHalfIndex).toBeGreaterThanOrEqual(0);
    expect(patna.siderealMonthVerified).toBe(false);
    expect(patna.ritualFastingCertified).toBe(false);
    const kanpur=getJplV6SunriseLunarCanary("2026-11-21",cityBySlug("kanpur"),t);
    expect(kanpur.tithi).toBe("Ekadashi");
    expect(kanpur.paksha).toBe("Shukla");
    expect(kanpur.productionChangeAllowed).toBe(false);
    expect(()=>getJplV6SunriseLunarCanary("2032-01-01",cityBySlug("patna"),t)).toThrow();
  },20_000);
  it("uses the exact same V6 lunar classification across Daily and Muhurat samples",async()=>{
    const t=getPinnedV6HalfTithiTable();
    const c=cityBySlug("patna");
    const daily=await compareDailyPanchangV6Canary("2027-01-31",c,t);
    const month=await compareMuhuratMonthV6Canary(2027,1,c,t);
    const row=month.details.find(r=>r.date==="2027-01-31");
    expect(daily.differences.tithi).toBe(true);
    expect(row?.tithiChanged).toBe(true);
    expect(daily.v6.tithi).toBe(row?.v6.tithi);
    expect(daily.v6.karana).toBe(row?.v6.karana);
    expect(daily.v6.tithiEnd).toBe(row?.v6.tithiEnd);
    expect(daily.v6.karanaEnd).toBe(row?.v6.karanaEnd);
    expect(month.scoreOrWeddingValidityApproved).toBe(false);
  },45_000);
  it("reconciles V6 annual sunrise-Vrat label with JPL daily results without approving a fast",()=>{
    const t=getPinnedV6HalfTithiTable();
    const r=compareYearlyVratV6Canary(2026,cityBySlug("kanpur"),t);
    const ekadashi=r.families.find(f=>f.slug==="ekadashi")!;
    expect(ekadashi.v6Only).toContain("2026-11-21");
    expect(ekadashi.traditionFastCertified).toBe(false);
    expect(ekadashi.paranaCertified).toBe(false);
    expect(r.calendarSwitchAllowed).toBe(false);
  },45_000);
  it("does not change production calendar engine, Vrat, Muhurat, old V5 shards or rituals",()=>{
    const audit=readFileSync("scripts/wave3ag-v6-crossfamily-canary-audit.ts","utf8");
    expect(audit).toContain("compareDailyPanchangV6Canary");
    expect(audit).toContain("compareYearlyVratV6Canary");
    expect(audit).toContain("compareMuhuratMonthV6Canary");
    expect(audit).toContain("productionAstronomicalEngineStillV5:true");
    const check=readFileSync("scripts/wave3ag-check-committed-jpl.py","utf8");
    expect(check).toContain("byte-identical");
    expect(check).toContain("EXPECTED_RAW_SHA");
    const workflow=readFileSync(".github/workflows/quality.yml","utf8");
    expect(workflow).toContain("wave3ag-check-committed-jpl.py");
    expect(workflow).toContain("npm run audit:jpl-v6-crossfamily");
    expect(JSON.parse(readFileSync("package.json","utf8")).scripts["audit:jpl-v6-crossfamily"]).toContain("wave3ag-v6-crossfamily-canary-audit.ts");
    for(const file of ["lib/panchang.ts","lib/vrat.ts","lib/muhurat.ts","lib/festivals.ts","lib/muhurat-build-data-schema.ts"]){
      const source=readFileSync(file,"utf8");
      expect(source).not.toContain("jpl-v6-pinned-data");
      expect(source).not.toContain("jpl-v6-crossfamily-canary");
    }
  });
});
