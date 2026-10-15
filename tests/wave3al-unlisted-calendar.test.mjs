import {describe,it,expect} from "vitest";
import {chooseUnlistedDailyReferences} from "../scripts/unlisted-calendar-reference-sampler.mjs";
import {inspectCrossPageCalendar,reconcileRenderedCalendar} from "../scripts/crosspage-calendar-integrity.mjs";
import {extractDailyVisibleFacts} from "../scripts/daily-fact-integrity.mjs";
import {readFileSync} from "node:fs";

const href=(city,date)=>"/panchang/"+city+"/"+date;
const refs=[
  {city:"kanpur",date:"2026-11-21",type:"month",source:"/calendar/kanpur/2026/11"},
  {city:"kanpur",date:"2026-11-21",type:"vrat",source:"/vrat/ekadashi/2026/kanpur"},
  {city:"delhi",date:"2026-06-30",type:"month"},
  {city:"patna",date:"2027-01-31",type:"vrat"},
  {city:"mumbai",date:"2027-01-02",type:"month"},
  {city:"chennai",date:"2028-09-11",type:"vrat"}
];
const daily=(tithi,paksha,sunrise,end)=>
  `<main><div class="data-card"><small>Tithi</small><strong>${tithi}</strong><small>${paksha} Paksha · until ${end}</small></div><div class="data-card"><small>Nakshatra</small><strong>Rohini</strong></div><div class="data-card"><small>Sunrise</small><strong>${sunrise}</strong></div></main>`;
const month=`<main><div class="month-grid"><a href="/panchang/kanpur/2026-11-21"><strong>21</strong><small>Ekadashi</small><small>Rohini</small></a></div></main>`;
const vrat=`<main><div class="city-directory"><a href="/panchang/kanpur/2026-11-21"><small>Saturday · Shukla Paksha</small><strong>2026-11-21</strong><span>Sunrise 06:20 · Tithi until 07:30</span></a></div></main>`;

describe("Wave 3AL direct non-sitemap consistency",()=>{
  it("selects one URL per city+date and preserves both reference families",()=>{
    const result=chooseUnlistedDailyReferences(refs,6);
    expect(result.sourceReferences).toBe(6);
    expect(result.uniqueTargets).toBe(5);
    expect(result.selected).toHaveLength(5);
    expect(result.completeCoverage).toBe(true);
    const row=result.selected.find(x=>x.path===href("kanpur","2026-11-21"));
    expect(row?.types).toEqual(["month","vrat"]);
    expect(row?.critical).toBe(true);
  });
  it("has deterministic ordering independent of input permutation and never invents routes",()=>{
    const a=chooseUnlistedDailyReferences(refs,3);
    const b=chooseUnlistedDailyReferences([...refs].reverse(),3);
    expect(a.selected).toEqual(b.selected);
    expect(a.selected.every(x=>/^\/panchang\/[^/]+\/\d{4}-\d{2}-\d{2}$/.test(x.path))).toBe(true);
    expect(a.selected[0].critical).toBe(true);
  });
  it("rejects bogus and dangerous URL targets and excessive resource requests",()=>{
    const selected=chooseUnlistedDailyReferences([...refs,{city:"../admin",date:"2027-01-01",type:"vrat"},
      {city:"patna",date:"no",type:"month"}],6);
    expect(selected.uniqueTargets).toBe(5);
    expect(()=>chooseUnlistedDailyReferences(refs,0)).toThrow();
    expect(()=>chooseUnlistedDailyReferences(refs,513)).toThrow();
  });
  it("compares month and Vrat against directly fetched Daily HTML, including Paksha and clocks",()=>{
    const before=[
      inspectCrossPageCalendar("/calendar/kanpur/2026/11",month),
      inspectCrossPageCalendar("/vrat/ekadashi/2026/kanpur",vrat)
    ];
    const incomplete=reconcileRenderedCalendar(before);
    expect(incomplete.missingCounterparts).toHaveLength(2);
    const actual=inspectCrossPageCalendar(href("kanpur","2026-11-21"),
      daily("Ekadashi","Shukla","06:20","07:30"));
    const verified=reconcileRenderedCalendar([...before,actual]);
    expect(verified.matchedMonth).toBe(1);
    expect(verified.matchedVrat).toBe(1);
    expect(verified.contradictions).toEqual([]);
    expect(verified.missingCounterparts).toHaveLength(0);
    expect(extractDailyVisibleFacts(daily("Ekadashi","Shukla","06:20","07:30"))).toMatchObject({
      Tithi:"Ekadashi",Paksha:"Shukla",TithiEndClock:"07:30"
    });
  });
  it("catches a matching Tithi whose Vrat sunrise clock was copied from another city",()=>{
    const report=reconcileRenderedCalendar([
      inspectCrossPageCalendar("/vrat/ekadashi/2026/kanpur",vrat),
      inspectCrossPageCalendar(href("kanpur","2026-11-21"),
        daily("Ekadashi","Shukla","06:48","07:30"))
    ]);
    expect(report.contradictions.map(x=>x.field)).toContain("Vrat sunrise clock");
  });
  it("wires the direct-url evidence into the full SEO gate without expanding the sitemap",()=>{
    const source=readFileSync("scripts/content-quality-audit.mjs","utf8");
    const gate=readFileSync("scripts/content-quality-gate.mjs","utf8");
    expect(source).toContain("chooseUnlistedDailyReferences(");
    expect(source).toContain("verifiedOnDemand");
    expect(gate).toContain("direct non-sitemap calendar validation missing or incomplete");
  });
});
