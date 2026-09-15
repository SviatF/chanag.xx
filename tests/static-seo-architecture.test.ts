import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {festivals2026} from "../lib/festivals";
import {phase1PriorityCities} from "../lib/seo-policy";
import {festivalCitySsgPilot,festivalCitySsgPriority,festivalCityStaticKey} from "../lib/static-seo-routes";

describe("SSG/ISR SEO architecture",()=>{
  it("pre-renders the 2026 priority matrix and keeps it duplicate-free",()=>{
    const expectedCount=phase1PriorityCities.length*festivals2026.length;
    expect(phase1PriorityCities.length).toBe(20);
    expect(festivals2026.length).toBe(19);
    expect(expectedCount).toBe(380);
    expect(festivalCitySsgPriority.length).toBe(expectedCount);
    expect(festivalCitySsgPilot).toBe(festivalCitySsgPriority);

    const keys=festivalCitySsgPriority.map(festivalCityStaticKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("ganesh-chaturthi/2026/ahmedabad");
    expect(keys).toContain("dussehra/2026/hyderabad");

    for(const city of phase1PriorityCities){
      expect(festivalCitySsgPriority.filter(item=>item.city===city)).toHaveLength(festivals2026.length);
    }
    for(const festival of festivals2026){
      expect(festivalCitySsgPriority.filter(item=>item.festival===festival.slug)).toHaveLength(phase1PriorityCities.length);
    }
  });

  it("pre-renders priority festival pages while preserving ISR fallback",()=>{
    const source=readFileSync("app/festivals/[festival]/[year]/[city]/page.tsx","utf8");
    expect(source).toContain("generateStaticParams");
    expect(source).toContain("festivalCitySsgPilot");
    expect(source).toContain("export const dynamicParams=true");
    expect(source).toContain("export const revalidate=86400");
    expect(source).not.toContain('dynamic=\"force-dynamic\"');
  });

  it("keeps daily Panchang on hourly ISR rather than freezing current-day content at build time",()=>{
    const source=readFileSync("app/panchang/[city]/[[...date]]/page.tsx","utf8");
    expect(source).toContain("export const revalidate=3600");
    expect(source).not.toContain("generateStaticParams");
  });

  it("keeps static assets asset-first and the Worker API-first",()=>{
    const wrangler=readFileSync("wrangler.jsonc","utf8");
    expect(wrangler).toContain('\"run_worker_first\": [\"/api/*\"]');
  });
});
