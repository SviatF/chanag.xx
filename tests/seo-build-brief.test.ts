import {describe,expect,it} from "vitest";
import type {OpportunityLifecycleRecord,OpportunityOutcomeCheckpoint,OpportunityStage} from "../lib/opportunity-lifecycle";
import type {SearchOpportunity} from "../lib/search-opportunities";
import {buildSeoExecutionBrief,seoExecutionBriefToMarkdown} from "../lib/seo-build-brief";

function opportunity(overrides:Partial<SearchOpportunity>={}):SearchOpportunity{
  return {
    key:"tool:choghadiya:mumbai",
    intent:"tool:choghadiya",
    label:"Choghadiya",
    topQuery:"choghadiya today mumbai",
    queryCount:4,
    city:"Mumbai",
    clicks:8,
    impressions:420,
    ctr:.019,
    position:8.4,
    currentLanding:"https://panchvani.com/panchang/mumbai",
    recommendedPath:"/tools/choghadiya/mumbai",
    template:"City Choghadiya tool",
    status:"WRONG_LANDING",
    action:"ALIGN",
    score:86,
    reason:"Google is sending this intent to the wrong page.",
    ...overrides,
  };
}

function checkpoint(overrides:Partial<OpportunityOutcomeCheckpoint>={}):OpportunityOutcomeCheckpoint{
  return {
    days:28,
    evaluatedAt:"2026-10-20T00:00:00.000Z",
    pre:{startDate:"2026-09-01",endDate:"2026-09-28",clicks:10,impressions:300,ctr:.033,position:13,topLanding:"https://panchvani.com/panchang/mumbai"},
    post:{startDate:"2026-09-29",endDate:"2026-10-26",clicks:18,impressions:450,ctr:.04,position:8,topLanding:"https://panchvani.com/tools/choghadiya/mumbai"},
    landingAligned:true,
    clicksChangePct:80,
    impressionsChangePct:50,
    ctrDeltaPoints:.7,
    positionImprovement:5,
    score:82,
    signal:"WINNING",
    recommendation:"WON",
    reason:"The recommended landing owns the query and the post-launch window is strong.",
    ...overrides,
  };
}

function record(stage:OpportunityStage="DETECTED",outcomes:OpportunityOutcomeCheckpoint[]=[]):OpportunityLifecycleRecord{
  return {
    key:"tool:choghadiya:mumbai",
    stage,
    owner:"",
    note:"",
    createdAt:"2026-09-01T00:00:00.000Z",
    updatedAt:"2026-09-29T00:00:00.000Z",
    ...(stage==="APPROVED"||stage==="BUILD"?{approvedAt:"2026-09-20T00:00:00.000Z"}:{}),
    ...(stage==="BUILD"?{buildStartedAt:"2026-09-22T00:00:00.000Z"}:{}),
    ...(stage==="SHIPPED"||stage==="MEASURING"||stage==="WON"?{shippedAt:"2026-09-29T00:00:00.000Z"}:{}),
    context:{label:"Choghadiya",topQuery:"choghadiya today mumbai",city:"Mumbai",recommendedPath:"/tools/choghadiya/mumbai",template:"City Choghadiya tool"},
    outcomes,
    history:[],
  };
}

describe("SEO Execution Copilot build briefs",()=>{
  it("turns an approved wrong-landing opportunity into a build-ready page-family brief",()=>{
    const brief=buildSeoExecutionBrief({opportunity:opportunity(),record:record("APPROVED")});
    expect(brief.readiness).toBe("READY_FOR_BUILD");
    expect(brief.targetPath).toBe("/tools/choghadiya/mumbai");
    expect(brief.currentPath).toBe("/panchang/mumbai");
    expect(brief.sections.some(section=>section.title==="Day Choghadiya"&&section.required)).toBe(true);
    expect(brief.sections.some(section=>section.title==="Night Choghadiya"&&section.required)).toBe(true);
    expect(brief.internalLinks.some(item=>item.includes("Cannibalization check"))).toBe(true);
    expect(brief.titleDirection).toContain("choghadiya today mumbai");
  });

  it("keeps a new vrata cluster in review and requires a reviewed date source before indexing",()=>{
    const item=opportunity({
      key:"vrat:ekadashi:delhi:2026",intent:"vrat:ekadashi",label:"Ekadashi",topQuery:"ekadashi 2026 delhi",city:"Delhi",
      currentLanding:null,recommendedPath:"/vrat/ekadashi/2026/delhi",template:"Vrata yearly hub + city pages",
      status:"NEW_CLUSTER",action:"BUILD",score:91,reason:"Missing page family."
    });
    const stored={...record("DETECTED"),key:item.key,context:{label:item.label,topQuery:item.topQuery,city:item.city,recommendedPath:item.recommendedPath,template:item.template}};
    const brief=buildSeoExecutionBrief({opportunity:item,record:stored});
    expect(brief.readiness).toBe("READY_FOR_REVIEW");
    expect(brief.sections.some(section=>section.title==="Yearly date set"&&section.purpose.includes("reviewed data source"))).toBe(true);
    expect(brief.technicalChecks.some(item=>item.includes("Do not add the route to indexable expansion"))).toBe(true);
    expect(brief.schemaChecks.every(item=>!item.includes("FAQPage"))).toBe(true);
  });

  it("blocks execution when GSC demand has no clear landing owner",()=>{
    const item=opportunity({status:"NO_CLEAR_LANDING",action:"REVIEW",currentLanding:null,reason:"No clear query-to-page row."});
    const brief=buildSeoExecutionBrief({opportunity:item,record:record("REVIEW")});
    expect(brief.readiness).toBe("BLOCKED");
    expect(brief.blocker).toContain("query-to-page ownership");
    expect(brief.executionSteps.some(step=>step.area==="INDEXING")).toBe(true);
  });

  it("marks shipped or measuring work as measure-only while no decisive outcome exists",()=>{
    const shipped=buildSeoExecutionBrief({opportunity:opportunity(),record:record("SHIPPED")});
    expect(shipped.readiness).toBe("MEASURE_ONLY");

    const measuring=buildSeoExecutionBrief({opportunity:opportunity(),record:record("MEASURING",[checkpoint({days:14,recommendation:"KEEP_MEASURING",signal:"MIXED",score:61,reason:"Keep measuring."})])});
    expect(measuring.readiness).toBe("MEASURE_ONLY");
  });

  it("re-opens a controlled review brief when Outcome Intelligence recommends iteration",()=>{
    const outcome=checkpoint({recommendation:"ITERATE",signal:"MIXED",score:48,landingAligned:false,reason:"The landing is still misaligned."});
    const brief=buildSeoExecutionBrief({opportunity:opportunity(),record:record("MEASURING",[outcome])});
    expect(brief.mode).toBe("OUTCOME");
    expect(brief.readiness).toBe("READY_FOR_REVIEW");
    expect(brief.executionSteps[0].area).toBe("LANDING");
    expect(brief.measurementPlan.some(item=>item.includes("14/28/56-day"))).toBe(true);
  });

  it("keeps a won lifecycle in measure-only preservation mode",()=>{
    const brief=buildSeoExecutionBrief({opportunity:null,record:record("WON",[checkpoint()])});
    expect(brief.readiness).toBe("MEASURE_ONLY");
    expect(brief.objective).toContain("winner");
  });

  it("renders a deterministic markdown handoff with execution and acceptance sections",()=>{
    const input={opportunity:opportunity(),record:record("APPROVED")};
    const first=seoExecutionBriefToMarkdown(buildSeoExecutionBrief(input));
    const second=seoExecutionBriefToMarkdown(buildSeoExecutionBrief(input));
    expect(first).toBe(second);
    expect(first).toContain("# Panchvani SEO Execution Brief");
    expect(first).toContain("## Required page structure");
    expect(first).toContain("## Acceptance criteria");
    expect(first).toContain("## Measurement plan");
    expect(first).toContain("/tools/choghadiya/mumbai");
    expect(first).toContain("Evidence:");
  });
});
