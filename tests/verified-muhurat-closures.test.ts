import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {getVerifiedMuhuratClosure} from "../lib/verified-muhurat-closures";
import {getMonthlyMuhurat} from "../lib/muhurat";
import {reviewedMarathiMarriageOctober2026,reviewedMarathiMarriageAugustSeptember2026} from "./fixtures/muhurat-closure-2026-evidence";
const mumbai=findCityBySlug("mumbai")!;
const delhi=findCityBySlug("delhi")!;
const pune=findCityBySlug("pune")!;
describe("Conventional Marathi wedding calendar — August through October 2026",()=>{
  it("records audited sources and limits the closure to the explicitly reviewed Mumbai city-month",()=>{
    const closed=getVerifiedMuhuratClosure("wedding",2026,10,mumbai);
    expect(closed?.reason).toBe("Chaturmas");
    expect(reviewedMarathiMarriageOctober2026.sources).toHaveLength(4);
    expect(reviewedMarathiMarriageOctober2026.sources.filter(s=>s.verdict==="zero")).toHaveLength(3);
    expect(reviewedMarathiMarriageOctober2026.sources.some(s=>s.verdict.includes("conflict"))).toBe(true);
    expect(closed?.observedPeriod).toEqual({from:"2026-07-25",through:"2026-11-20"});
    for(const city of [delhi,pune]){
      expect(getVerifiedMuhuratClosure("wedding",2026,10,city)).toBeNull();
    }
    for(const other of [[2025,10],[2026,7],[2026,11],[2027,10]]){
      expect(getVerifiedMuhuratClosure("wedding",other[0],other[1],mumbai)).toBeNull();
    }
    expect(getVerifiedMuhuratClosure("vehicle-purchase",2026,10,mumbai)).toBeNull();
    expect(getVerifiedMuhuratClosure("griha-pravesh",2026,10,mumbai)).toBeNull();
  });
  it("has independently documented August and September closure evidence",()=>{
    expect(reviewedMarathiMarriageAugustSeptember2026.months).toEqual([8,9]);
    expect(reviewedMarathiMarriageAugustSeptember2026.sources).toHaveLength(3);
    for(const month of [8,9,10]){
      const record=getVerifiedMuhuratClosure("wedding",2026,month,mumbai);
      expect(record?.month).toBe(month);
      expect(record?.headline).toContain(new Date(Date.UTC(2026,month-1,1)).toLocaleString("en-IN",{month:"long",timeZone:"UTC"}));
    }
  });
  it("never promotes sunrise-screened August–October Mumbai wedding times as confirmed marriage dates",async()=>{
    for(const month of [8,9,10]){
      const {rows}=await getMonthlyMuhurat("wedding",2026,month,mumbai);
      expect(rows).toHaveLength(0);
    }
  });
  it("renders a reasoned zero-date page, not invented lunar-filter emptiness or a false ranking",()=>{
    const source=readFileSync("components/VerifiedMuhuratClosurePage.tsx","utf8");
    expect(source).toContain("Why are no traditional Marathi wedding dates recommended?");
    expect(source).toContain("monthName");
    expect(source).not.toContain("All 31 civil dates of October");
    expect(getVerifiedMuhuratClosure("wedding",2026,10,mumbai)?.explanation).toContain("does not override");
    expect(source).toContain("closure.alternativesNote");
    expect(source).not.toContain("scoreEvidence");
    for(const file of ["app/muhurat/[event]/[year]/[month]/page.tsx","app/muhurat/[event]/[year]/[month]/[city]/page.tsx"]){
      const page=readFileSync(file,"utf8");
      expect(page).toContain("getVerifiedMuhuratClosure");
      expect(page).toContain("VerifiedMuhuratClosurePage");
    }
  });
});
