import {describe,expect,it} from "vitest";
import type {OpportunityLifecycleRecord,OpportunityOutcomeCheckpoint} from "../lib/opportunity-lifecycle";
import type {SearchOpportunity} from "../lib/search-opportunities";
import {buildSeoActionPlan} from "../lib/seo-action-intelligence";

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

function record(outcomes:OpportunityOutcomeCheckpoint[]=[]):OpportunityLifecycleRecord{
  return {
    key:"tool:choghadiya:mumbai",
    stage:"MEASURING",
    owner:"",
    note:"",
    createdAt:"2026-09-01T00:00:00.000Z",
    updatedAt:"2026-09-29T00:00:00.000Z",
    shippedAt:"2026-09-29T00:00:00.000Z",
    context:{label:"Choghadiya",topQuery:"choghadiya today mumbai",city:"Mumbai",recommendedPath:"/tools/choghadiya/mumbai",template:"City Choghadiya tool"},
    outcomes,
    history:[],
  };
}

describe("SEO Action Intelligence",()=>{
  it("turns WRONG_LANDING into a P0 ownership/cannibalization plan",()=>{
    const plan=buildSeoActionPlan({opportunity:opportunity(),record:record()});
    expect(plan.priority).toBe("P0");
    expect(plan.mode).toBe("DISCOVERY");
    expect(plan.headline).toContain("ownership");
    expect(plan.targetPath).toBe("/tools/choghadiya/mumbai");
    expect(plan.currentPath).toBe("/panchang/mumbai");
    expect(plan.steps[0].area).toBe("LANDING");
    expect(plan.steps.some(step=>step.area==="INTERNAL_LINKS")).toBe(true);
    expect(plan.steps.some(step=>step.evidence.includes("420 impressions"))).toBe(true);
  });

  it("keeps LOW_CTR focused on snippet/content measurement rather than creating a new URL",()=>{
    const item=opportunity({status:"LOW_CTR",action:"IMPROVE_SNIPPET",position:4.2,ctr:.011,currentLanding:"https://panchvani.com/tools/choghadiya/mumbai",reason:"Correct page has low CTR."});
    const plan=buildSeoActionPlan({opportunity:item,record:record()});
    expect(plan.priority).toBe("P2");
    expect(plan.steps[0].area).toBe("TITLE_H1");
    expect(plan.steps.some(step=>step.area==="MEASUREMENT"&&step.action.includes("CTR"))).toBe(true);
    expect(plan.steps.some(step=>step.action.includes("Build the approved"))).toBe(false);
  });

  it("gives NEW_CLUSTER an index-safe build plan",()=>{
    const item=opportunity({key:"vrat:ekadashi:delhi:2026",intent:"vrat:ekadashi",label:"Ekadashi",topQuery:"ekadashi 2026 delhi",city:"Delhi",currentLanding:null,recommendedPath:"/vrat/ekadashi/2026/delhi",template:"Vrata yearly hub + city pages",status:"NEW_CLUSTER",action:"BUILD",score:91,reason:"Missing page family."});
    const plan=buildSeoActionPlan({opportunity:item,record:record()});
    expect(plan.priority).toBe("P1");
    expect(plan.steps.some(step=>step.area==="INDEXING"&&step.action.includes("out of indexable expansion")&&step.action.includes("pass review"))).toBe(true);
    expect(plan.guardrail).toContain("not an automatic publish instruction");
  });

  it("uses a decisive ITERATE outcome instead of the old discovery diagnosis",()=>{
    const outcome=checkpoint({recommendation:"ITERATE",signal:"MIXED",score:48,landingAligned:false,post:{startDate:"2026-09-29",endDate:"2026-10-26",clicks:11,impressions:320,ctr:.034,position:11,topLanding:"https://panchvani.com/panchang/mumbai"},reason:"The top post-launch landing is still not the recommended target."});
    const plan=buildSeoActionPlan({opportunity:opportunity({status:"STRIKING_DISTANCE",action:"STRENGTHEN"}),record:record([outcome])});
    expect(plan.mode).toBe("OUTCOME");
    expect(plan.priority).toBe("P1");
    expect(plan.headline).toContain("second iteration");
    expect(plan.steps[0].area).toBe("LANDING");
    expect(plan.steps[0].action).toContain("/panchang/mumbai");
  });

  it("turns a regression into a P0 diagnostic plan",()=>{
    const outcome=checkpoint({recommendation:"REGRESSED",signal:"DOWN",score:24,clicksChangePct:-45,impressionsChangePct:-38,ctrDeltaPoints:-1.2,positionImprovement:-5,reason:"Combined post-launch metrics materially regressed."});
    const plan=buildSeoActionPlan({opportunity:null,record:record([outcome])});
    expect(plan.mode).toBe("OUTCOME");
    expect(plan.priority).toBe("P0");
    expect(plan.headline).toContain("regression");
    expect(plan.steps.some(step=>step.action.includes("fresh measurement cycle"))).toBe(true);
  });

  it("protects a validated winner from unnecessary churn",()=>{
    const plan=buildSeoActionPlan({opportunity:null,record:record([checkpoint()])});
    expect(plan.mode).toBe("OUTCOME");
    expect(plan.priority).toBe("P3");
    expect(plan.headline).toContain("winner");
    expect(plan.steps[0].action).toContain("avoid unnecessary title/content churn");
  });

  it("does not invent actions for stale records without current GSC or outcome evidence",()=>{
    const plan=buildSeoActionPlan({opportunity:null,record:record()});
    expect(plan.mode).toBe("MONITOR");
    expect(plan.priority).toBe("P3");
    expect(plan.headline).toContain("fresh demand evidence");
    expect(plan.steps).toHaveLength(1);
  });
});
