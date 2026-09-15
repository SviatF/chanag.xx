import {describe,expect,it} from "vitest";
import type {PageOpportunity} from "../lib/seo-operating-system";
import type {SeoCommandTask,SeoTaskResult} from "../lib/seo-task-store";
import {buildSeoCommandLearningLibrary,commandPatternsForTask,prioritizePageWithCommandLearning} from "../lib/seo-command-learning";

function task(id:string,result:SeoTaskResult="positive",score=82,note="Added a supporting section and contextual internal links"):SeoCommandTask{
  return {
    id,url:`https://panchvani.com/test/${id}`,query:`query ${id}`,actionType:"DO_NOW",
    recommendation:"Add exact supporting content and contextual internal links",
    status:"review_ready",baseline:{impressions:100,clicks:5,ctr:.05,position:15},
    completedAt:"2026-09-01T00:00:00.000Z",verifyAt:"2026-09-11T00:00:00.000Z",result,
    reviewerNote:note,commitSha:"abc1234",measuredAt:"2026-09-11T12:00:00.000Z",
    measurementSnapshotAt:"2026-09-11T00:00:00.000Z",
    outcome:{measuredAt:"2026-09-11T12:00:00.000Z",measurementSnapshotAt:"2026-09-11T00:00:00.000Z",metric:{impressions:150,clicks:8,ctr:.053,position:10},impressionsChangePct:50,clicksChangePct:60,ctrDeltaPoints:.3,positionImprovement:5,score},
    updatedAt:"2026-09-11T12:00:00.000Z"
  };
}

function page(score=76):PageOpportunity{
  return {
    url:"https://panchvani.com/test/new",queryCount:4,impressions:400,clicks:10,ctr:.025,position:12,
    top3:0,top10:1,top20:4,top50:4,topQuery:"new query",
    current7:{impressions:120,clicks:4,ctr:.033,position:11},previous7:{impressions:90,clicks:2,ctr:.022,position:14},trendPct:33,
    cannibalizationRisk:"NONE",score,priority:"P1",action:"DO_NOW",why:"quick win",
    concreteAction:"Add a supporting section",internalLinkCandidates:[],task:null
  };
}

describe("SEO Command Center closed-loop learning",()=>{
  it("attributes content and internal-link patterns from implementation evidence",()=>{
    const patterns=commandPatternsForTask(task("a"));
    expect(patterns).toContain("CONTENT_STRENGTHENING");
    expect(patterns).toContain("INTERNAL_LINK_REINFORCEMENT");
  });

  it("does not change priority before three mature measured cycles",()=>{
    const library=buildSeoCommandLearningLibrary({a:task("a"),b:task("b")});
    const learned=prioritizePageWithCommandLearning(page(),library);
    expect(learned.signal).toBe("INSUFFICIENT");
    expect(learned.delta).toBe(0);
    expect(learned.adjustedScore).toBe(76);
  });

  it("boosts a repeatedly positive pattern but caps historical influence",()=>{
    const library=buildSeoCommandLearningLibrary({a:task("a"),b:task("b"),c:task("c")});
    const learned=prioritizePageWithCommandLearning(page(),library);
    expect(["PROVEN","PROMISING"]).toContain(learned.signal);
    expect(learned.delta).toBeGreaterThan(0);
    expect(learned.delta).toBeLessThanOrEqual(8);
    expect(learned.adjustedScore).toBe(76+learned.delta);
  });

  it("penalizes a repeatedly negative pattern conservatively",()=>{
    const library=buildSeoCommandLearningLibrary({a:task("a","negative",22),b:task("b","negative",28),c:task("c","negative",30)});
    const learned=prioritizePageWithCommandLearning(page(),library);
    expect(learned.signal).toBe("NEGATIVE");
    expect(learned.delta).toBeLessThan(0);
    expect(learned.delta).toBeGreaterThanOrEqual(-7);
  });

  it("never learns from low-data cycles",()=>{
    const library=buildSeoCommandLearningLibrary({a:task("a","low_data",0)});
    expect(library.measuredTasks).toBe(0);
    expect(library.samples).toHaveLength(0);
    expect(library.patterns).toHaveLength(0);
  });
});
