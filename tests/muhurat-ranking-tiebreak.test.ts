import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {getMonthlyMuhurat,buildMuhuratPlanningScore,type MuhuratRow} from "../lib/muhurat";
import {getMuhuratScoreEvidence} from "../lib/muhurat-score-evidence";

describe("Muhurat saturation and deterministic meaningful tie breaks",()=>{
  it("preserves numeric score consistency on two indistinguishable score-100 windows",()=>{
    const first=[{start:"08:00",end:"09:00",sources:["Shubh Choghadiya","Abhijit Muhurat"]}];
    const second=[{start:"08:00",end:"09:00",sources:["Shubh Choghadiya","Abhijit Muhurat"]},
      {start:"14:00",end:"15:00",sources:["Labh Choghadiya"]}];
    const a=buildMuhuratPlanningScore("vehicle-purchase",first);
    const b=buildMuhuratPlanningScore("vehicle-purchase",second);
    expect(a.score).toBeLessThanOrEqual(b.score);
    expect(b.totalCleanMinutes).toBeGreaterThan(a.totalCleanMinutes);
    const row={date:"2026-09-02",data:{} as never,reasons:[],avoidWindows:[],recommendedWindows:second,planning:b} as MuhuratRow;
    expect(getMuhuratScoreEvidence(row).score).toBe(b.score);
  });
  it("ranks real same-score/same-longest dates with more actual clean minutes first",async()=>{
    const city=findCityBySlug("mumbai")!;
    const {rows}=await getMonthlyMuhurat("vehicle-purchase",2026,9,city);
    for(let i=1;i<rows.length;i++){
      const a=rows[i-1].planning,b=rows[i].planning;
      if(a.score===b.score&&a.longestWindowMinutes===b.longestWindowMinutes)
        expect(a.totalCleanMinutes).toBeGreaterThanOrEqual(b.totalCleanMinutes);
    }
  });
});
