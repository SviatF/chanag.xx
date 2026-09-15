import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {normalizeSeoRevalidationPath} from "../lib/seo-revalidation";

describe("SEO page revalidation",()=>{
  it("normalizes same-site absolute URLs and relative public paths",()=>{
    expect(normalizeSeoRevalidationPath("https://panchvani.com/muhurat/wedding/2026/?utm_source=admin#top")).toBe("/muhurat/wedding/2026");
    expect(normalizeSeoRevalidationPath("/festivals/dussehra/2026/hyderabad/?preview=1")).toBe("/festivals/dussehra/2026/hyderabad");
    expect(normalizeSeoRevalidationPath("/")).toBe("/");
  });

  it("rejects external, protocol-relative and internal framework targets",()=>{
    expect(()=>normalizeSeoRevalidationPath("https://example.com/muhurat/wedding/2026")).toThrow(/Only https:\/\/panchvani\.com/);
    expect(()=>normalizeSeoRevalidationPath("//panchvani.com/muhurat/wedding/2026")).toThrow(/Protocol-relative/);
    expect(()=>normalizeSeoRevalidationPath("/admin/growth")).toThrow(/cannot be revalidated/);
    expect(()=>normalizeSeoRevalidationPath("/%61dmin/growth")).toThrow(/cannot be revalidated/);
    expect(()=>normalizeSeoRevalidationPath("/api/admin/revalidate")).toThrow(/cannot be revalidated/);
    expect(()=>normalizeSeoRevalidationPath("/_next/static/app.js")).toThrow(/cannot be revalidated/);
    expect(()=>normalizeSeoRevalidationPath("/sitemap-muhurat.xml")).toThrow(/cannot be revalidated/);
    expect(()=>normalizeSeoRevalidationPath("/robots.txt")).toThrow(/cannot be revalidated/);
  });

  it("keeps the endpoint admin-protected and uses Next framework revalidation only",()=>{
    const route=readFileSync("app/api/admin/revalidate/route.ts","utf8");
    const wrangler=readFileSync("wrangler.jsonc","utf8");
    expect(route).toContain('import {revalidatePath} from "next/cache"');
    expect(route).toContain("isAdminAuthenticated");
    expect(route).toContain("normalizeSeoRevalidationPath(body.url)");
    expect(route).toContain("revalidatePath(path)");
    expect(route).not.toContain("caches.default");
    expect(route).not.toContain("KV");
    expect(wrangler).toContain('"run_worker_first": ["/api/*"]');
  });

  it("revalidates before starting the existing ten-day observation workflow",()=>{
    const client=readFileSync("components/SeoCommandCenterClient.tsx","utf8");
    const taskRoute=readFileSync("app/api/admin/seo-tasks/route.ts","utf8");
    const store=readFileSync("lib/seo-task-store.ts","utf8");
    const revalidateCall=client.indexOf('fetch("/api/admin/revalidate"');
    const observeCall=client.indexOf('await postTask({action:"observe"');
    expect(revalidateCall).toBeGreaterThan(0);
    expect(observeCall).toBeGreaterThan(revalidateCall);
    expect(client).toContain("Revalidate page → 10 днів observation");
    expect(client).toContain("revalidatedAt:revalidation.revalidatedAt");
    expect(client).toContain("revalidatedPath:revalidation.path");
    expect(taskRoute).toContain("Revalidation timestamp is invalid or stale.");
    expect(taskRoute).toContain("Revalidated path does not match the observation URL.");
    expect(store).toContain("revalidatedAt?:string");
    expect(store).toContain("revalidatedPath?:string");
  });
});
