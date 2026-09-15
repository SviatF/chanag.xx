import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {festivalCitySsgPilot,festivalCityStaticKey} from "../lib/static-seo-routes";

describe("SSG/ISR SEO architecture",()=>{
  it("keeps the first rollout intentionally bounded and duplicate-free",()=>{
    expect(festivalCitySsgPilot.length).toBe(20);
    const keys=festivalCitySsgPilot.map(festivalCityStaticKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("ganesh-chaturthi/2026/ahmedabad");
    expect(keys).toContain("dussehra/2026/hyderabad");
  });

  it("pre-renders pilot festival pages while preserving ISR fallback",()=>{
    const source=readFileSync("app/festivals/[festival]/[year]/[city]/page.tsx","utf8");
    expect(source).toContain("generateStaticParams");
    expect(source).toContain("festivalCitySsgPilot");
    expect(source).toContain("export const dynamicParams=true");
    expect(source).toContain("export const revalidate=86400");
    expect(source).not.toContain('dynamic="force-dynamic"');
  });

  it("keeps daily Panchang on hourly ISR rather than freezing current-day content at build time",()=>{
    const source=readFileSync("app/panchang/[city]/[[...date]]/page.tsx","utf8");
    expect(source).toContain("export const revalidate=3600");
    expect(source).not.toContain("generateStaticParams");
  });

  it("keeps static assets asset-first and the Worker API-first",()=>{
    const wrangler=readFileSync("wrangler.jsonc","utf8");
    expect(wrangler).toContain('"run_worker_first": ["/api/*"]');
  });
});
