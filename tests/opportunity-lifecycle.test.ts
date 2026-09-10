import {describe,expect,it} from "vitest";
import type {SearchOpportunity} from "../lib/search-opportunities";
import {
  lifecycleForOpportunity,
  measureOpportunity,
  opportunityContext,
  opportunityMetrics,
  transitionOpportunityLifecycle
} from "../lib/opportunity-lifecycle";

function opportunity(overrides:Partial<SearchOpportunity>={}):SearchOpportunity{
  return {
    key:"tool:choghadiya:mumbai:2026:any",
    intent:"tool:choghadiya",
    label:"Choghadiya",
    topQuery:"choghadiya today mumbai",
    queryCount:3,
    city:"Mumbai",
    clicks:20,
    impressions:1000,
    ctr:.02,
    position:12,
    currentLanding:"https://panchvani.com/panchang/mumbai/2026-09-10",
    recommendedPath:"/tools/choghadiya/mumbai",
    template:"City Choghadiya tool",
    status:"WRONG_LANDING",
    action:"ALIGN",
    score:82,
    reason:"Wrong landing page",
    ...overrides
  };
}

describe("SEO opportunity lifecycle",()=>{
  it("starts detected and blocks invalid stage jumps",()=>{
    const row=lifecycleForOpportunity("x",undefined,"2026-09-10T10:00:00.000Z");
    expect(row.stage).toBe("DETECTED");
    expect(()=>transitionOpportunityLifecycle(row,"x","BUILD","2026-09-10T10:01:00.000Z")).toThrow(/DETECTED → BUILD/);
  });

  it("moves through review, approval, build and captures a ship baseline",()=>{
    const item=opportunity();
    let row=transitionOpportunityLifecycle(undefined,item.key,"REVIEW","2026-09-10T10:00:00.000Z",{context:opportunityContext(item),owner:"Sviat"});
    row=transitionOpportunityLifecycle(row,item.key,"APPROVED","2026-09-10T11:00:00.000Z",{note:"Build the dedicated landing experience"});
    row=transitionOpportunityLifecycle(row,item.key,"BUILD","2026-09-11T09:00:00.000Z");
    row=transitionOpportunityLifecycle(row,item.key,"SHIPPED","2026-09-12T12:00:00.000Z",{metrics:opportunityMetrics(item,"2026-09-12T12:00:00.000Z")});

    expect(row.stage).toBe("SHIPPED");
    expect(row.owner).toBe("Sviat");
    expect(row.context?.recommendedPath).toBe("/tools/choghadiya/mumbai");
    expect(row.baseline?.impressions).toBe(1000);
    expect(row.shippedAt).toBe("2026-09-12T12:00:00.000Z");
    expect(row.history.map(event=>event.to)).toEqual(["REVIEW","APPROVED","BUILD","SHIPPED"]);
  });

  it("does not add a fake transition when only owner or note changes",()=>{
    const first=transitionOpportunityLifecycle(undefined,"x","REVIEW","2026-09-10T10:00:00.000Z");
    const edited=transitionOpportunityLifecycle(first,"x","REVIEW","2026-09-10T10:05:00.000Z",{owner:"SEO Lead",note:"Check SERP intent"});
    expect(edited.history).toHaveLength(1);
    expect(edited.owner).toBe("SEO Lead");
    expect(edited.note).toBe("Check SERP intent");
  });

  it("measures post-launch movement against the captured ship baseline",()=>{
    const before=opportunity({clicks:10,impressions:800,ctr:.0125,position:14,score:86});
    let row=transitionOpportunityLifecycle(undefined,before.key,"REVIEW","2026-09-10T10:00:00.000Z",{context:opportunityContext(before)});
    row=transitionOpportunityLifecycle(row,before.key,"APPROVED","2026-09-10T11:00:00.000Z");
    row=transitionOpportunityLifecycle(row,before.key,"BUILD","2026-09-11T09:00:00.000Z");
    row=transitionOpportunityLifecycle(row,before.key,"SHIPPED","2026-09-12T12:00:00.000Z",{metrics:opportunityMetrics(before,"2026-09-12T12:00:00.000Z")});
    row=transitionOpportunityLifecycle(row,before.key,"MEASURING","2026-09-26T12:00:00.000Z");

    const after=opportunity({clicks:30,impressions:1600,ctr:.01875,position:7,score:68});
    const result=measureOpportunity(row,after,"2026-10-10T12:00:00.000Z");
    expect(result?.clicksDelta).toBe(20);
    expect(result?.impressionsDelta).toBe(800);
    expect(result?.positionImprovement).toBe(7);
    expect(result?.signal).toBe("WINNING");
  });

  it("allows rejected opportunities to return to review",()=>{
    let row=transitionOpportunityLifecycle(undefined,"x","REJECTED","2026-09-10T10:00:00.000Z",{note:"Not enough intent"});
    row=transitionOpportunityLifecycle(row,"x","REVIEW","2026-10-10T10:00:00.000Z",{note:"Demand increased"});
    expect(row.stage).toBe("REVIEW");
    expect(row.closedAt).toBeUndefined();
  });
});
