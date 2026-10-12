import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {buildMuhuratMonthlyQualityContent} from "../lib/muhurat-content-engine";
import type {MuhuratRow} from "../lib/muhurat";

const city=findCityBySlug("pune")!;
function row(date:string,score:number):MuhuratRow{
  return {date,data:{} as never,recommendedWindows:[{start:"09:00",end:"10:00",sources:["Shubh Choghadiya"]}],avoidWindows:[],reasons:["Panchami Tithi","Rohini Nakshatra"],planning:{score,grade:"Strong",totalCleanMinutes:60,longestWindowMinutes:60,sourceCount:1,hasAbhijit:false,idealContinuousMinutes:30,factors:[]}};
}

describe("Muhurat factual ranking language",()=>{
  it("does not invent score gaps for equal top scores",()=>{
    const candidates=[row("2026-10-05",82),row("2026-10-12",82),row("2026-10-18",70),row("2026-10-22",66),row("2026-10-28",60)];
    for(let n=2;n<=5;n++){
      const copy=buildMuhuratMonthlyQualityContent("vehicle-purchase",2026,10,city,candidates.slice(0,n));
      expect(copy.rankingBody).toContain("tied at 82/100");
      expect(copy.directAnswer).toContain("shares the top score");
      expect(copy.rankingBody).not.toMatch(/leads? .* by 0 point|0-point gap/i);
    }
  });
  it("identifies a genuine lead when scores differ",()=>{
    const copy=buildMuhuratMonthlyQualityContent("vehicle-purchase",2026,10,city,[row("2026-10-05",82),row("2026-10-12",74)]);
    expect(copy.rankingBody).toContain("leads 2026-10-12 by 8 points");
  });
});
