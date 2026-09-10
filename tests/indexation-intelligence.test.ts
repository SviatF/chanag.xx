import {describe,expect,it} from "vitest";
import type {GscIndexInspection,GscTrafficSnapshot} from "../lib/gsc";
import type {OpportunityLifecycleRecord} from "../lib/opportunity-lifecycle";
import type {SearchOpportunity} from "../lib/search-opportunities";
import {analyzeIndexInspections,selectIndexInspectionCandidates,summarizeIndexation} from "../lib/indexation-intelligence";

function inspection(overrides:Partial<GscIndexInspection>={}):GscIndexInspection{
  return {inspectedUrl:"https://panchvani.com/tools/choghadiya/mumbai",verdict:"PASS",coverageState:"Submitted and indexed",robotsTxtState:"ALLOWED",indexingState:"INDEXING_ALLOWED",lastCrawlTime:"2026-09-01T00:00:00Z",pageFetchState:"SUCCESSFUL",googleCanonical:"https://panchvani.com/tools/choghadiya/mumbai",userCanonical:"https://panchvani.com/tools/choghadiya/mumbai",crawledAs:"MOBILE",sitemaps:["https://panchvani.com/sitemap-tools.xml"],referringUrls:[],inspectedAt:"2026-09-10T00:00:00Z",...overrides};
}

function snapshot():GscTrafficSnapshot{
  return {siteUrl:"sc-domain:panchvani.com",startDate:"2026-08-12",endDate:"2026-09-08",previousStartDate:"2026-07-15",previousEndDate:"2026-08-11",current:{clicks:10,impressions:1000,ctr:.01,position:10},previous:{clicks:5,impressions:500,ctr:.01,position:12},queries:[],queryPages:[],daily:[],pages:[{keys:["https://panchvani.com/panchang/delhi"],clicks:5,impressions:800,ctr:.006,position:9}]};
}

function opportunity():SearchOpportunity{
  return {key:"tool:choghadiya:mumbai",intent:"tool:choghadiya",label:"Choghadiya",topQuery:"choghadiya mumbai",queryCount:4,city:"Mumbai",clicks:3,impressions:500,ctr:.006,position:8,currentLanding:"https://panchvani.com/panchang/mumbai",recommendedPath:"/tools/choghadiya/mumbai",template:"City Choghadiya tool",status:"WRONG_LANDING",action:"ALIGN",score:88,reason:"wrong landing"};
}

function record():OpportunityLifecycleRecord{
  return {key:"ship",stage:"MEASURING",owner:"",note:"",createdAt:"2026-08-01T00:00:00Z",updatedAt:"2026-09-01T00:00:00Z",shippedAt:"2026-09-01T00:00:00Z",context:{label:"Daily",topQuery:"panchang pune",city:"Pune",recommendedPath:"/panchang/pune",template:"Daily city Panchang"},implementations:[{id:"impl-1",hypothesis:"Improve page",commitSha:"abcdef1",prUrl:null,changedFiles:["app/panchang/page.tsx"],deployedUrl:"https://panchvani.com/panchang/pune",versionLabel:"v1",note:"",createdAt:"2026-09-01T00:00:00Z",updatedAt:"2026-09-01T00:00:00Z",shippedAt:"2026-09-01T00:00:00Z"}],activeImplementationId:"impl-1",shippedImplementationId:"impl-1",history:[]};
}

describe("Indexation Intelligence",()=>{
  it("prioritizes attributed shipped URLs before opportunities and traffic pages",()=>{
    const rows=selectIndexInspectionCandidates(snapshot(),[opportunity()],{ship:record()},10);
    expect(rows[0].source).toBe("SHIPPED");
    expect(rows[0].url).toContain("/panchang/pune");
    expect(rows.some(row=>row.source==="OPPORTUNITY")).toBe(true);
    expect(rows.some(row=>row.source==="TRAFFIC")).toBe(true);
  });

  it("flags robots and noindex blocks as critical",()=>{
    const candidates=[{url:"https://panchvani.com/a",source:"TRAFFIC" as const,priority:1,reason:"test"},{url:"https://panchvani.com/b",source:"TRAFFIC" as const,priority:1,reason:"test"}];
    const rows=analyzeIndexInspections([
      inspection({inspectedUrl:"https://panchvani.com/a",robotsTxtState:"DISALLOWED",pageFetchState:"BLOCKED_ROBOTS_TXT"}),
      inspection({inspectedUrl:"https://panchvani.com/b",indexingState:"BLOCKED_BY_META_TAG"})
    ],candidates,new Date("2026-09-10T00:00:00Z"));
    expect(rows.every(row=>row.severity==="CRITICAL")).toBe(true);
    expect(rows.map(row=>row.issue)).toEqual(expect.arrayContaining(["ROBOTS_BLOCK","NOINDEX_BLOCK"]));
  });

  it("detects Google/user canonical disagreement",()=>{
    const rows=analyzeIndexInspections([inspection({googleCanonical:"https://panchvani.com/panchang/delhi",userCanonical:"https://panchvani.com/panchang/mumbai"})],[{url:"https://panchvani.com/tools/choghadiya/mumbai",source:"OPPORTUNITY",priority:1,reason:"test"}],new Date("2026-09-10T00:00:00Z"));
    expect(rows[0].issue).toBe("CANONICAL_MISMATCH");
    expect(rows[0].severity).toBe("HIGH");
  });

  it("separates fetch failures from content/indexing diagnosis",()=>{
    const rows=analyzeIndexInspections([inspection({pageFetchState:"SERVER_ERROR",verdict:"FAIL"})],[{url:"https://panchvani.com/tools/choghadiya/mumbai",source:"TRAFFIC",priority:1,reason:"test"}],new Date("2026-09-10T00:00:00Z"));
    expect(rows[0].issue).toBe("FETCH_ERROR");
    expect(rows[0].action).toContain("fetch/HTTP");
  });

  it("marks an otherwise healthy but stale crawl as medium",()=>{
    const rows=analyzeIndexInspections([inspection({lastCrawlTime:"2026-06-01T00:00:00Z"})],[{url:"https://panchvani.com/tools/choghadiya/mumbai",source:"TRAFFIC",priority:1,reason:"test"}],new Date("2026-09-10T00:00:00Z"));
    expect(rows[0].issue).toBe("STALE_CRAWL");
    expect(rows[0].crawlAgeDays).toBeGreaterThan(45);
  });

  it("treats missing sitemap reporting as informational, not proof of a sitemap bug",()=>{
    const rows=analyzeIndexInspections([inspection({sitemaps:[]})],[{url:"https://panchvani.com/tools/choghadiya/mumbai",source:"TRAFFIC",priority:1,reason:"test"}],new Date("2026-09-10T00:00:00Z"));
    expect(rows[0].issue).toBe("NO_SITEMAP_SIGNAL");
    expect(rows[0].severity).toBe("INFO");
    expect(rows[0].action).toContain("not guaranteed to be exhaustive");
  });

  it("summarizes operational issue counts deterministically",()=>{
    const candidates=[{url:"https://panchvani.com/a",source:"TRAFFIC" as const,priority:1,reason:"test"},{url:"https://panchvani.com/b",source:"TRAFFIC" as const,priority:1,reason:"test"}];
    const rows=analyzeIndexInspections([inspection({inspectedUrl:"https://panchvani.com/a"}),inspection({inspectedUrl:"https://panchvani.com/b",pageFetchState:"NOT_FOUND",verdict:"FAIL"})],candidates,new Date("2026-09-10T00:00:00Z"));
    const summary=summarizeIndexation(rows);
    expect(summary.inspected).toBe(2);
    expect(summary.healthy).toBe(1);
    expect(summary.fetchErrors).toBe(1);
    expect(summary.critical).toBe(1);
  });
});
