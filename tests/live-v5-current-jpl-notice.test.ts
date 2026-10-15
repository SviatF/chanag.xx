import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {criticalBoundaryNotice} from "../lib/critical-boundary-notices";
describe("public V5 independent JPL evidence check",()=>{
  it("uses current independent-source exact-second evidence for Patna and Lucknow",()=>{
    const script=readFileSync("scripts/live-v5-astronomy-audit.mjs","utf8");
    for(const [city,date,clock] of [
      ["patna","2027-01-31","JPL DE440s 06:34:15.581"],
      ["lucknow","2027-09-17","JPL DE440s computes the transition at 05:52:18.899"]
    ]){
      const notice=criticalBoundaryNotice(city,date);
      expect(notice).not.toBeNull();
      expect(notice!.summary).toContain(clock);
      expect(script).toContain("notice:"+JSON.stringify(clock));
    }
    expect(script).not.toContain("Navami changes to Dashami");
    expect(script).not.toContain("Pratipada ends around Lucknow sunrise");
  });
  it("requires explicit rendered sunrise-source disclosure, not a generic word elsewhere",()=>{
    const s=readFileSync("scripts/live-v5-astronomy-audit.mjs","utf8");
    expect(s).toContain("Sunrise Tithi source review");
    expect(s).toContain("sourcePanel");
    expect(s).toContain("visiblePanel.includes(check.notice.toLowerCase())");
    expect(s).toContain('if(strict&&report.failed)process.exitCode=1');
  });
});
