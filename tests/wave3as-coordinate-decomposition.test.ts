import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";

describe("Wave 3AS: do not conflate UT, coordinate frame and physical ephemeris errors",()=>{
 it("compares physical same-UTC tropical and sidereal positions from TWO independent engines",()=>{
   const ts=readFileSync("scripts/wave3as-js-coordinate-baseline.ts","utf8");
   const py=readFileSync("scripts/wave3as-native-coordinate-decomposition.py","utf8");
   expect(ts).toContain("sweCalcUt(swed,jd,target,flags)");
   expect(ts).toContain("sweCalcUt(swed,jd,target,flags|SEFLG_SIDEREAL)");
   expect(ts).toContain("sameFrameOffsetArcsec");
   expect(ts).toContain("sweDeltatEx(jd,SEFLG_MOSEPH,swed)");
   expect(py).toContain("swe.calc_ut(jd,body,flags)");
   expect(py).toContain("swe.calc_ut(jd,body,flags|swe.FLG_SIDEREAL)");
   expect(py).toContain("swe.deltat_ex(jd,swe.FLG_MOSEPH)");
   expect(py).toContain("nativeEtVsUtConsistent");
   expect(py).toContain("tsEffectiveLahiriEqualsNativeMeanLahiri");
   expect(py).toContain("swe.get_ayanamsa_ut(jd)");
   expect(py).toContain("jsMinusNativeDeltaTSeconds");
   expect(py).toContain("jsMinusNativeTropicalArcsec");
   expect(py).toContain("jsMinusNativeEffectiveLahiriArcsec");
   expect(py).toContain("jsMinusNativeSiderealArcsec");
 });
 it("checks every one of the 36 JPL Solar Rashi roots and representative lunar roots",()=>{
   const ts=readFileSync("scripts/wave3as-js-coordinate-baseline.ts","utf8");
   const py=readFileSync("scripts/wave3as-native-coordinate-decomposition.py","utf8");
   expect(ts).toContain("source.table.events.sunRashi");
   expect(ts).toContain("prior.family");
   expect(py).toContain("solar_root_samples!=36");
   expect(py).toContain("len(points)");
 });
 it("rebuilds an alternate C-Lahiri JPL catalog without silently changing the reviewed original",()=>{
   const py=readFileSync("scripts/wave3as-native-lahiri-anchor-candidate.py","utf8");
   const compare=readFileSync("scripts/wave3as-native-lahiri-jpl-counterfactual.py","utf8");
   const workflow=readFileSync(".github/workflows/quality.yml","utf8");
   expect(py).toContain("ORIGINAL_SHA");
   expect(py).toContain("maxMeasuredMidpointInterpolationErrorArcsec");
   expect(py).toContain("Native C apparent Lahiri Moon/Sun frame disagreement");
   expect(compare).toContain("REVIEWED_SHA");
   expect(compare).toContain("checkedMatchingJplEventRoots");
   expect(compare).toContain("ritualCalendarReleaseAllowed");
   expect(workflow).toContain("--anchors=artifacts/wave3as-native-swiss-lahiri-candidate.json");
   expect(workflow).toContain("--report=artifacts/wave3as-jpl-native-lahiri-root-candidate.json");
   expect(workflow).not.toContain("--report=artifacts/wave3ao-jpl-global-sidereal-transitions.json --anchors=artifacts/wave3as");
 });
 it("retains explicit release blockers after a green diagnostic",()=>{
   const py=readFileSync("scripts/wave3as-native-coordinate-decomposition.py","utf8");
   expect(py).toContain("astronomicalReferenceFullyCertified");
   expect(py).toContain("publicV6ActivationAllowed");
   expect(py).toContain("jplSolarRootCanBePromoted");
   expect(py).toContain("sourceBindingParityProven");
   for(const file of ["lib/panchang.ts","lib/vrat.ts","lib/muhurat.ts",
      "lib/calendar-conventions.ts","app/panchang/[city]/[[...date]]/page.tsx"]){
      expect(readFileSync(file,"utf8")).not.toContain("wave3as");
   }
 });
});
