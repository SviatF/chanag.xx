import {readFileSync} from "node:fs";
import {afterEach,describe,expect,it} from "vitest";
import approvals from "../config/gold-rate-city-approvals.json";
import {goldRateCandidateCitySlugs} from "../lib/gold-rate";
import {getGoldRateIndexingReadiness} from "../lib/gold-rate-readiness";

const previous={...process.env};
afterEach(()=>{process.env={...previous};});

describe("Gold Rate indexing readiness",()=>{
  it("keeps the approval registry aligned with the 30-50 city candidate pool",()=>{
    expect(approvals.candidates).toEqual(goldRateCandidateCitySlugs);
    expect(approvals.candidates.length).toBeGreaterThanOrEqual(30);
    expect(approvals.candidates.length).toBeLessThanOrEqual(50);
  });

  it("starts with indexing explicitly disabled and no invented demand approvals",async()=>{
    process.env.GOLD_RATE_INDEXING_ENABLED="false";
    delete process.env.GOLD_RATE_DATA_URL;
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_API_TOKEN;
    delete process.env.GOLD_RATE_KV_NAMESPACE_ID;
    delete process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID;
    delete process.env.GOLD_RATE_INDEX_CITIES;
    const readiness=await getGoldRateIndexingReadiness(new Date("2026-09-14T00:00:00Z"),false);
    expect(readiness.safety.indexingExplicitlyFalse).toBe(true);
    expect(readiness.demandApproval.approvedCount).toBe(0);
    expect(readiness.demandApproval.ready).toBe(false);
  });

  it("keeps the final launch checklist explicit and manual",()=>{
    const runbook=readFileSync("docs/gold-rate-indexing-readiness.md","utf8");
    for(const requirement of [
      "14 continuous calendar days",
      "Average IBJA deviation is ≤ 2%",
      "No individual validation day has deviation > 5%",
      "GOLD_RATE_INDEX_CITIES",
      "sitemap-goldrate.xml",
      "3–5 random approved city pages",
      "Submit `sitemap-goldrate.xml` separately",
    ])expect(runbook).toContain(requirement);
    expect(runbook).toContain("GOLD_RATE_INDEXING_ENABLED` must remain `false`");
  });

  it("exposes a protected human-readable validation log without changing public pages",()=>{
    const page=readFileSync("app/admin/(protected)/gold-rate/validation-log/page.tsx","utf8");
    const route=readFileSync("app/api/admin/gold-rate/validation/route.ts","utf8");
    expect(page).toContain("IBJA validation history");
    expect(page).toContain("pre-GST ↔ GST-exclusive");
    expect(route).toContain("isAdminAuthenticated");
    expect(route).toContain("getGoldRateValidationLog");
  });
});
