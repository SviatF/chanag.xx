import {describe,expect,it} from "vitest";
import {phase1PriorityCities,primaryMuhuratEvents} from "../lib/seo-policy";
import {
  AUDIT_PRIORITY_CITIES,
  AUDIT_PRIMARY_MUHURAT_EVENTS,
  classifyOutsideUrl,
  classifyReport,
} from "../scripts/indexation-classifier.mjs";

const REFERENCE="2026-09-16";

describe("outside-sitemap indexation classification",()=>{
  it("keeps the audit policy mirror aligned with SEO policy",()=>{
    expect(AUDIT_PRIORITY_CITIES).toEqual([...phase1PriorityCities]);
    expect(AUDIT_PRIMARY_MUHURAT_EVENTS).toEqual([...primaryMuhuratEvents]);
  });

  it("separates daily and monthly metadata-indexable gaps from intentional windows",()=>{
    expect(classifyOutsideUrl("https://panchvani.com/panchang/mumbai/2026-08-02",REFERENCE).classification).toBe("indexable_candidate");
    expect(classifyOutsideUrl("https://panchvani.com/panchang/mumbai/2026-08-01",REFERENCE).classification).toBe("intentional_exclusion");
    expect(classifyOutsideUrl("https://panchvani.com/calendar/delhi/2026/06",REFERENCE).classification).toBe("indexable_candidate");
    expect(classifyOutsideUrl("https://panchvani.com/calendar/delhi/2026/05",REFERENCE).classification).toBe("intentional_exclusion");
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
