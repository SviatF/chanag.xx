import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {MUHURAT_BUILD_DATA_VERSION} from "../lib/muhurat-build-data-schema";
import {JPL_V6_ROOTS_ASSET_SHA256} from "../lib/jpl-v6-pinned-data";
import {
  PUBLIC_LUNAR_ENGINE_VERSION,STAGED_LUNAR_ENGINE_VERSION,
  V6_STAGING_SHARD_SCHEMA,UNRECONCILED_V6_DEPENDENCIES,
  v6StagingCacheKey,assertProductionLunarEngine,assertV6StagingShardIdentity,
  getStagedV6Daily,getStagedV6VratYear,getStagedV6MuhuratMonth
} from "../lib/v6-calendar-staging";

describe("Wave 3AH: versioned V6 lunar staging (NO public activation)",()=>{
  it("keeps release selector pinned to V5, rejects V6 and legacy shards",()=>{
    expect(assertProductionLunarEngine(PUBLIC_LUNAR_ENGINE_VERSION)).toBe("v5-swiss-moshier");
    expect(()=>assertProductionLunarEngine(STAGED_LUNAR_ENGINE_VERSION)).toThrow(/blocked/);
    expect(()=>assertProductionLunarEngine("v7")).toThrow(/blocked/);
    expect(MUHURAT_BUILD_DATA_VERSION).toBe(5);
    expect(V6_STAGING_SHARD_SCHEMA).toBe(6);
    expect(()=>assertV6StagingShardIdentity({version:5,shardId:"2026-11"})).toThrow(/V5/);
    const correct={
      engine:STAGED_LUNAR_ENGINE_VERSION,schema:V6_STAGING_SHARD_SCHEMA,
      provenanceSha256:JPL_V6_ROOTS_ASSET_SHA256,publicReleaseAllowed:false
    };
    expect(assertV6StagingShardIdentity(correct)).toBe(true);
    expect(()=>assertV6StagingShardIdentity({...correct,provenanceSha256:"wrong"})).toThrow();
    expect(()=>assertV6StagingShardIdentity({...correct,publicReleaseAllowed:true})).toThrow();
  });
  it("keys staging cache by source hash and city, never reuses V5 signatures",()=>{
    const patna=cityBySlug("patna");
    const kanpur=cityBySlug("kanpur");
    const a=v6StagingCacheKey(2027,1,patna);
    expect(a).toContain(STAGED_LUNAR_ENGINE_VERSION);
    expect(a).toContain(JPL_V6_ROOTS_ASSET_SHA256);
    expect(a).not.toBe(`${patna.slug}|2027-01`);
    expect(a).not.toBe(v6StagingCacheKey(2027,1,kanpur));
    expect(()=>v6StagingCacheKey(2032,1,patna)).toThrow(/Invalid/);
    expect(()=>v6StagingCacheKey(2027,13,patna)).toThrow(/Invalid/);
  });
  it("stages the three known sunrise flips with a single JPL Tithi/Karana source",async()=>{
    for(const [city,date,tithi,paksha] of [
      ["kanpur","2026-11-21","Ekadashi","Shukla"],
      ["patna","2027-01-31","Navami","Krishna"],
      ["delhi","2026-06-30","Purnima","Shukla"]
    ] as const){
      const stage=await getStagedV6Daily(date,cityBySlug(city));
      expect(stage.lunar.tithi).toBe(tithi);
      expect(stage.lunar.paksha).toBe(paksha);
      expect(stage.simulatedPanchang.tithi).toBe(stage.lunar.tithi);
      expect(stage.simulatedPanchang.karana).toBe(stage.lunar.karana);
      expect(stage.simulatedPanchang.tithiEnd).toBe(stage.lunar.tithiEnd);
      expect(stage.simulatedPanchang.karanaEnd).toBe(stage.lunar.karanaEnd);
      expect(stage.provenanceSha256).toBe(JPL_V6_ROOTS_ASSET_SHA256);
      expect(stage.publicReleaseAllowed).toBe(false);
      expect(stage.unreconciled).toEqual(UNRECONCILED_V6_DEPENDENCIES);
    }
    await expect(getStagedV6Daily("2032-01-01",cityBySlug("patna"))).rejects.toThrow(/coverage/);
    await expect(getStagedV6Daily("2027-02-30",cityBySlug("patna"))).rejects.toThrow(/Invalid/);
  },45_000);
  it("produces complete annual JPL Vrat sunrise references without certifying fasting",()=>{
    const year=getStagedV6VratYear(2026,cityBySlug("kanpur"));
    const kanpur=year.rows.ekadashi.find(row=>row.date==="2026-11-21");
    expect(kanpur?.tithi).toBe("Ekadashi");
    expect(kanpur?.tithiEnd).toMatch(/^\d{2}:\d{2}$/);
    expect(kanpur?.sequence).toBeGreaterThan(0);
    expect(year.rows.purnima.every(row=>row.paksha==="Shukla")).toBe(true);
    expect(year.rows.amavasya.every(row=>row.paksha==="Krishna")).toBe(true);
    expect(year.rows.ekadashi.map(row=>row.date)).toEqual(
      year.rows.ekadashi.map(row=>row.date).sort()
    );
    expect(year.fastingAndParanaCertified).toBe(false);
    expect(year.publicReleaseAllowed).toBe(false);
    expect(()=>getStagedV6VratYear(2031,cityBySlug("kanpur"))).toThrow();
  },45_000);
  it("stages a real month of Muhurat input without promoting ritual scores",async()=>{
    const city=cityBySlug("patna");
    const stage=await getStagedV6MuhuratMonth(2027,1,city);
    expect(stage.rows).toHaveLength(31);
    const daily=await getStagedV6Daily("2027-01-31",city);
    const final=stage.rows.at(-1);
    expect(final?.date).toBe("2027-01-31");
    expect(final?.tithi).toBe(daily.lunar.tithi);
    expect(final?.tithiEnd).toBe(daily.lunar.tithiEnd);
    expect(final?.karana).toBe(daily.lunar.karana);
    expect(final?.karanaEnd).toBe(daily.lunar.karanaEnd);
    expect(stage.key).toContain(STAGED_LUNAR_ENGINE_VERSION);
    expect(stage.rankingsAndRitualWindowsCertified).toBe(false);
    expect(stage.siderealFieldsReconciled).toBe(false);
    expect(stage.publicReleaseAllowed).toBe(false);
  },90_000);
  it("keeps all public routes, production families and V5 shards isolated from staging",()=>{
    const paths=[
      "lib/panchang.ts","lib/vrat.ts","lib/muhurat.ts",
      "lib/muhurat-precomputed.ts",
      "app/panchang/[city]/[[...date]]/page.tsx",
      "app/vrat/[vrat]/[year]/[city]/page.tsx",
      "app/muhurat/[event]/[year]/[month]/[city]/page.tsx"
    ];
    for(const path of paths){
      const source=readFileSync(path,"utf8");
      expect(source).not.toContain("v6-calendar-staging");
      expect(source).not.toContain("getStagedV6Daily");
    }
    expect(readFileSync("scripts/precompute-muhurat.ts","utf8")).not.toContain("v6-calendar-staging");
    expect(readFileSync("scripts/wave3ah-precompute-v6-staging.ts","utf8")).toContain("legacyV5PrecomputedShardsUnchanged:true");
  });
});
