import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {computeObservedDailyTimingOverlaps} from "../lib/daily-window-overlap";
import {inspectRenderedDailyTrust} from "../scripts/daily-content-trust.mjs";
const sample={
  abhijit:{start:"12:01",end:"12:47"},
  rahu:{start:"10:56",end:"12:24"},
  yamaganda:{start:"15:20",end:"16:47"},
  gulika:{start:"08:01",end:"09:29"},
  dayChoghadiya:[
    {name:"Char",effect:"neutral" as const,start:"06:33",end:"08:01",startDayOffset:0 as const,endDayOffset:0 as const},
    {name:"Labh",effect:"good" as const,start:"08:01",end:"09:29",startDayOffset:0 as const,endDayOffset:0 as const},
    {name:"Amrit",effect:"good" as const,start:"09:29",end:"10:56",startDayOffset:0 as const,endDayOffset:0 as const},
    {name:"Kaal",effect:"bad" as const,start:"10:56",end:"12:24",startDayOffset:0 as const,endDayOffset:0 as const},
    {name:"Shubh",effect:"good" as const,start:"12:24",end:"13:52",startDayOffset:0 as const,endDayOffset:0 as const},
  ]
};
describe("CT3: meaningful daily clock conflict evidence",()=>{
 it("computes actual minutes, not ritual recommendations",()=>{
   const r=computeObservedDailyTimingOverlaps(sample);
   expect(r).toContainEqual(expect.objectContaining({
     source:"Abhijit Muhurat",excludedBy:"Rahu Kalam",
     sourceWindow:"12:01–12:47",excludedWindow:"10:56–12:24",
     overlapStart:"12:01",overlapEnd:"12:24",overlapMinutes:23,
   }));
   expect(r).toContainEqual(expect.objectContaining({source:"Labh Choghadiya",excludedBy:"Gulika Kalam",overlapMinutes:88}));
   expect(r.some(x=>x.source==="Amrit Choghadiya")).toBe(false);
 });
 it("never invents an overlap when only the endpoint touches",()=>{
   expect(computeObservedDailyTimingOverlaps({...sample,abhijit:{start:"12:24",end:"12:47"},dayChoghadiya:[]}).some(x=>x.excludedBy==="Rahu Kalam")).toBe(false);
 });
 it("rejects impossible daytime clock windows rather than silently giving zero",()=>{
   expect(()=>computeObservedDailyTimingOverlaps({...sample,abhijit:{start:"13:00",end:"12:00"}})).toThrow("Unusable daytime interval");
 });
 it("enforces editorial policy only on indexable Daily rendered HTML",()=>{
   const path="/panchang/mumbai/2026-10-16";
   const html='<main data-content-trust="timing-observation-only"><h1>Mumbai</h1><p>Calculated interval overlaps · NOT independent ritual approval</p><a href="/methodology">Methodology</a><a href="/accuracy">Accuracy</a></main>';
   expect(inspectRenderedDailyTrust(path,html).issues).toEqual([]);
   expect(inspectRenderedDailyTrust(path,html.replace("Calculated interval overlaps","Traditional favorable signals")).issues).toContain("unsupported-favorable-signal");
   expect(inspectRenderedDailyTrust(path,html.replace('href="/accuracy"','href="/about"')).issues).toContain("missing-accuracy-link");
   expect(inspectRenderedDailyTrust("/vrat/purnima/2026/mumbai",html)).toBeNull();
 });
 it("preserves grounded context and removes pseudo-scientific sunrise taxonomy",()=>{
   const ctx=readFileSync("lib/daily-city-context.ts","utf8");
   const page=readFileSync("app/panchang/[city]/[[...date]]/page.tsx","utf8");
   expect(ctx).not.toContain("mid-morning-edge sunrise");
   expect(page).toContain("buildDailyCityContext");
   expect(page).not.toContain("getDailyGuidance");
   expect(page).toContain("computeObservedDailyTimingOverlaps");
   expect(page).toContain('data-content-trust="timing-observation-only"');
 });
});
