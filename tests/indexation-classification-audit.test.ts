import {describe,expect,it} from "vitest";
import {DAILY_METADATA_RELEASE_END,phase1PriorityCities,primaryMuhuratEvents,wave2ControlledCities} from "../lib/seo-policy";
// @ts-ignore Audit runtime is intentionally a plain Node ESM module.
import {
  AUDIT_PRIORITY_CITIES,
  AUDIT_CONTROLLED_CITIES,
  AUDIT_DAILY_RELEASE_END,
  AUDIT_PRIMARY_MUHURAT_EVENTS,
  classifyOutsideUrl,
  classifyReport,
} from "../scripts/indexation-classifier.mjs";

const REFERENCE="2026-09-16";

describe("outside-sitemap indexation classification",()=>{
  it("keeps the audit policy mirror aligned with SEO policy",()=>{
    expect(AUDIT_PRIORITY_CITIES).toEqual([...phase1PriorityCities]);
    expect(AUDIT_CONTROLLED_CITIES).toEqual([...wave2ControlledCities]);
    expect(AUDIT_DAILY_RELEASE_END).toBe(DAILY_METADATA_RELEASE_END);
    expect(AUDIT_PRIMARY_MUHURAT_EVENTS).toEqual([...primaryMuhuratEvents]);
  });

  it("separates daily and monthly metadata-indexable gaps from intentional windows",()=>{
    expect(classifyOutsideUrl("https://panchvani.com/panchang/mumbai/2026-09-01",REFERENCE)).toMatchObject({classification:"intentional_exclusion",reason:"RETAINED_DAILY_ARCHIVE_OUTSIDE_SITEMAP"});
    expect(classifyOutsideUrl("https://panchvani.com/panchang/mumbai/2026-08-31",REFERENCE)).toMatchObject({classification:"intentional_exclusion",reason:"DAILY_OUTSIDE_PINNED_METADATA_RELEASE"});
    expect(classifyOutsideUrl("https://panchvani.com/panchang/mumbai/2026-09-15",REFERENCE).classification).toBe("indexable_candidate");
    expect(classifyOutsideUrl("https://panchvani.com/calendar/delhi/2026/06",REFERENCE).classification).toBe("indexable_candidate");
    expect(classifyOutsideUrl("https://panchvani.com/calendar/delhi/2026/05",REFERENCE).classification).toBe("intentional_exclusion");
  });

  it("classifies the controlled Wave 2 city pages without unclassified warnings",()=>{
    expect(classifyOutsideUrl("https://panchvani.com/panchang/ludhiana/2026-10-09","2026-10-26")).toMatchObject({classification:"intentional_exclusion",reason:"RETAINED_DAILY_ARCHIVE_OUTSIDE_SITEMAP"});
    expect(classifyOutsideUrl("https://panchvani.com/panchang/ludhiana/2026-10-22","2026-10-26")).toMatchObject({classification:"intentional_exclusion",reason:"RETAINED_DAILY_ARCHIVE_OUTSIDE_SITEMAP"});
    expect(classifyOutsideUrl("https://panchvani.com/panchang/ludhiana/2026-11-09","2026-10-26")).toMatchObject({classification:"indexable_candidate",family:"panchang-daily"});
    expect(classifyOutsideUrl("https://panchvani.com/calendar/agra/2026/11","2026-10-26")).toMatchObject({classification:"intentional_exclusion",reason:"MONTHLY_OUTSIDE_INDEX_WINDOW"});
    expect(classifyOutsideUrl("https://panchvani.com/panchang/coimbatore/2026-10-26","2026-10-26")).toMatchObject({classification:"intentional_exclusion",reason:"CITY_NOT_IN_AUDIT_DAILY_COHORT"});
  });

  it("treats undated Panchang aliases and unvalidated festival pages as intentional exclusions",()=>{
    expect(classifyOutsideUrl("https://panchvani.com/panchang/mumbai",REFERENCE)).toMatchObject({classification:"intentional_exclusion",reason:"TODAY_ALIAS_CANONICALIZES_TO_DATED_PAGE"});
    expect(classifyOutsideUrl("https://panchvani.com/festivals/diwali/2027",REFERENCE)).toMatchObject({classification:"intentional_exclusion",family:"festival-year"});
    expect(classifyOutsideUrl("https://panchvani.com/festivals/diwali/2027/mumbai",REFERENCE)).toMatchObject({classification:"intentional_exclusion",family:"festival-city"});
  });

  it("detects Muhurat metadata versus rolling-sitemap drift",()=>{
    expect(classifyOutsideUrl("https://panchvani.com/muhurat/wedding/2025/01",REFERENCE).classification).toBe("indexable_candidate");
    expect(classifyOutsideUrl("https://panchvani.com/muhurat/wedding/2026/08/mumbai",REFERENCE).classification).toBe("indexable_candidate");
    expect(classifyOutsideUrl("https://panchvani.com/muhurat/gold-purchase/2026/09",REFERENCE).classification).toBe("intentional_exclusion");
  });

  it("resolves the dynamic gold accuracy gate from live robots semantics",async()=>{
    const report:any={
      generatedAt:"2026-09-15T20:33:58.694Z",
      warnings:[{code:"LINKED_OUTSIDE_SITEMAP",message:"legacy"}],
      summary:{warnings:1},
      linkedOutsideSitemap:[{url:"https://panchvani.com/gold-rate",inboundLinks:5}],
    };
    const fetchImpl=async()=>new Response("<html><head><meta name=\"robots\" content=\"noindex, follow\"></head></html>",{status:200,headers:{"content-type":"text/html"}});
    await classifyReport(report,{fetchImpl:fetchImpl as typeof fetch});
    expect(report.indexationClassification).toMatchObject({referenceIndiaDate:"2026-09-16",indexableCandidates:0,intentionalExclusions:1,needsReview:0});
    expect(report.linkedOutsideSitemap[0]).toMatchObject({classification:"intentional_exclusion",reason:"DYNAMIC_GOLD_ACCURACY_GATE_NOINDEX"});
    expect(report.warnings).toHaveLength(0);
  });
});
