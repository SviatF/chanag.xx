import {describe,expect,it} from "vitest";
import {festivalBySlugYear,festivalsForYear} from "../lib/festivals";
import {buildFestivalAnnualQualityContext,buildFestivalYearQualityContext} from "../lib/festival-parent-quality";

function words(value:string){return value.trim().split(/\s+/).filter(Boolean).length;}

describe("festival parent mass-content quality",()=>{
  it("makes the annual festival calendar a substantive analytical pillar",()=>{
    const festivals=festivalsForYear(2026);
    const context=buildFestivalAnnualQualityContext(2026,festivals);
    const combined=[context.directAnswer,context.overviewBody,context.distributionBody,context.chronologyBody,context.planningBody].join(" ");
    expect(festivals.length).toBeGreaterThan(10);
    expect(words(combined)).toBeGreaterThan(180);
    expect(context.facts.length).toBeGreaterThanOrEqual(6);
    expect(context.chronologyBody).toContain("Makar Sankranti");
    expect(context.chronologyBody).toContain("Diwali");
  });

  it("builds materially different festival-year parent intelligence from real Panchang data",async()=>{
    const diwali=festivalBySlugYear("diwali",2026);
    const hanuman=festivalBySlugYear("hanuman-jayanti",2026);
    expect(diwali).toBeTruthy();
    expect(hanuman).toBeTruthy();
    const [left,right]=await Promise.all([
      buildFestivalYearQualityContext(diwali!),
      buildFestivalYearQualityContext(hanuman!),
    ]);
    const leftText=[left.directAnswer,left.contextBody,left.lunarBody,left.cityVariationBody,left.observanceBody].join(" ");
    const rightText=[right.directAnswer,right.contextBody,right.lunarBody,right.cityVariationBody,right.observanceBody].join(" ");
    expect(words(leftText)).toBeGreaterThan(180);
    expect(words(rightText)).toBeGreaterThan(180);
    expect(left.lunarBody).not.toBe(right.lunarBody);
    expect(left.observanceBody).not.toBe(right.observanceBody);
    expect(left.facts.map(item=>item.value).join("|")).not.toBe(right.facts.map(item=>item.value).join("|"));
  },20000);
});
