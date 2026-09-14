import {afterEach,describe,expect,it} from "vitest";
import {getGoldRateStoreStatus,setGoldRateKvBinding} from "../lib/gold-rate-store";

const previous={...process.env};
afterEach(()=>{process.env={...previous};setGoldRateKvBinding(null);});

describe("Gold Rate KV production wiring",()=>{
  it("prefers a native Worker KV binding with no REST credentials",()=>{
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.GOLD_RATE_KV_NAMESPACE_ID;
    delete process.env.GOLD_RATE_KV_API_TOKEN;
    delete process.env.CLOUDFLARE_API_TOKEN;
    setGoldRateKvBinding({get:async()=>null,put:async()=>{}});
    const status=getGoldRateStoreStatus();
    expect(status.configured).toBe(true);
    expect(status.mode).toBe("binding");
    expect(status.usingNativeBinding).toBe(true);
    expect(status.missing).toEqual([]);
  });

  it("prefers a dedicated Gold Rate KV token for the REST fallback",()=>{
    process.env.CLOUDFLARE_ACCOUNT_ID="account";
    process.env.GOLD_RATE_KV_NAMESPACE_ID="namespace";
    process.env.GOLD_RATE_KV_API_TOKEN="dedicated";
    delete process.env.CLOUDFLARE_API_TOKEN;
    const status=getGoldRateStoreStatus();
    expect(status.configured).toBe(true);
    expect(status.mode).toBe("rest");
    expect(status.usingDedicatedToken).toBe(true);
    expect(status.missing).toEqual([]);
  });

  it("keeps the legacy Cloudflare token as a backward-compatible REST fallback",()=>{
    process.env.CLOUDFLARE_ACCOUNT_ID="account";
    process.env.GOLD_RATE_KV_NAMESPACE_ID="namespace";
    delete process.env.GOLD_RATE_KV_API_TOKEN;
    process.env.CLOUDFLARE_API_TOKEN="shared";
    const status=getGoldRateStoreStatus();
    expect(status.configured).toBe(true);
    expect(status.usingDedicatedToken).toBe(false);
  });

  it("reports exactly which REST setting is missing when no binding exists",()=>{
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
