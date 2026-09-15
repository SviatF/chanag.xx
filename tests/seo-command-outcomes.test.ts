import {describe,expect,it} from "vitest";
import type {SeoCommandTask} from "../lib/seo-task-store";
import {reconcileSeoTaskOutcomes} from "../lib/seo-task-outcomes";

function task(overrides:Partial<SeoCommandTask>={}):SeoCommandTask{
  return {
    id:"seo:https://panchvani.com/test::test query",
    url:"https://panchvani.com/test",
    query:"test query",
    actionType:"DO_NOW",
    recommendation:"Add a supporting section",
    status:"observation",
    baseline:{impressions:100,clicks:5,ctr:.05,position:15},
    completedAt:"2026-09-01T00:00:00.000Z",
    verifyAt:"2026-09-11T00:00:00.000Z",
    result:null,
    reviewerNote:"",
    commitSha:"abc1234",
    updatedAt:"2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("SEO command automatic outcomes",()=>{
  it("measures a due task and persists a positive automatic verdict",()=>{
    const initial=task();
    const metrics=new Map([[initial.url,{impressions:160,clicks:8,ctr:.05,position:10}]]);
    const reconciled=reconcileSeoTaskOutcomes({[initial.id]:initial},metrics,"2026-09-12T00:00:00.000Z","2026-09-12T00:00:00.000Z");
    const measured=reconciled.tasks[initial.id];
    expect(reconciled.changed).toBe(true);
    expect(measured.status).toBe("review_ready");
    expect(measured.result).toBe("positive");
    expect(measured.outcome?.score).toBeGreaterThan(50);
    expect(measured.outcome?.positionImprovement).toBe(5);
    expect(measured.measurementSnapshotAt).toBe("2026-09-12T00:00:00.000Z");
  });

  it("is idempotent inside the same GSC snapshot",()=>{
    const initial=task();
    const metrics=new Map([[initial.url,{impressions:160,clicks:8,ctr:.05,position:10}]]);
    const first=reconcileSeoTaskOutcomes({[initial.id]:initial},metrics,"2026-09-12T00:00:00.000Z","2026-09-12T00:00:00.000Z");
    const second=reconcileSeoTaskOutcomes(first.tasks,metrics,"2026-09-12T01:00:00.000Z","2026-09-12T00:00:00.000Z");
    expect(second.changed).toBe(false);
    expect(second.tasks).toBe(first.tasks);
  });

  it("retries low-data verdicts on a later daily snapshot",()=>{
    const initial=task();
    const low=new Map([[initial.url,{impressions:2,clicks:0,ctr:0,position:40}]]);
    const first=reconcileSeoTaskOutcomes({[initial.id]:initial},low,"2026-09-12T00:00:00.000Z","2026-09-12T00:00:00.000Z");
    expect(first.tasks[initial.id].result).toBe("low_data");

    const mature=new Map([[initial.url,{impressions:150,clicks:7,ctr:.047,position:11}]]);
    const second=reconcileSeoTaskOutcomes(first.tasks,mature,"2026-09-13T00:00:00.000Z","2026-09-13T00:00:00.000Z");
    expect(second.changed).toBe(true);
    expect(second.tasks[initial.id].result).toBe("positive");
    expect(second.tasks[initial.id].measurementSnapshotAt).toBe("2026-09-13T00:00:00.000Z");
  });

  it("freezes a mature verdict instead of rewriting history on later snapshots",()=>{
    const initial=task();
    const positive=new Map([[initial.url,{impressions:160,clicks:8,ctr:.05,position:10}]]);
    const first=reconcileSeoTaskOutcomes({[initial.id]:initial},positive,"2026-09-12T00:00:00.000Z","2026-09-12T00:00:00.000Z");
    const negative=new Map([[initial.url,{impressions:40,clicks:1,ctr:.025,position:25}]]);
    const second=reconcileSeoTaskOutcomes(first.tasks,negative,"2026-09-20T00:00:00.000Z","2026-09-20T00:00:00.000Z");
    expect(second.changed).toBe(false);
    expect(second.tasks[initial.id].result).toBe("positive");
    expect(second.tasks[initial.id].measurementSnapshotAt).toBe("2026-09-12T00:00:00.000Z");
  });
});
