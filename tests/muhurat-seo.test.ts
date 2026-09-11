import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {getMonthlyMuhurat} from "../lib/muhurat";
import {buildMuhuratSeoSummary} from "../lib/muhurat-seo";

describe("Muhurat deterministic SEO content engine",()=>{
  it("derives summary facts from the screened rows and stays deterministic",async()=>{
    const city=findCityBySlug("mumbai")!;
    const {rows}=await getMonthlyMuhurat("wedding",2026,9,city);
    const first=buildMuhuratSeoSummary("wedding",2026,9,city,rows,"baseline");
    const second=buildMuhuratSeoSummary("wedding",2026,9,city,rows,"baseline");

    expect(first).toEqual(second);
    expect(first.monthLabel).toBe("September 2026");
    expect(first.qualifyingCount).toBe(rows.length);
    expect(first.averageScore).toBe(rows.length?Math.round(rows.reduce((sum,row)=>sum+row.planning.score,0)/rows.length):0);
    expect(first.topDate).toBe(rows[0]?.date??null);
    expect(first.headline).toContain("Mumbai baseline");
    expect(first.overview).toContain(`${rows.length} wedding muhurat candidate`);
    expect(first.overview).toContain("not a complete Panchang Shuddhi");

    if(rows[0]){
      expect(first.rankingInsight).toContain(rows[0].date.slice(0,4));
      expect(first.rankingInsight).toContain(`${rows[0].planning.score}/100`);
      expect(first.timingInsight).toContain(`${rows[0].planning.longestWindowMinutes} minutes`);
    }
  });

  it("uses city-specific wording for local pages",async()=>{
    const city=findCityBySlug("delhi")!;
    const {rows}=await getMonthlyMuhurat("vehicle-purchase",2026,10,city);
    const summary=buildMuhuratSeoSummary("vehicle-purchase",2026,10,city,rows,"city");

    expect(summary.headline).toContain("Delhi");
    expect(summary.overview).toContain("Delhi");
    expect(summary.timingInsight).toContain("Delhi");
    expect(summary.monthLabel).toBe("October 2026");
  });

  it("does not invent dates when a month has no screened candidates",()=>{
    const city=findCityBySlug("chennai")!;
    const summary=buildMuhuratSeoSummary("griha-pravesh",2026,11,city,[],"city");

    expect(summary.qualifyingCount).toBe(0);
    expect(summary.topDate).toBeNull();
    expect(summary.topWindow).toBeNull();
    expect(summary.headline).toContain("No griha pravesh muhurat candidates matched");
    expect(summary.headline).toContain("Tithi + Nakshatra screening profile");
    expect(summary.overview).toContain("No date matched both filters");
    expect(summary.alternatives).toContain("adjacent month");
  });
});
