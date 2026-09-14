import {afterEach,describe,expect,it} from "vitest";
import {getGoldRateStoreStatus} from "../lib/gold-rate-store";

const previous={...process.env};
afterEach(()=>{process.env={...previous};});

describe("Gold Rate KV production wiring",()=>{
  it("prefers a dedicated Gold Rate KV token",()=>{
    process.env.CLOUDFLARE_ACCOUNT_ID="account";
    process.env.GOLD_RATE_KV_NAMESPACE_ID="namespace";
    process.env.GOLD_RATE_KV_API_TOKEN="dedicated";
    delete process.env.CLOUDFLARE_API_TOKEN;
    const status=getGoldRateStoreStatus();
    expect(status.configured).toBe(true);
    expect(status.usingDedicatedToken).toBe(true);
    expect(status.missing).toEqual([]);
  });

  it("keeps the legacy Cloudflare token as a backward-compatible fallback",()=>{
    process.env.CLOUDFLARE_ACCOUNT_ID="account";
    process.env.GOLD_RATE_KV_NAMESPACE_ID="namespace";
    delete process.env.GOLD_RATE_KV_API_TOKEN;
    process.env.CLOUDFLARE_API_TOKEN="shared";
    const status=getGoldRateStoreStatus();
    expect(status.configured).toBe(true);
    expect(status.usingDedicatedToken).toBe(false);
  });

  it("reports exactly which production setting is missing",()=>{
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.GOLD_RATE_KV_API_TOKEN;
    delete process.env.CLOUDFLARE_API_TOKEN;
    delete process.env.GOLD_RATE_KV_NAMESPACE_ID;
    delete process.env.SEO_OPPORTUNITY_KV_NAMESPACE_ID;
    expect(getGoldRateStoreStatus().missing).toEqual([
      "CLOUDFLARE_ACCOUNT_ID",
      "GOLD_RATE_KV_API_TOKEN",
      "GOLD_RATE_KV_NAMESPACE_ID",
    ]);
  });
});
