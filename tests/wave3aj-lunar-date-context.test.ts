import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {cityBySlug} from "../lib/cities";
import {buildDailyCityContext} from "../lib/daily-city-context";
import type {Panchang} from "../lib/panchang";

const city=cityBySlug("patna");
function data(tithiEndDate:string,nakshatraEndDate:string):Panchang{
  return {
    date:"2027-01-31",sunrise:"06:40",sunset:"17:40",
    tithiEnd:"01:25",tithiEndDate,
    nakshatraEnd:"20:10",nakshatraEndDate,
    rahu:{start:"10:11",end:"11:33"},
    dayChoghadiya:[{name:"Amrit",effect:"good",start:"06:40",end:"07:50",startDayOffset:0,endDayOffset:0}],
    moonIllumination:41,rashi:"Vrishabha",solarRashi:"Makara",
  } as unknown as Panchang;
}
describe("Wave 3AJ: truthful local chronology & dated SEO prose",()=>{
  it("does not describe a next-day Tithi as opening daylight on the requested date",()=>{
    const context=buildDailyCityContext(city,data("2027-02-01","2027-01-31"));
    const tithi=context.facts.find(f=>f.label==="Tithi transition band");
    const nakshatra=context.facts.find(f=>f.label==="Nakshatra transition band");
    expect(tithi?.value).toBe("following civil date");
    expect(nakshatra?.value).toBe("after local sunset");
    expect(context.body.toLowerCase()).not.toContain("today");
    expect(context.secondaryBody.toLowerCase()).not.toContain("today");
  });
  it("refuses to recast an impossible before-sunrise clock as morning daylight",()=>{
    const context=buildDailyCityContext(city,data("2027-01-31","2027-01-31"));
    expect(context.facts.find(f=>f.label==="Tithi transition band")?.value)
      .toBe("before sunrise (requires source review)");
  });
  it("keeps visible and JSON-LD FAQ scoped to selected date instead of today",()=>{
    const source=readFileSync("app/panchang/[city]/[[...date]]/page.tsx","utf8");
    expect(source).toContain("What is Rahu Kalam in ${city.name} on ${data.date}?");
    expect(source).toContain("What is the sunrise Tithi in ${city.name} on ${data.date}?");
    expect(source).not.toContain("What is today's Tithi");
    expect(source).not.toContain("Auspicious today for");
    expect(source).not.toContain("Avoid today");
    for(const path of ["lib/daily-city-context.ts","lib/daily-content-engine.ts","lib/day-guidance.ts"]){
      expect(readFileSync(path,"utf8").toLowerCase()).not.toContain("today");
    }
  });
});
