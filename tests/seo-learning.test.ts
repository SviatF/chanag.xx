import {describe,expect,it} from "vitest";
import type {OpportunityLifecycleRecord,OpportunityOutcomeCheckpoint,OpportunityImplementationEvidence} from "../lib/opportunity-lifecycle";
import type {SearchOpportunity} from "../lib/search-opportunities";
import {buildSeoLearningLibrary,prioritizeOpportunityWithLearning} from "../lib/seo-learning";

function outcome(implementationId:string,days:14|28|56,recommendation:"WON"|"KEEP_MEASURING"|"ITERATE"|"REGRESSED",score:number):OpportunityOutcomeCheckpoint{
  return {
    days,evaluatedAt:`2026-11-${String(Math.min(days,28)).padStart(2,"0")}T00:00:00.000Z`,implementationId,
    pre:{startDate:"2026-09-01",endDate:"2026-09-28",clicks:10,impressions:200,ctr:.05,position:12,topLanding:"https://panchvani.com/panchang/mumbai"},
    post:{startDate:"2026-09-29",endDate:"2026-10-26",clicks:18,impressions:320,ctr:.056,position:7,topLanding:"https://panchvani.com/tools/choghadiya/mumbai"},
    landingAligned:true,clicksChangePct:80,impressionsChangePct:60,ctrDeltaPoints:.6,positionImprovement:5,score,
    signal:recommendation==="WON"?"WINNING":recommendation==="REGRESSED"?"DOWN":"MIXED",recommendation,reason:"test"
  };
}

function implementation(id:string,hypothesis="Align the wrong landing and reinforce internal links"):OpportunityImplementationEvidence{
  return {id,hypothesis,commitSha:"abcdef1",prUrl:null,changedFiles:["lib/topical-links.ts"],deployedUrl:"https://panchvani.com/tools/choghadiya/mumbai",versionLabel:id,note:"",createdAt:"2026-09-29T00:00:00.000Z",updatedAt:"2026-09-29T00:00:00.000Z",shippedAt:"2026-09-29T00:00:00.000Z"};
}

function record(id:string,recommendation:"WON"|"KEEP_MEASURING"|"ITERATE"|"REGRESSED"="WON",score=80):OpportunityLifecycleRecord{
  return {
    key:`opp:${id}`,stage:"MEASURING",owner:"",note:"",createdAt:"2026-09-01T00:00:00.000Z",updatedAt:"2026-10-30T00:00:00.000Z",shippedAt:"2026-09-29T00:00:00.000Z",
    context:{label:"Choghadiya",topQuery:"choghadiya today mumbai",city:"Mumbai",recommendedPath:"/tools/choghadiya/mumbai",template:"City Choghadiya tool",intent:"tool:choghadiya",status:"WRONG_LANDING",action:"ALIGN"},
    implementations:[implementation(id)],activeImplementationId:id,shippedImplementationId:id,
    outcomes:[outcome(id,14,"KEEP_MEASURING",65),outcome(id,28,recommendation,score)],history:[]
  };
}

function opportunity():SearchOpportunity{
  return {key:"tool:choghadiya:delhi",intent:"tool:choghadiya",label:"Choghadiya",topQuery:"choghadiya delhi",queryCount:5,city:"Delhi",clicks:4,impressions:420,ctr:.01,position:9,currentLanding:"https://panchvani.com/panchang/delhi",recommendedPath:"/tools/choghadiya/delhi",template:"City Choghadiya tool",status:"WRONG_LANDING",action:"ALIGN",score:78,reason:"wrong landing"};
}

describe("SEO Learning System",()=>{
  it("counts one latest checkpoint per attributed implementation",()=>{
    const library=buildSeoLearningLibrary({a:record("impl-a")});
    const landing=library.patterns.find(item=>item.pattern==="LANDING_ALIGNMENT");
    expect(library.attributedImplementations).toBe(1);
    expect(library.measuredImplementations).toBe(1);
    expect(landing?.samples).toBe(1);
    expect(landing?.avgCheckpointDays).toBe(28);
  });

  it("detects internal-link reinforcement as a secondary implementation pattern",()=>{
    const library=buildSeoLearningLibrary({a:record("impl-a")});
    expect(library.patterns.some(item=>item.pattern==="INTERNAL_LINK_REINFORCEMENT")).toBe(true);
  });

  it("does not change opportunity priority before at least three mature samples",()=>{
    const library=buildSeoLearningLibrary({a:record("impl-a"),b:record("impl-b")});
    const learned=prioritizeOpportunityWithLearning(opportunity(),library);
    expect(learned.signal).toBe("INSUFFICIENT");
    expect(learned.delta).toBe(0);
    expect(learned.adjustedScore).toBe(78);
  });

  it("boosts a historically proven pattern without overpowering raw GSC score",()=>{
    const library=buildSeoLearningLibrary({a:record("impl-a"),b:record("impl-b"),c:record("impl-c")});
    const learned=prioritizeOpportunityWithLearning(opportunity(),library);
    expect(["PROVEN","PROMISING"]).toContain(learned.signal);
    expect(learned.delta).toBeGreaterThan(0);
    expect(learned.delta).toBeLessThanOrEqual(10);
    expect(learned.adjustedScore).toBe(78+learned.delta);
  });

  it("penalizes a repeatedly negative pattern conservatively",()=>{
    const library=buildSeoLearningLibrary({a:record("impl-a","REGRESSED",20),b:record("impl-b","REGRESSED",25),c:record("impl-c","REGRESSED",30)});
    const learned=prioritizeOpportunityWithLearning(opportunity(),library);
    expect(learned.signal).toBe("NEGATIVE");
    expect(learned.delta).toBeLessThan(0);
    expect(learned.delta).toBeGreaterThanOrEqual(-8);
  });

  it("ignores unattributed outcomes instead of learning from ambiguous launches",()=>{
    const row=record("impl-a");
    row.outcomes=row.outcomes?.map(item=>({...item,implementationId:undefined}));
    const library=buildSeoLearningLibrary({a:row});
    expect(library.attributedImplementations).toBe(1);
    expect(library.measuredImplementations).toBe(0);
    expect(library.patterns).toHaveLength(0);
  });
});
