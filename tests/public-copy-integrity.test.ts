import {existsSync,readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import type {GscRow,GscTrafficSnapshot} from "../lib/gsc";
import {buildSearchOpportunities} from "../lib/search-opportunities";

function row(query:string,impressions:number,clicks:number,position:number):GscRow{
  return {keys:[query],impressions,clicks,position,ctr:impressions?clicks/impressions:0};
}
function queryPage(query:string,page:string,impressions:number,clicks:number,position:number):GscRow{
  return {keys:[query,page],impressions,clicks,position,ctr:impressions?clicks/impressions:0};
}
function snapshot(query:string,page:string):GscTrafficSnapshot{
  return {
    siteUrl:"sc-domain:panchvani.com",
    startDate:"2026-08-12",endDate:"2026-09-08",previousStartDate:"2026-07-15",previousEndDate:"2026-08-11",
    current:{clicks:0,impressions:0,ctr:0,position:0},previous:{clicks:0,impressions:0,ctr:0,position:0},
    pages:[],queries:[row(query,700,28,6.5)],queryPages:[queryPage(query,page,700,28,6.5)],daily:[]
  };
}

describe("People-first public SEO integrity",()=>{
  it("has real parent owners for Muhurat, Choghadiya and Nakshatra baby names",()=>{
    expect(existsSync("app/muhurat/page.tsx")).toBe(true);
    expect(existsSync("app/tools/choghadiya/page.tsx")).toBe(true);
    expect(existsSync("app/tools/hindu-baby-names/page.tsx")).toBe(true);
  });

  it("keeps the new parent owners discoverable in the appropriate sitemaps",()=>{
    const core=readFileSync("app/sitemap-core.xml/route.ts","utf8");
    const tools=readFileSync("app/sitemap-tools.xml/route.ts","utf8");
    expect(core).toContain('base+"/muhurat"');
    expect(tools).toContain("`${base}/tools/choghadiya`");
    expect(tools).toContain("`${base}/tools/hindu-baby-names`");
  });

  it("keeps key public surfaces free of internal SEO-control language",()=>{
    const paths=[
      "app/knowledge/page.tsx",
      "app/tools/page.tsx",
      "app/cities/page.tsx",
      "app/festivals/page.tsx",
      "app/regional/page.tsx",
      "app/page.tsx",
      "components/Header.tsx",
      "lib/topical-links.ts",
    ];
    const forbidden=/keyword cannibalization|canonical guides|one owner per informational intent|synthetic freshness|mass article generation|SEO policy|demand-gated|PageRank|public indexation|canonical festival set|REGIONAL SEARCH HUB|active intent pages/i;
    for(const path of paths)expect(readFileSync(path,"utf8")).not.toMatch(forbidden);
  });

  it("uses human-readable month names in monthly calendar metadata",()=>{
    const source=readFileSync("app/calendar/[city]/[year]/[month]/page.tsx","utf8");
    expect(source).toContain("Hindu Calendar for ${city.name} — Tithi & Festivals");
    expect(source).not.toContain("${p.month}/${p.year}");
  });

  it("does not claim date-only Nakshatra tools provide an exact birth result",()=>{
    const hub=readFileSync("app/tools/hindu-baby-names/page.tsx","utf8");
    const child=readFileSync("app/tools/hindu-baby-names/[nakshatra]/page.tsx","utf8");
    expect(hub).toContain("exact birth-time chart");
    expect(child).toContain("date-only Nakshatra Finder is an estimate");
  });

  it("recognizes the generic baby-names hub as an existing landing page",()=>{
    const result=buildSearchOpportunities(snapshot("hindu baby names","https://panchvani.com/tools/hindu-baby-names"));
    const item=result.find(entry=>entry.intent==="content:baby-names");
    expect(item?.recommendedPath).toBe("/tools/hindu-baby-names");
    expect(item?.status).not.toBe("NEW_CLUSTER");
    expect(item?.action).not.toBe("BUILD");
  });

  it("links the homepage and header to parent owners instead of deep defaults",()=>{
    const home=readFileSync("app/page.tsx","utf8");
    const header=readFileSync("components/Header.tsx","utf8");
    expect(home).toContain('href="/muhurat"');
    expect(home).toContain('href="/tools/hindu-baby-names"');
    expect(header).toContain('href="/muhurat"');
    expect(header).toContain('href:"/tools/choghadiya"');
    expect(header).toContain('href:"/tools/hindu-baby-names"');
  });
});
