import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("production Worker routing identity",()=>{
  it("keeps Cloudflare Workers Builds service and Wrangler target aligned",()=>{
    const config=JSON.parse(readFileSync("wrangler.jsonc","utf8"));
    expect(config.name).toBe("chanag-xx");
    expect(config.version_metadata.binding).toBe("CF_VERSION_METADATA");
    expect(config.main).toBe("worker/index.ts");
  });
  it("keeps the audit pinned to the public domain and known regression pages",()=>{
    const script=readFileSync("scripts/seo-live-response-audit.mjs","utf8");
    expect(script).toContain('https://panchvani.com');
    expect(script).toContain("stale Moonrise chronology");
    expect(script).toContain("stale Muhurat zero-point lead");
    expect(script).toContain("x-panchvani-worker-version");
  });
});
