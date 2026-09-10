import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {buildRecommendedMuhuratWindows} from "../lib/muhurat";
import {getPanchang,TimeWindow} from "../lib/panchang";

function toMinutes(value:string){
  const [hours,minutes]=value.split(":").map(Number);
  return hours*60+minutes;
}

function overlaps(a:TimeWindow,b:TimeWindow){
  const aStart=toMinutes(a.start),aEnd=toMinutes(a.end);
  const bStart=toMinutes(b.start),bEnd=toMinutes(b.end);
  return aStart<bEnd&&bStart<aEnd;
}

describe("Muhurat Engine 2.0 local windows",()=>{
  it("removes Rahu Kalam, Yamaganda and Gulika from every recommended window",async()=>{
    const city=findCityBySlug("mumbai")!;
    const data=await getPanchang(new Date("2026-09-08T06:00:00Z"),city);
    const windows=buildRecommendedMuhuratWindows(data);

    expect(windows.length).toBeGreaterThan(0);

    for(const window of windows){
      expect(toMinutes(window.end)-toMinutes(window.start)).toBeGreaterThanOrEqual(15);
      expect(overlaps(window,data.rahu)).toBe(false);
      expect(overlaps(window,data.yamaganda)).toBe(false);
      expect(overlaps(window,data.gulika)).toBe(false);
      expect(window.sources.length).toBeGreaterThan(0);
    }
  });

  it("uses only favorable Panchang sources for recommended windows",async()=>{
    const city=findCityBySlug("delhi")!;
    const data=await getPanchang(new Date("2026-09-10T06:00:00Z"),city);
    const windows=buildRecommendedMuhuratWindows(data);

    const allowed=new Set([
      "Abhijit Muhurat",
      ...data.dayChoghadiya.filter(period=>period.effect==="good").map(period=>`${period.name} Choghadiya`)
    ]);

    for(const window of windows){
      for(const source of window.sources)expect(allowed.has(source)).toBe(true);
    }
  });
});
