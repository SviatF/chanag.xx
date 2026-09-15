import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("SEO observation KV wiring",()=>{
  it("reuses the native GSC KV binding for SEO tasks",()=>{
    const bindings=readFileSync("lib/cloudflare-bindings.ts","utf8");
    expect(bindings).toContain("setSeoTaskKvBinding");
    expect(bindings).toContain("cfEnv.SEO_OPPORTUNITY_KV??cfEnv.GSC_SNAPSHOT_KV??cfEnv.GOLD_RATE_KV");
  });

  it("initializes Cloudflare bindings before checking task storage",()=>{
    const route=readFileSync("app/api/admin/seo-tasks/route.ts","utf8");
    expect(route).toContain("await bindGscStoreFromCloudflareEnv();\n  const storage=getSeoTaskStoreStatus();");
  });

  it("supports native task-store reads and writes",()=>{
    const store=readFileSync("lib/seo-task-store.ts","utf8");
    expect(store).toContain("__PANCHVANI_SEO_TASK_KV__");
    expect(store).toContain("await binding.put(STORAGE_KEY,JSON.stringify(map))");
    expect(store).toContain("process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID??process.env.GSC_SNAPSHOT_KV_NAMESPACE_ID");
  });
});
