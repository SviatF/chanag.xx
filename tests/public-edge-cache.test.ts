import {describe,expect,it} from "vitest";
import {isPublicResponseCacheable,publicEdgeCacheDecision,publicEdgeCacheTtlSeconds} from "../lib/public-edge-cache";

function htmlRequest(url:string,headers:Record<string,string>={}){
  return new Request(url,{headers:{accept:"text/html",...headers}});
}

describe("public Cloudflare edge cache shield",()=>{
  it("caches public HTML and strips tracking-only query params from the cache key",()=>{
    const decision=publicEdgeCacheDecision(htmlRequest("https://panchvani.com/panchang/mumbai/2026-09-15?utm_source=gsc&fbclid=abc"),"deploy-123");
    expect(decision.eligible).toBe(true);
    expect(decision.cacheUrl).toContain("__pv_edge_v=deploy-123");
    expect(decision.cacheUrl).not.toContain("utm_source");
    expect(decision.cacheUrl).not.toContain("fbclid");
  });

  it("collapses arbitrary query noise on deterministic SEO content to its canonical pathname",()=>{
    const decision=publicEdgeCacheDecision(htmlRequest("https://panchvani.com/panchang/mumbai/2026-09-15?foo=1&utm_source=bot&ref=random"),"v1");
    expect(decision.eligible).toBe(true);
    expect(decision.reason).toBe("public-html");
    expect(decision.cacheUrl).toBe("https://panchvani.com/panchang/mumbai/2026-09-15?__pv_edge_v=v1");
  });

  it("never caches admin, APIs, RSC payloads or genuinely functional query pages",()=>{
    expect(publicEdgeCacheDecision(htmlRequest("https://panchvani.com/admin"),"v").eligible).toBe(false);
    expect(publicEdgeCacheDecision(htmlRequest("https://panchvani.com/api/admin/seo-data"),"v").eligible).toBe(false);
    expect(publicEdgeCacheDecision(htmlRequest("https://panchvani.com/panchang/mumbai",{"rsc":"1"}),"v").eligible).toBe(false);
    expect(publicEdgeCacheDecision(htmlRequest("https://panchvani.com/search?q=diwali"),"v").eligible).toBe(false);
  });

  it("uses longer TTLs for deterministic dated pages and short TTLs for live gold data",()=>{
    expect(publicEdgeCacheTtlSeconds("/panchang/mumbai/2026-09-15",200)).toBe(86400);
    expect(publicEdgeCacheTtlSeconds("/panchang/mumbai",200)).toBe(1800);
    expect(publicEdgeCacheTtlSeconds("/gold-rate/mumbai",200)).toBe(600);
    expect(publicEdgeCacheTtlSeconds("/festivals/diwali/2026-10-20",200)).toBe(43200);
    expect(publicEdgeCacheTtlSeconds("/about",200)).toBe(21600);
    expect(publicEdgeCacheTtlSeconds("/missing",404)).toBe(600);
  });

  it("only stores safe public HTML, redirects and short-lived 404 responses",()=>{
    expect(isPublicResponseCacheable(new Response("<html/>",{status:200,headers:{"content-type":"text/html; charset=utf-8"}}))).toBe(true);
    expect(isPublicResponseCacheable(new Response("{}",{status:200,headers:{"content-type":"application/json"}}))).toBe(false);
    expect(isPublicResponseCacheable(new Response("<html/>",{status:200,headers:{"content-type":"text/html","set-cookie":"session=x"}}))).toBe(false);
    expect(isPublicResponseCacheable(new Response("error",{status:500,headers:{"content-type":"text/html"}}))).toBe(false);
    expect(isPublicResponseCacheable(new Response(null,{status:308,headers:{location:"/panchang/mumbai/2026-09-15"}}))).toBe(true);
  });
});
