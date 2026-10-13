import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {getVerifiedMuhuratClosure} from "../lib/verified-muhurat-closures";
import {getMonthlyMuhurat} from "../lib/muhurat";
const mumbai=findCityBySlug("mumbai")!;
const delhi=findCityBySlug("delhi")!;
const pune=findCityBySlug("pune")!;
describe("Conventional Marathi wedding calendar — October 2026",()=>{
  it("records audited sources and limits the closure to the explicitly reviewed Mumbai city-month",()=>{
    const closed=getVerifiedMuhuratClosure("wedding",2026,10,mumbai);
    expect(closed?.reason).toBe("Chaturmas");
    expect(closed?.sourceUrls).toHaveLength(3);
    expect(closed?.observedPeriod).toEqual({from:"2026-07-25",through:"2026-11-20"});
    for(const city of [delhi,pune]){
      expect(getVerifiedMuhuratClosure("wedding",2026,10,city)).toBeNull();
    }
    for(const other of [[2025,10],[2026,9],[2026,11],[2027,10]]){
      expect(getVerifiedMuhuratClosure("wedding",other[0],other[1],mumbai)).toBeNull();
    }
    expect(getVerifiedMuhuratClosure("vehicle-purchase",2026,10,mumbai)).toBeNull();
    expect(getVerifiedMuhuratClosure("griha-pravesh",2026,10,mumbai)).toBeNull();
  });
  it("never promotes lunar-screened 2026 October Mumbai wedding times to wedding dates",async()=>{
    const {rows}=await getMonthlyMuhurat("wedding",2026,10,mumbai);
    expect(rows).toHaveLength(0);
  });
  it("renders a reasoned zero-date page, not invented lunar-filter emptiness or a false ranking",()=>{
    const source=readFileSync("components/VerifiedMuhuratClosurePage.tsx","utf8");
    expect(source).toContain("Why are no traditional Marathi wedding dates recommended?");
    expect(source).toContain("does not override");
    expect(source).toContain("closure.alternativesNote");
    expect(source).not.toContain("scoreEvidence");
    for(const file of ["app/muhurat/[event]/[year]/[month]/page.tsx","app/muhurat/[event]/[year]/[month]/[city]/page.tsx"]){
      const page=readFileSync(file,"utf8");
      expect(page).toContain("getVerifiedMuhuratClosure");
      expect(page).toContain("VerifiedMuhuratClosurePage");
    }
  });
});
