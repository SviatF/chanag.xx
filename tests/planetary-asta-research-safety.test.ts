import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("Wave 3H Asta experiment is never silently used as a production ritual exclusion",()=>{
  it("keeps the benchmark separated from the Muhurat rules and all runtime source",()=>{
    const research=readFileSync("scripts/planetary-asta-research.ts","utf8");
    const runtime=readFileSync("lib/muhurat.ts","utf8");
    const closures=readFileSync("lib/verified-muhurat-closures.ts","utf8");
    expect(research).toContain("safeForCeremonyFiltering:false");
    expect(research).toContain("methodMatchesPublisher:false");
    expect(research).toContain("significantDisagreement");
    expect(runtime).not.toContain("planetary-asta-research");
    expect(closures).not.toContain("planetary-asta-research");
    expect(closures).not.toContain("SEFLG_EQUATORIAL");
  });
  it("does not accidentally schedule research to mutate production or write repository contents",()=>{
    const workflow=readFileSync(".github/workflows/planetary-asta-research.yml","utf8");
    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toContain("FREQ=");
    expect(workflow).not.toContain("wrangler deploy");
    expect(workflow).not.toContain("contents: write");
  });
});
