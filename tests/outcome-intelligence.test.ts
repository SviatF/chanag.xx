import {describe,expect,it} from "vitest";
import type {GscOutcomeComparison} from "../lib/gsc";
import {gscCheckpointWindow,isGscCheckpointReady} from "../lib/gsc";
import type {OpportunityLifecycleRecord} from "../lib/opportunity-lifecycle";
import {
  appendOutcomeCheckpoint,
  checkpointReadyAt,
  dueOutcomeCheckpoints,
  evaluateOutcomeCheckpoint,
  landingMatchesRecommendation,
  latestOutcomeCheckpoint,
  nextOutcomeCheckpoint
} from "../lib/outcome-intelligence";

function record(overrides:Partial<OpportunityLifecycleRecord>={}):OpportunityLifecycleRecord{
  return {
    key:"tool:choghadiya:mumbai:2026:any",
    stage:"MEASURING",
    owner:"SEO",
    note:"",
    createdAt:"2026-08-20T10:00:00.000Z",
    updatedAt:"2026-09-01T10:00:00.000Z",
    shippedAt:"2026-09-01T10:00:00.000Z",
    context:{
      label:"Choghadiya",
      topQuery:"choghadiya today mumbai",
      city:"Mumbai",
      recommendedPath:"/tools/choghadiya/mumbai",
      template:"City Choghadiya tool"
    },
    history:[],
    ...overrides
  };
}

function comparison(overrides:{pre?:Partial<GscOutcomeComparison["pre"]>;post?:Partial<GscOutcomeComparison["post"]>}={}):GscOutcomeComparison{
  return {
    query:"choghadiya today mumbai",
    pre:{startDate:"2026-08-04",endDate:"2026-08-31",clicks:10,impressions:500,ctr:.02,position:14,topLanding:"https://panchvani.com/panchang/mumbai/2026-08-20",...overrides.pre},
    post:{startDate:"2026-09-01",endDate:"2026-09-28",clicks:30,impressions:900,ctr:.033333,position:7,topLanding:"https://panchvani.com/tools/choghadiya/mumbai",...overrides.post}
  };
}

describe("SEO Outcome Intelligence",()=>{
  it("uses equal pre/post windows and waits for final GSC data",()=>{
    expect(gscCheckpointWindow("2026-09-01T10:00:00.000Z",14)).toEqual({
      preStart:"2026-08-18",preEnd:"2026-08-31",postStart:"2026-09-01",postEnd:"2026-09-14"
    });
    expect(checkpointReadyAt("2026-09-01T10:00:00.000Z",14)).toBe("2026-09-16");
    expect(isGscCheckpointReady("2026-09-01T10:00:00.000Z",14,new Date("2026-09-15T12:00:00Z"))).toBe(false);
    expect(isGscCheckpointReady("2026-09-01T10:00:00.000Z",14,new Date("2026-09-16T12:00:00Z"))).toBe(true);
    expect(dueOutcomeCheckpoints(record(),new Date("2026-09-16T12:00:00Z"))).toEqual([14]);
  });

  it("recognizes exact and descendant recommended landing paths",()=>{
    expect(landingMatchesRecommendation("https://panchvani.com/tools/choghadiya/mumbai","/tools/choghadiya/mumbai")).toBe(true);
    expect(landingMatchesRecommendation("https://panchvani.com/tools/choghadiya/mumbai/today","/tools/choghadiya/mumbai")).toBe(true);
    expect(landingMatchesRecommendation("https://panchvani.com/panchang/mumbai","/tools/choghadiya/mumbai")).toBe(false);
    expect(landingMatchesRecommendation("https://panchvani.com/anything","/")).toBe(false);
  });

  it("does not recommend WON at 14 days even when the signal is strong",()=>{
    const result=evaluateOutcomeCheckpoint(record(),comparison(),14,"2026-09-16T12:00:00.000Z");
    expect(result.signal).toBe("WINNING");
    expect(result.landingAligned).toBe(true);
    expect(result.recommendation).toBe("KEEP_MEASURING");
    expect(result.positionImprovement).toBe(7);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it("recommends WON from 28 days when the target landing owns a strong gain",()=>{
    const result=evaluateOutcomeCheckpoint(record(),comparison(),28,"2026-10-01T12:00:00.000Z");
    expect(result.signal).toBe("WINNING");
    expect(result.recommendation).toBe("WON");
    expect(result.clicksChangePct).toBe(200);
    expect(result.impressionsChangePct).toBe(80);
  });

  it("forces ITERATE when Google still ranks the wrong landing",()=>{
    const result=evaluateOutcomeCheckpoint(record(),comparison({post:{topLanding:"https://panchvani.com/panchang/mumbai/2026-09-20"}}),28);
    expect(result.landingAligned).toBe(false);
    expect(result.recommendation).toBe("ITERATE");
    expect(result.reason).toMatch(/not the recommended target/i);
  });

  it("flags a material post-launch regression",()=>{
    const bad=comparison({
      pre:{clicks:40,impressions:1000,ctr:.04,position:6,topLanding:"https://panchvani.com/tools/choghadiya/mumbai"},
      post:{clicks:10,impressions:500,ctr:.02,position:13,topLanding:"https://panchvani.com/tools/choghadiya/mumbai"}
    });
    const result=evaluateOutcomeCheckpoint(record(),bad,28);
    expect(result.signal).toBe("DOWN");
    expect(result.recommendation).toBe("REGRESSED");
    expect(result.positionImprovement).toBe(-7);
  });

  it("never overwrites a stored checkpoint and advances to the next horizon",()=>{
    const first=evaluateOutcomeCheckpoint(record(),comparison(),14,"2026-09-16T12:00:00.000Z");
    const withFirst=appendOutcomeCheckpoint(record(),first);
    const duplicate=evaluateOutcomeCheckpoint(record(),comparison({post:{clicks:99}}),14,"2026-09-17T12:00:00.000Z");
    const preserved=appendOutcomeCheckpoint(withFirst,duplicate);
    expect(preserved.outcomes).toHaveLength(1);
    expect(preserved.outcomes?.[0].post.clicks).toBe(30);
    expect(latestOutcomeCheckpoint(preserved)?.days).toBe(14);
    expect(nextOutcomeCheckpoint(preserved,new Date("2026-09-17T12:00:00Z"))?.days).toBe(28);
  });
});
