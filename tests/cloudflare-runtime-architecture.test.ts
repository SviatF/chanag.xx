import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {SEO_CLIENT_TTL_MS} from "../lib/admin-seo-data-client";
import {GSC_COMMAND_CENTER_QUERY_BUDGET} from "../lib/gsc-seo-os";
import {ADMIN_PROVIDER_TTL_MS,ADMIN_RUNTIME_LIMITS,cachedCoalesced,clearRuntimeCacheForTests} from "../lib/worker-data-cache";

describe("Cloudflare SEO/Admin runtime architecture",()=>{
  it("keeps the requested cache and request budgets explicit",()=>{
    expect(SEO_CLIENT_TTL_MS).toBe(5*60*1000);
    expect(ADMIN_PROVIDER_TTL_MS).toEqual({gsc:15*60*1000,ga4:5*60*1000,bing:15*60*1000,cloudflare:60*1000});
    expect(GSC_COMMAND_CENTER_QUERY_BUDGET).toBe(2);
    expect(ADMIN_RUNTIME_LIMITS).toEqual({cpuMs:100,subrequests:30});
  });

  it("coalesces identical in-flight provider loads",async()=>{
    clearRuntimeCacheForTests();
    let calls=0;
    let release!:()=>void;
    const gate=new Promise<void>(resolve=>{release=resolve;});
    const loader=async()=>{calls++;await gate;return {ok:true};};
    const first=cachedCoalesced("test:coalescing",1000,loader,{force:true});
    const second=cachedCoalesced("test:coalescing",1000,loader,{force:true});
    await Promise.resolve();
    expect(calls).toBe(1);
    release();
    const [a,b]=await Promise.all([first,second]);
    expect(a.value).toEqual({ok:true});
    expect(b.value).toEqual({ok:true});
    expect([a.cacheStatus,b.cacheStatus].sort()).toEqual(["COALESCED","MISS"]);
  });

  it("forbids admin polling/remount loops and keeps static assets asset-first",()=>{
    const files=[
      "components/SeoCommandCenterClient.tsx",
      "components/SeoQueriesClient.tsx",
      "lib/admin-seo-data-client.ts",
    ];
    const source=files.map(file=>readFileSync(file,"utf8")).join("\n");
    expect(source).not.toContain("setInterval(");
    expect(source).not.toContain("MutationObserver");
    const wrangler=readFileSync("wrangler.jsonc","utf8");
    expect(wrangler).toContain('"run_worker_first": ["/api/*"]');
    expect(wrangler).toContain('"cpu_ms": 100');
    expect(wrangler).toContain('"subrequests": 30');
  });

  it("exposes endpoint cache and cost telemetry headers",()=>{
    const route=readFileSync("app/api/admin/seo-data/route.ts","utf8");
    for(const header of ["x-cache","x-api-calls","x-upstream-subrequests","x-endpoint-latency-ms","server-timing"])expect(route).toContain(header);
  });
});
