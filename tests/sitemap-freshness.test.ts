import {describe,expect,it} from "vitest";
import {GET as getCoreSitemap} from "../app/sitemap-core.xml/route";
import {GET as getFestivalSitemap} from "../app/sitemap-festivals.xml/route";
import {GET as getMasterSitemap} from "../app/sitemap.xml/route";
import {
  FESTIVAL_CITY_CONTENT_LASTMOD,
  festivalCityLastmod,
  sitemapFeedLastmod,
  sitemapFreshnessDates,
} from "../lib/sitemap-freshness";
import {sitemapindex,urlset} from "../lib/xml";

function count(value:string,needle:string){return value.split(needle).length-1;}

describe("sitemap freshness",()=>{
  it("uses conservative feed freshness instead of stamping every feed with today",()=>{
    const reference=new Date("2026-09-15T06:00:00Z");
    expect(sitemapFreshnessDates(reference)).toEqual({today:"2026-09-15",month:"2026-09-01",year:"2026-01-01"});
    expect(sitemapFeedLastmod("sitemap-core.xml",reference)).toBe("2026-09-15");
    expect(sitemapFeedLastmod("sitemap-panchang-daily.xml",reference)).toBe("2026-09-15");
    expect(sitemapFeedLastmod("sitemap-panchang-monthly.xml",reference)).toBe("2026-09-01");
    expect(sitemapFeedLastmod("sitemap-muhurat.xml",reference)).toBe("2026-09-01");
    expect(sitemapFeedLastmod("sitemap-yearly.xml",reference)).toBe("2026-01-01");
    expect(sitemapFeedLastmod("sitemap-vrat.xml",reference)).toBe("2026-01-01");
    expect(sitemapFeedLastmod("sitemap-festivals.xml",reference)).toBe(FESTIVAL_CITY_CONTENT_LASTMOD);
    expect(sitemapFeedLastmod("sitemap-knowledge.xml",reference)).toBeUndefined();
  });

  it("serializes optional lastmod safely and escapes XML values",()=>{
    const urls=urlset([
      {loc:"https://panchvani.com/example?a=1&b=2",lastmod:"2026-09-15"},
      "https://panchvani.com/static",
      {loc:"https://panchvani.com/bad",lastmod:"not-a-date"},
    ]);
    expect(urls).toContain("https://panchvani.com/example?a=1&amp;b=2");
    expect(urls).toContain("<lastmod>2026-09-15</lastmod>");
    expect(count(urls,"<lastmod>")).toBe(1);

    const index=sitemapindex([{loc:"https://panchvani.com/sitemap-a.xml",lastmod:"2026-09-15"}]);
    expect(index).toContain("<sitemap><loc>https://panchvani.com/sitemap-a.xml</loc><lastmod>2026-09-15</lastmod></sitemap>");
  });

  it("keeps the master index at ten feeds while leaving untracked knowledge freshness blank",async()=>{
    const body=await (await getMasterSitemap()).text();
    expect(count(body,"<sitemap>")).toBe(10);
    expect(count(body,"<lastmod>")).toBe(9);
    expect(body).toMatch(/<sitemap><loc>https:\/\/panchvani\.com\/sitemap-knowledge\.xml<\/loc><\/sitemap>/);
  });

  it("marks only the live homepage inside the core sitemap",async()=>{
    const body=await (await getCoreSitemap()).text();
    expect(count(body,"<url>")).toBe(12);
    expect(count(body,"<lastmod>")).toBe(1);
    expect(body).toMatch(/<url><loc>https:\/\/panchvani\.com\/<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod><\/url>/);
  });

  it("protects the two active festival SEO experiments from a false content lastmod",async()=>{
    expect(festivalCityLastmod("/festivals/ganesh-chaturthi/2026/ahmedabad")).toBeUndefined();
    expect(festivalCityLastmod("/festivals/dussehra/2026/hyderabad")).toBeUndefined();
    expect(festivalCityLastmod("/festivals/diwali/2026/mumbai")).toBe(FESTIVAL_CITY_CONTENT_LASTMOD);

    const body=await (await getFestivalSitemap()).text();
    expect(body).toContain(`<loc>https://panchvani.com/festivals/diwali/2026/mumbai</loc><lastmod>${FESTIVAL_CITY_CONTENT_LASTMOD}</lastmod>`);
    expect(body).toContain("<loc>https://panchvani.com/festivals/ganesh-chaturthi/2026/ahmedabad</loc></url>");
    expect(body).toContain("<loc>https://panchvani.com/festivals/dussehra/2026/hyderabad</loc></url>");
  });
});
