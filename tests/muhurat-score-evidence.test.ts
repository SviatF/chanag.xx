import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {getMuhuratScoreEvidence} from "../lib/muhurat-score-evidence";
import {buildMuhuratPlanningScore,type MuhuratRow} from "../lib/muhurat";
function row(date:string,windows:MuhuratRow["recommendedWindows"]):MuhuratRow{
  return {date,data:{} as never,recommendedWindows:windows,avoidWindows:[],reasons:["Panchami Tithi","Hasta Nakshatra"],
    planning:buildMuhuratPlanningScore("vehicle-purchase",windows)};
}
describe("Muhurat score evidence is a verifiable planning metric, not religious certification",()=>{
  it("reconstructs all four weighted components for a clean candidate",()=>{
    const candidate=row("2026-10-05",[{start:"10:00",end:"11:00",sources:["Shubh Choghadiya","Abhijit Muhurat"]}]);
    const detail=getMuhuratScoreEvidence(candidate);
    expect(detail).toEqual(expect.objectContaining({continuity:40,availability:25,sourceDiversity:10,abhijit:15,score:90}));
    expect(detail.summary).toContain("90/100 window-availability score");
    expect(detail.summary).toContain("30-minute target");
  });
  it("does not reward an unsupported clock when zero valid windows survive",()=>{
    const candidate=row("2026-10-07",[]);
    const detail=getMuhuratScoreEvidence(candidate);
    expect(detail.score).toBe(0);
    expect(candidate.planning.grade).toBe("Limited");
  });
  it("fails if a published score and its actual source metrics disagree",()=>{
    const candidate=row("2026-10-09",[{start:"09:30",end:"10:10",sources:["Amrit Choghadiya"]}]);
    candidate.planning.score+=5;
    expect(()=>getMuhuratScoreEvidence(candidate)).toThrow(/score mismatch/);
  });
  it("does not claim sunrise match proves every later hour lunar-qualified",()=>{
    for(const file of ["app/muhurat/[event]/[year]/[month]/page.tsx","app/muhurat/[event]/[year]/[month]/[city]/page.tsx"]){
      const source=readFileSync(file,"utf8");
      expect(source).toContain("Tithi and Nakshatra were screened at sunrise");
      expect(source).toContain("not verified at each listed clock time");
      expect(source).toContain("getMuhuratScoreEvidence");
      expect(source).not.toContain("muhuratScreeningStatement");
    }
  });
});
