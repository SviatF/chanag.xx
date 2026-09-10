import {describe,expect,it} from "vitest";
import {lifecycleForOpportunity,transitionOpportunityLifecycle,type OpportunityLifecycleRecord} from "../lib/opportunity-lifecycle";
import {activeImplementation,implementationAttributionStatus,implementationReadyForShip,registerImplementationEvidence,shippedImplementation} from "../lib/seo-change-registry";
import {evaluateOutcomeCheckpoint} from "../lib/outcome-intelligence";
import {buildSeoExecutionBrief} from "../lib/seo-build-brief";

function base(stage:OpportunityLifecycleRecord["stage"]="BUILD"):OpportunityLifecycleRecord{
  return {...lifecycleForOpportunity("tool:choghadiya:mumbai",undefined,"2026-09-01T00:00:00.000Z"),stage,context:{label:"Choghadiya",topQuery:"choghadiya today mumbai",city:"Mumbai",recommendedPath:"/tools/choghadiya/mumbai",template:"City Choghadiya tool"}};
}

function evidence(record=base(),id="impl-a"){
  return registerImplementationEvidence(record,{id,hypothesis:"Move Choghadiya intent from the daily Panchang URL to the dedicated city tool.",commitSha:"abcdef1234567890",changedFiles:["app/tools/choghadiya/[city]/page.tsx","lib/topical-links.ts","lib/topical-links.ts"],deployedUrl:"https://panchvani.com/tools/choghadiya/mumbai",versionLabel:"seo-choghadiya-v1"},"2026-09-10T10:00:00.000Z");
}

describe("SEO Change Registry",()=>{
  it("requires hypothesis, code reference and deployed URL before attributable ship",()=>{
    const draft=registerImplementationEvidence(base(),{id:"draft",hypothesis:"Test landing ownership",changedFiles:["x.ts"]},"2026-09-10T10:00:00.000Z");
    expect(implementationReadyForShip(activeImplementation(draft))).toBe(false);
    expect(implementationAttributionStatus(draft).status).toBe("DRAFT");
  });

  it("normalizes duplicate changed files and marks complete evidence ready",()=>{
    const record=evidence();
    const active=activeImplementation(record)!;
    expect(active.changedFiles).toEqual(["app/tools/choghadiya/[city]/page.tsx","lib/topical-links.ts"]);
    expect(implementationReadyForShip(active)).toBe(true);
    expect(implementationAttributionStatus(record).status).toBe("READY");
  });

  it("freezes the active implementation when lifecycle moves to SHIPPED",()=>{
    const record=evidence();
    const shipped=transitionOpportunityLifecycle(record,record.key,"SHIPPED","2026-09-11T08:00:00.000Z",{metrics:{capturedAt:"2026-09-11T08:00:00.000Z",impressions:420,clicks:8,ctr:.019,position:8.4,opportunityScore:86}});
    expect(shipped.shippedImplementationId).toBe("impl-a");
    expect(shippedImplementation(shipped)?.shippedAt).toBe("2026-09-11T08:00:00.000Z");
    expect(implementationAttributionStatus(shipped).status).toBe("SHIPPED");
  });

  it("does not allow a shipped implementation snapshot to be rewritten",()=>{
    const record=evidence();
    const shipped=transitionOpportunityLifecycle(record,record.key,"SHIPPED","2026-09-11T08:00:00.000Z");
    expect(()=>registerImplementationEvidence(shipped,{id:"impl-a",hypothesis:"Rewrite history",commitSha:"1234567",deployedUrl:"https://panchvani.com/tools/choghadiya/mumbai"},"2026-09-12T08:00:00.000Z")).toThrow("immutable");
  });

  it("keeps prior shipped evidence while a new iteration becomes active",()=>{
    const first=transitionOpportunityLifecycle(evidence(),"tool:choghadiya:mumbai","SHIPPED","2026-09-11T08:00:00.000Z");
    const next=registerImplementationEvidence(first,{id:"impl-b",hypothesis:"Second controlled internal-link iteration.",prUrl:"https://github.com/SviatF/chanag.xx/pull/42",changedFiles:["lib/topical-links.ts"],deployedUrl:"https://panchvani.com/tools/choghadiya/mumbai",versionLabel:"seo-choghadiya-v2"},"2026-10-15T08:00:00.000Z");
    expect(next.activeImplementationId).toBe("impl-b");
    expect(next.shippedImplementationId).toBe("impl-a");
    expect(next.implementations).toHaveLength(2);
    expect(shippedImplementation(next)?.id).toBe("impl-a");
  });

  it("attributes outcome checkpoints to the frozen shipped implementation",()=>{
    const shipped=transitionOpportunityLifecycle(evidence(),"tool:choghadiya:mumbai","SHIPPED","2026-09-11T08:00:00.000Z");
    const checkpoint=evaluateOutcomeCheckpoint(shipped,{pre:{startDate:"2026-08-28",endDate:"2026-09-10",clicks:8,impressions:420,ctr:.019,position:8.4,topLanding:"https://panchvani.com/panchang/mumbai"},post:{startDate:"2026-09-11",endDate:"2026-09-24",clicks:14,impressions:500,ctr:.028,position:5.4,topLanding:"https://panchvani.com/tools/choghadiya/mumbai"}},14,"2026-09-26T08:00:00.000Z");
    expect(checkpoint.implementationId).toBe("impl-a");
    expect(checkpoint.landingAligned).toBe(true);
  });

  it("adds implementation evidence to READY_FOR_BUILD handoff requirements",()=>{
    const brief=buildSeoExecutionBrief({opportunity:{key:"tool:choghadiya:mumbai",intent:"tool:choghadiya",label:"Choghadiya",topQuery:"choghadiya today mumbai",queryCount:4,city:"Mumbai",clicks:8,impressions:420,ctr:.019,position:8.4,currentLanding:"https://panchvani.com/panchang/mumbai",recommendedPath:"/tools/choghadiya/mumbai",template:"City Choghadiya tool",status:"WRONG_LANDING",action:"ALIGN",score:86,reason:"Wrong landing."},record:base("BUILD")});
    expect(brief.readiness).toBe("READY_FOR_BUILD");
    expect(brief.technicalChecks.some(item=>item.includes("commit SHA or PR")&&item.includes("deployed HTTPS URL"))).toBe(true);
    expect(brief.measurementPlan.some(item=>item.includes("implementation ID"))).toBe(true);
  });
});
