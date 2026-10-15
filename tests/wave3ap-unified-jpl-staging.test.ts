import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {cityBySlug,supportedCities} from "../lib/cities";
import {
  UNIFIED_V6_RESEARCH_SCHEMA,V6_UNIFIED_PINNED_SIDEREAL_SHA256,
  V6_UNIFIED_PINNED_LAHIRI_SHA256,
  openVerifiedV6SiderealSource,getV6UnifiedSunrise,
  getV6UnifiedMonth,unifiedV6ResearchKey
} from "../lib/v6-unified-calendar-staging";

describe("Wave 3AP: exact-source research-only unified JPL sunrise engine",()=>{
  it("pins actual reviewed Wave 3AO binary digests rather than self-hashing arbitrary data",()=>{
    expect(UNIFIED_V6_RESEARCH_SCHEMA).toBe(7);
    expect(V6_UNIFIED_PINNED_SIDEREAL_SHA256).toHaveLength(64);
    expect(V6_UNIFIED_PINNED_LAHIRI_SHA256).toHaveLength(64);
    expect(V6_UNIFIED_PINNED_SIDEREAL_SHA256).not.toBe(V6_UNIFIED_PINNED_LAHIRI_SHA256);
    const source=readFileSync("lib/v6-unified-calendar-staging.ts","utf8");
    expect(source).toContain("sourceDigest!==V6_UNIFIED_PINNED_SIDEREAL_SHA256");
    expect(source).toContain("anchorDigest!==V6_UNIFIED_PINNED_LAHIRI_SHA256");
    expect(source).toContain("validateSiderealTransitionTable(catalog)");
    expect(source).toContain("Object.freeze(table.events)");
  });
  it("rejects absent, forged or swapped research source bytes",()=>{
    expect(()=>openVerifiedV6SiderealSource("{}", "{}")).toThrow();
    expect(()=>openVerifiedV6SiderealSource(
      JSON.stringify({wave:"3AO",schema:1,events:{}}),
      JSON.stringify({wave:"3AO"}))).toThrow();
    expect(()=>openVerifiedV6SiderealSource("not json","not json")).toThrow();
  });
  it("refuses unverified source objects for all city/date operations",()=>{
    const city=cityBySlug("patna");
    const fake={} as ReturnType<typeof openVerifiedV6SiderealSource>;
    expect(()=>getV6UnifiedSunrise("2027-01-31",city,fake)).toThrow(/not SHA-pinned/);
    expect(()=>getV6UnifiedMonth(2027,1,city,fake)).toThrow(/not SHA-pinned/);
    expect(()=>unifiedV6ResearchKey(2027,1,city,fake)).toThrow(/not SHA-pinned/);
  });
  it("tracks repeated source city records without counting them as independent cities",()=>{
    const bySlug=new Map<string,(typeof supportedCities)[number]>();
    let identicalDuplicates=0;
    for(const city of supportedCities){
      const known=bySlug.get(city.slug);
      if(known){
        expect({name:city.name,lat:city.lat,lng:city.lng,state:city.state,language:city.language})
          .toEqual({name:known.name,lat:known.lat,lng:known.lng,state:known.state,language:known.language});
        identicalDuplicates++;
      }else bySlug.set(city.slug,city);
    }
    expect(bySlug.size).toBeGreaterThanOrEqual(450);
    expect(identicalDuplicates).toBe(supportedCities.length-bySlug.size);
    const audit=readFileSync("scripts/wave3ap-verify-unified.ts","utf8");
    expect(audit).toContain("repeatedButIdenticalSourceCitySlugs:repeatedCityRecords");
  });
  it("requires one coherent sunrise and source identity, never constructs mixed V5 snapshots",()=>{
    const s=readFileSync("lib/v6-unified-calendar-staging.ts","utf8");
    expect(s).toContain("getJplV6SunriseLunarCanary(dateIso,city");
    expect(s).toContain("siderealStateAtUtc(source.table,lunar.sunriseUtc)");
    expect(s).toContain("families.nakshatra.index!==Math.floor(families.moonPada.index/4)");
    expect(s).toContain("publicReleaseAllowed:false as const");
    expect(s).not.toContain("simulatedPanchang");
    const audit=readFileSync("scripts/wave3ap-verify-unified.ts","utf8");
    expect(audit).toContain("supportedCities");
    expect(audit).toContain("getV6UnifiedMonth");
    expect(audit).toContain("assertProductionLunarEngine");
  });
  it("does not leak into production V5 or authorize Vrat/Muhurat dates",()=>{
    for(const path of ["lib/panchang.ts","lib/vrat.ts","lib/muhurat.ts",
      "lib/festivals.ts","lib/muhurat-precomputed.ts",
      "app/panchang/[city]/[[...date]]/page.tsx"]){
      expect(readFileSync(path,"utf8")).not.toContain("v6-unified-calendar-staging");
    }
    const audit=readFileSync("scripts/wave3ap-verify-unified.ts","utf8");
    expect(audit).toContain("festivalVratMuhuratApproved:false");
    expect(audit).toContain("allCityDays2026To2028Checked:false");
  });
});
