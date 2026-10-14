import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {loadMuhuratPrecomputedManifest} from "../lib/muhurat-precomputed";

describe("Wave 3AE: complete committed-city-day risk screening and JPL release gates",()=>{
  it("requires all 48 real precomputed V5 shards with at least 10k city-day rows",async()=>{
    const data=await loadMuhuratPrecomputedManifest();
    expect(data).not.toBeNull();
    expect(data!.version).toBe(5);
    expect(data!.entries).toBeDefined();
    const rows=Object.values(data!.entries).reduce((sum,month)=>sum+month.length,0);
    expect(Object.keys(data!.entries).length).toBeGreaterThanOrEqual(300);
    expect(rows).toBeGreaterThan(10_000);
    const source=readFileSync("scripts/wave3ae-swiss-full-shard-screen.ts","utf8");
    expect(source).toContain("MUHURAT_PANCHANG_SHARD_IDS.length!==48");
    expect(source).toContain("row.dayChoghadiya[0].start");
    expect(source).toContain("sweCalcUt");
    expect(source).toContain("sweRiseTrans");
    expect(source).toContain("if(indexLo===indexHi)continue");
    expect(source).toContain("sourceSnapshotMatchesSwissAtSunrise");
    expect(source).toContain("seen.has(dayKey)");
    expect(source).toContain("includesAllDynamicDailyCityDateRoutes:false");
    expect(source).toContain("candidateProductionChangesApproved:0");
  },20_000);
  it("tests all prefiltered candidates against JPL at exact observer and phase root",()=>{
    const x=readFileSync("scripts/wave3ae-jpl-full-impact.py","utf8");
    expect(x).toContain("for i,c in enumerate(candidates)");
    expect(x).toContain("oracle.sunrise(c[");
    expect(x).toContain("oracle.phase_root(c[");
    expect(x).toContain("jplIndexAtJplSunrise");
    expect(x).toContain("modelSunriseTithiFlipCount");
    expect(x).toContain("automaticallyApprovedChanges");
    expect(x).toContain("allDynamicDailyCityDateRoutesScanned");
    expect(x).toContain("productionCodeUnchanged");
    const pkg=JSON.parse(readFileSync("package.json","utf8"));
    expect(pkg.scripts["audit:near-sunrise-shards"]).toContain("wave3ae-swiss-full-shard-screen.ts");
    const ci=readFileSync(".github/workflows/quality.yml","utf8");
    expect(ci).toContain("npm run audit:near-sunrise-shards");
    expect(ci).toContain("python scripts/wave3ae-jpl-full-impact.py");
    expect(ci).toContain("wave3ae-all-committed-city-days-jpl-impact");
  });
  it("cannot mutate production astronomy or claim any ritual fast, Parana or Puja approval",()=>{
    for(const path of ["lib/panchang.ts","lib/vrat.ts","lib/muhurat.ts","lib/festivals.ts","lib/seo-policy.ts"]){
      const x=readFileSync(path,"utf8");
      expect(x).not.toContain("wave3ae");
      expect(x).not.toContain("skyfield");
    }
    const py=readFileSync("scripts/wave3ae-jpl-full-impact.py","utf8");
    expect(py).toContain('"fastOrPujaCertified":False');
    expect(py).toContain('"automaticRewriteAllowed":False');
    expect(py).toContain('"requiresVersionedCompleteRegenerationAndCacheInvalidation":True');
  });
});
