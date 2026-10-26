import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {cityBySlug} from "../lib/cities";
import {buildRecommendedMuhuratWindows,buildMuhuratPlanningScore,getMonthlyMuhurat,muhuratRules} from "../lib/muhurat";
import {getPrecomputedMuhuratPanchangMonth} from "../lib/muhurat-precomputed";
import {boundMuhuratWindowsByLunarTransitions} from "../lib/muhurat-lunar-transitions";
import {screenWeddingVishtiKarana} from "../lib/muhurat-wedding-karana";
import {buildMuhuratMonthlyQualityContent} from "../lib/muhurat-content-engine";

describe("DATA-04: never rank a real city/date with zero surviving local Muhurat reference windows",()=>{
  it("reconciles every actual Mumbai lunar-matched date with retained-window and excluded sets",async()=>{
    const city=cityBySlug("mumbai");
    const source=await getPrecomputedMuhuratPanchangMonth(2026,5,city);
    expect(source).not.toBeNull();
    for(const event of ["wedding","vehicle-purchase"] as const){
      const rule=muhuratRules[event];
      const result=await getMonthlyMuhurat(event,2026,5,city);
      const sunriseMatched=source!.filter(day=>rule.goodTithi.includes(day.tithi)&&rule.goodNakshatra.includes(day.nakshatra));
      expect(result.lunarMatchedDays).toBe(sunriseMatched.length);
      expect(result.rows.length+result.screenedWithoutWindowDates.length).toBe(sunriseMatched.length);
      expect(result.screenedWithoutWindowRows.map(r=>r.date)).toEqual(result.screenedWithoutWindowDates);
      expect(result.screenedWithoutWindowRows.every(r=>r.recommendedWindows.length===0&&r.planning.score===0)).toBe(true);
      const expectedRejected:string[]=[];
      for(const data of sunriseMatched){
        const lunar=boundMuhuratWindowsByLunarTransitions(data,buildRecommendedMuhuratWindows(data));
        const resultWindow=event==="wedding"?screenWeddingVishtiKarana(data,lunar.windows).windows:lunar.windows;
        if(!resultWindow.length)expectedRejected.push(data.date);
      }
      expect(result.screenedWithoutWindowDates).toEqual(expectedRejected);
      const returned=new Set(result.rows.map(row=>row.date));
      for(const date of result.screenedWithoutWindowDates)expect(returned.has(date)).toBe(false);
      for(const row of result.rows){
        expect(row.recommendedWindows.length).toBeGreaterThan(0);
        expect(row.planning.score).toBeGreaterThan(0);
        expect(row.planning.longestWindowMinutes).toBeGreaterThanOrEqual(15);
      }
    }
  });
  it("proves an early-ending favorable sunrise lunar state can have no daytime window",()=>{
    const data={
      date:"2026-05-06",
      tithiEnd:"07:30",tithiEndDate:"2026-05-06",
      nakshatraEnd:"07:40",nakshatraEndDate:"2026-05-06"
    };
    const reference=[{start:"09:00",end:"10:00",sources:["Shubh Choghadiya"]}];
    const lunar=boundMuhuratWindowsByLunarTransitions(data,reference);
    expect(lunar.status).toBe("lunar-bounded");
    expect(lunar.windows).toEqual([]);
    const score=buildMuhuratPlanningScore("vehicle-purchase",lunar.windows);
    expect(score.score).toBe(0);
    // Never feed a 0-minute pseudo Muhurat into ranked candidate cards.
    const copy=buildMuhuratMonthlyQualityContent("vehicle-purchase",2026,5,cityBySlug("mumbai"),[],"city",1);
    expect(copy.directAnswer).toContain("1 date matched the sunrise lunar screen");
    expect(copy.directAnswer).toContain("no retained daytime reference window");
    expect(copy.directAnswer).not.toContain("no candidate date");
    expect(copy.rankingBody).toContain("no artificial #1");
  });
  it("keeps no sunrise match distinct from an excluded sunrise match",()=>{
    const city=cityBySlug("mumbai");
    const none=buildMuhuratMonthlyQualityContent("wedding",2026,5,city,[],"city",0);
    expect(none.directAnswer).toContain("no candidate date");
    const excluded=buildMuhuratMonthlyQualityContent("wedding",2026,5,city,[],"city",2);
    expect(excluded.directAnswer).toContain("2 dates matched the sunrise lunar screen");
    expect(excluded.rankingBody).toContain("not a conclusion that every traditional ceremony Muhurat is unavailable");
    expect(()=>buildMuhuratMonthlyQualityContent("wedding",2026,5,city,[],"city",-1)).toThrow("Invalid rejected-window");
  });
  it("connects Mumbai baseline and every local city Muhurat page to the excluded-day facts",()=>{
    for(const path of ["app/muhurat/[event]/[year]/[month]/page.tsx","app/muhurat/[event]/[year]/[month]/[city]/page.tsx"]){
      const text=readFileSync(path,"utf8");
      expect(text).toContain("screenedWithoutWindowDates.length");
      expect(text).toContain("SUNRISE MATCHES EXCLUDED FROM TIMING RANK");
      expect(text).toContain("No date retained a qualifying daytime reference window");
    }
  });
});
