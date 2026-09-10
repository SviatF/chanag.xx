import {describe,expect,it} from "vitest";
import type {OpportunityLifecycleRecord,OpportunityOutcomeCheckpoint} from "../lib/opportunity-lifecycle";
import type {SearchOpportunity} from "../lib/search-opportunities";
import {buildAutopilotFlags,SEO_AUTOPILOT_MAX_NEW_PER_RUN,selectAutopilotCandidates} from "../lib/seo-autopilot";

function opportunity(index:number,overrides:Partial<SearchOpportunity>={}):SearchOpportunity{
  return {
    key:`tool:test:${index}`,
    intent:"tool:test",
    label:`Test ${index}`,
    topQuery:`test query ${index}`,
    queryCount:1,
    city:"Mumbai",
    clicks:2,
    impressions:100,
    ctr:.02,
    position:12,
    currentLanding:"https://panchvani.com/old",
    recommendedPath:`/tools/test-${index}`,
    template:"Test template",
    status:"WRONG_LANDING",
    action:"ALIGN",
    score:70,
    reason:"Test",
    ...overrides,
  };
}

function outcome(days:14|28|56,recommendation:OpportunityOutcomeCheckpoint["recommendation"],score:number):OpportunityOutcomeCheckpoint{
  return {
    days,
    evaluatedAt:"2026-10-01T00:00:00.000Z",
    pre:{startDate:"2026-09-01",endDate:"2026-09-14",clicks:5,impressions:100,ctr:.05,position:14,topLanding:"https://panchvani.com/old"},
    post:{startDate:"2026-09-15",endDate:"2026-09-28",clicks:12,impressions:180,ctr:.066,position:8,topLanding:"https://panchvani.com/tools/test"},
    landingAligned:true,
    clicksChangePct:140,
    impressionsChangePct:80,
    ctrDeltaPoints:1.6,
    positionImprovement:6,
    score,
    signal:recommendation==="REGRESSED"?"DOWN":recommendation==="WON"?"WINNING":"MIXED",
    recommendation,
    reason:`${recommendation} reason`,
  };
}

function record(key:string,outcomes:OpportunityOutcomeCheckpoint[]=[]):OpportunityLifecycleRecord{
  return {
    key,
    stage:"MEASURING",
    owner:"",
    note:"",
    createdAt:"2026-09-01T00:00:00.000Z",
    updatedAt:"2026-09-15T00:00:00.000Z",
    shippedAt:"2026-09-15T00:00:00.000Z",
    context:{label:key,topQuery:"test query",city:"Mumbai",recommendedPath:"/tools/test",template:"Test"},
    outcomes,
    history:[],
  };
}

describe("SEO Autopilot guardrails",()=>{
  it("persists only actionable, sufficiently strong, untracked opportunities",()=>{
    const existing=opportunity(1);
    const candidates=selectAutopilotCandidates([
      existing,
      opportunity(2,{score:54}),
      opportunity(3,{impressions:4}),
      opportunity(4,{status:"COVERED",action:"MONITOR"}),
      opportunity(5,{score:91,impressions:600}),
      opportunity(6,{score:80,impressions:300}),
    ],{[existing.key]:record(existing.key)});

    expect(candidates.map(item=>item.key)).toEqual(["tool:test:5","tool:test:6"]);
  });

  it("caps new persisted detections per run",()=>{
    const candidates=selectAutopilotCandidates(Array.from({length:60},(_,index)=>opportunity(index,{score:90,impressions:1000-index})),{});
    expect(candidates).toHaveLength(SEO_AUTOPILOT_MAX_NEW_PER_RUN);
  });

  it("uses only the latest stored checkpoint for actionable flags and prioritizes regressions",()=>{
    const records={
      won:record("won",[outcome(14,"KEEP_MEASURING",65),outcome(28,"WON",82)]),
      regressed:record("regressed",[outcome(28,"REGRESSED",22)]),
      iterate:record("iterate",[outcome(56,"ITERATE",48)]),
      measuring:record("measuring",[outcome(14,"KEEP_MEASURING",62)]),
    };
    const flags=buildAutopilotFlags(records);

    expect(flags.map(item=>item.recommendation)).toEqual(["REGRESSED","ITERATE","WON"]);
    expect(flags.find(item=>item.key==="won")?.checkpointDays).toBe(28);
    expect(flags.some(item=>item.key==="measuring")).toBe(false);
  });
});
