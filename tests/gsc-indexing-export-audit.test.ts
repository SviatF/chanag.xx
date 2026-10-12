import {describe,expect,it} from "vitest";
// @ts-ignore plain Node ESM audit module
import {
  analyzeUrls,
  classifyPanchvaniUrl,
  extractUrlsFromCsv,
  fetchSitemapUrls,
  normalizeUrl,
  parseCsvRows,
} from "../scripts/gsc-indexing-export-audit.mjs";

describe("GSC indexing export audit",()=>{
  it("parses quoted CSV exports and extracts unique Panchvani URLs",()=>{
    const csv='URL,Reason\n"https://panchvani.com/panchang/mumbai/2026-10-12","Discovered, currently not indexed"\nhttps://panchvani.com/calendar/delhi/2026/10,Other\nhttps://example.com/nope,Other\nhttps://panchvani.com/calendar/delhi/2026/10,Duplicate\n';
    expect(parseCsvRows(csv)).toHaveLength(5);
    expect(extractUrlsFromCsv(csv)).toEqual([
      "https://panchvani.com/panchang/mumbai/2026-10-12",
      "https://panchvani.com/calendar/delhi/2026/10"
    ]);
  });

  it("classifies core programmatic route families",()=>{
    expect(classifyPanchvaniUrl("https://panchvani.com/panchang/mumbai/2026-10-12")).toMatchObject({family:"panchang-daily",city:"mumbai",year:2026,month:10});
    expect(classifyPanchvaniUrl("https://panchvani.com/calendar/pune/2027")).toMatchObject({family:"calendar-year-city",city:"pune",year:2027});
    expect(classifyPanchvaniUrl("https://panchvani.com/festivals/diwali/2026/patna")).toMatchObject({family:"festival-city",topic:"diwali",city:"patna",year:2026});
    expect(classifyPanchvaniUrl("https://panchvani.com/muhurat/wedding/2026/11/vadodara")).toMatchObject({family:"muhurat-city-month",topic:"wedding",city:"vadodara",year:2026,month:11});
    expect(classifyPanchvaniUrl("https://panchvani.com/vrat/ekadashi/2026/varanasi")).toMatchObject({family:"vrat-city",topic:"ekadashi",city:"varanasi",year:2026});
  });

  it("separates URLs in the current sitemap from legacy or outside-sitemap URLs",()=>{
    const urls=[
      "https://panchvani.com/panchang/mumbai/2026-10-12",
      "https://panchvani.com/panchang/mumbai/2026-06-01",
      "https://panchvani.com/calendar/delhi/2026/10"
    ];
    const sitemap=new Set([
      "https://panchvani.com/panchang/mumbai/2026-10-12",
      "https://panchvani.com/calendar/delhi/2026/10"
    ]);
    const report=analyzeUrls(urls,sitemap);
    expect(report).toMatchObject({total:3,currentSitemap:2,outsideSitemap:1});
    expect(report.rows.find(row=>row.url.endsWith("/2026-06-01"))?.status).toBe("OUTSIDE_SITEMAP");
  });

  it("expands a sitemap index and normalizes trailing slashes",async()=>{
    const xml=new Map([
      ["https://panchvani.com/sitemap.xml",'<sitemapindex><sitemap><loc>https://panchvani.com/a.xml</loc></sitemap><sitemap><loc>https://panchvani.com/b.xml</loc></sitemap></sitemapindex>'],
      ["https://panchvani.com/a.xml",'<urlset><url><loc>https://panchvani.com/panchang/mumbai/2026-10-12</loc></url></urlset>'],
      ["https://panchvani.com/b.xml",'<urlset><url><loc>https://panchvani.com/calendar/delhi/2026/10/</loc></url></urlset>']
    ]);
    const fetchImpl=async(url:string)=>new Response(xml.get(url)??"missing",{status:xml.has(url)?200:404});
    const result=await fetchSitemapUrls("https://panchvani.com/sitemap.xml",{fetchImpl});
    expect(result.documents).toHaveLength(3);
    expect(result.urls).toEqual(new Set([
      "https://panchvani.com/panchang/mumbai/2026-10-12",
      "https://panchvani.com/calendar/delhi/2026/10"
    ]));
    expect(normalizeUrl("https://panchvani.com/calendar/delhi/2026/10/?x=1#y")).toBe("https://panchvani.com/calendar/delhi/2026/10");
  });
});
