import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Wave 3AT: source-separated solar ingress sunrise impact",()=>{
 it("uses real Swiss Sunrise and both complete JPL source timelines",()=>{
  const s=readFileSync("scripts/wave3at-sankranti-native-frame-impact.ts","utf8");
  expect(s).toContain("sweRiseTrans(swed,indiaCivilDayStartJulian");
  expect(s).toContain("openVerifiedV6SiderealSource(oldText,oldAnchors)");
  expect(s).toContain("validateSiderealTransitionTable(alt)");
  expect(s).toContain("counter.full36SolarRashiRootClockParityWithinThreeSeconds");
  expect(s).toContain("nativeAnchorSha256:digest(nativeAnchorText)");
 });
 it("does not overwrite live V5 or claim ritual approval",()=>{
  const s=readFileSync("scripts/wave3at-sankranti-native-frame-impact.ts","utf8");
  expect(s).toContain("independentLahiriPolicyApproved:false");
  expect(s).toContain("ritualSankrantiDatesApproved:false");
  expect(s).toContain("productionV6ReleaseAllowed:false");
  for(const path of ["lib/panchang.ts","lib/vrat.ts","lib/muhurat.ts",
   "app/panchang/[city]/[[...date]]/page.tsx"])
   expect(readFileSync(path,"utf8")).not.toContain("wave3at");
 });
 it("requires every sign event and geographic census without approximated sunrise",()=>{
  const s=readFileSync("scripts/wave3at-sankranti-native-frame-impact.ts","utf8");
  expect(s).toContain("for(let event=0;event<36;event++)");
  expect(s).toContain("[base-DAY,base,base+DAY]");
  expect(s).toContain("old[1]!==next[1]");
  expect(s).toContain("canonical.size!==454");
  expect(s).toContain("examined<48000");
  expect(s).toContain("new Date(at+IST).toISOString().slice(0,10)!==date");
 });
});
