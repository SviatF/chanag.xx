import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("SEO closed-loop architecture",()=>{
  it("reconciles due outcomes from the persisted daily GSC snapshot",()=>{
    const route=readFileSync("app/api/admin/seo-data/route.ts","utf8");
    expect(route).toContain("reconcileSeoTaskOutcomes");
    expect(route).toContain("gsc.dataset.generatedAt");
    expect(route).toContain("writeSeoTaskMap(reconciled.tasks)");
    expect(route).toContain("buildSeoCommandLearningLibrary(reconciled.tasks)");
  });

  it("keeps historical learning bounded and separate from action selection",()=>{
    const learning=readFileSync("lib/seo-command-learning.ts","utf8");
    expect(learning).toContain('stats.samples<3');
    expect(learning).toContain('stats.signal==="PROVEN"?8');
    expect(learning).toContain('stats.signal==="NEGATIVE"?-7');
    expect(learning).toContain('commandLearningPatternForPage');
  });

  it("closes cycles from a persisted verdict and preserves measurement evidence on restore",()=>{
    const route=readFileSync("app/api/admin/seo-tasks/route.ts","utf8");
    expect(route).toContain("result(body.result)??current.result");
    expect(route).toContain("A measured verdict is required before closing the SEO cycle.");
    expect(route).not.toContain('status:new Date(current.verifyAt).getTime()<=now.getTime()?"review_ready":"observation",result:null');
  });

  it("surfaces automatic verdict and pattern learning in the command center",()=>{
    const client=readFileSync("components/SeoCommandCenterClient.tsx","utf8");
    expect(client).toContain("Pattern learning");
    expect(client).toContain("Observation & automatic verdict");
    expect(client).toContain("prioritizePageWithCommandLearning");
    expect(client).toContain("next GSC snapshot");
  });
});
