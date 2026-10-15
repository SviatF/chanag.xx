import {describe,it,expect} from "vitest";
import {extractDailyVisibleFacts,inspectDailyVisibleFacts,summarizeDailyFactIntegrity} from "../scripts/daily-fact-integrity.mjs";

const html=(fields={
 Tithi:"Navami",Nakshatra:"Rohini",Yoga:"Dhriti",
 Karana:"Bava",Sunrise:"06:12",Sunset:"17:43"
})=>'<main><div class="data-grid">'+
 Object.entries(fields).map(([key,value])=>
 '<div class="data-card"><small>'+key+'</small><strong>'+value+'</strong></div>').join("")+
 '</div></main>';

describe("Wave 3AJ: distinct real local facts are not boilerplate SEO copy",()=>{
 it("extracts astronomical fields actually visible in daily cards",()=>{
   const facts=extractDailyVisibleFacts(html());
   expect(facts).toMatchObject({Tithi:"Navami",Nakshatra:"Rohini",Sunrise:"06:12",Sunset:"17:43"});
   const r=inspectDailyVisibleFacts("/panchang/patna/2027-01-31",html());
   expect(r.problems).toEqual([]);
   expect(r.signature).toContain("06:12|17:43");
 });
 it("rejects a missing, fabricated or impossible sunrise/sunset",()=>{
   const d=inspectDailyVisibleFacts("/panchang/delhi/2026-06-30",html({
     Tithi:"—",Nakshatra:"Rohini",Yoga:"Dhriti",
     Karana:"Bava",Sunrise:"18:50",Sunset:"06:12"
   }));
   expect(d.problems).toEqual(expect.arrayContaining([
     "missing or ambiguous rendered Tithi",
     "implausible or reversed sunrise/sunset sequence"
   ]));
   expect(inspectDailyVisibleFacts("/panchang/patna/2027-01-31",html({
     Tithi:"Navami",Nakshatra:"Rohini",Yoga:"Dhriti",Karana:"Bava",
     Sunrise:"26:12",Sunset:"17:43"
   })).problems).toContain("invalid local sunrise/sunset format");
 });
 it("rejects duplicate/ambiguous cards instead of choosing the most convenient value",()=>{
   const duplicated=html().replace('</div></main>',
     '<div class="data-card"><small>Sunrise</small><strong>08:00</strong></div></div></main>');
   expect(inspectDailyVisibleFacts("/panchang/delhi/2026-06-30",duplicated).problems)
     .toContain("missing or ambiguous rendered Sunrise");
 });
 it("does not call legitimate adjacent-city rounded equality a proven falsehood",()=>{
   const a=inspectDailyVisibleFacts("/panchang/patna/2027-01-31",html());
   const b=inspectDailyVisibleFacts("/panchang/kanpur/2027-01-31",html());
   const c=inspectDailyVisibleFacts("/panchang/delhi/2027-01-31",html({
     Tithi:"Navami",Nakshatra:"Rohini",Yoga:"Dhriti",
     Karana:"Bava",Sunrise:"07:12",Sunset:"18:43"
   }));
   const report=summarizeDailyFactIntegrity([a,b,c,null]);
   expect(report.dailyPages).toBe(3);
   expect(report.failures).toHaveLength(0);
   expect(report.identicalLocalFactGroups).toHaveLength(1);
   expect(report.identicalLocalFactGroups[0].owners).toHaveLength(2);
   expect(report.identicalGroupsRequireHumanReview).toBe(true);
 });
 it("ignores non-daily routes instead of pretending they have daily astronomy",()=>{
   expect(inspectDailyVisibleFacts("/vrat/ekadashi/2027/kanpur",html())).toBeNull();
   expect(summarizeDailyFactIntegrity([null]).dailyPages).toBe(0);
 });
});
