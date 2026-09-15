import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("Muhurat build-time Panchang reuse",()=>{
  const source=readFileSync("lib/muhurat.ts","utf8");

  it("keeps a small bounded month cache instead of external runtime storage",()=>{
    expect(source).toContain("createBoundedPromiseCache");
    expect(source).toContain("MUHURAT_PANCHANG_MONTH_CACHE_MAX_ENTRIES=24");
    expect(source).toContain("muhuratPanchangMonthCacheKey");
    expect(source).not.toContain("KVNamespace");
    expect(source).not.toContain("caches.default");
  });

  it("reuses event-independent month Panchang data before event filtering",()=>{
    const monthly=source.slice(source.indexOf("export async function getMonthlyMuhurat"));
    expect(monthly).toContain("await getMuhuratPanchangMonth(year,month,city)");
    expect(monthly).not.toContain("await getPanchang(");
  });

  it("preserves sequential Swiss Ephemeris calculation inside a cache miss",()=>{
    const start=source.indexOf("async function buildMuhuratPanchangMonth");
    const end=source.indexOf("export function getMuhuratPanchangMonth",start);
    const builder=source.slice(start,end);
    expect(builder).toContain("for(let d=1;d<=days;d++)");
    expect(builder).toContain("rows.push(await getPanchang(date,city))");
    expect(builder).not.toContain("Promise.all");
  });
});
