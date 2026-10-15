import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {nearestExactRoot,sourceLabelsAreAdjacent,daysInGregorianYear} from "../lib/v6-exhaustive-sunrise-evidence";

describe("Wave 3AQ true sunrise exhaustive census boundary evidence",()=>{
  it("uses exact preceding/next event, including the instant of transition",()=>{
    const rows=[[1000,0],[2000,1],[5000,2]] as const;
    expect(nearestExactRoot(rows,1500)).toEqual({
      distanceMs:500,previous:1000,next:2000
    });
    expect(nearestExactRoot(rows,2000)).toEqual({
      distanceMs:0,previous:2000,next:5000
    });
    expect(nearestExactRoot(rows,500)).toEqual({
      distanceMs:500,previous:null,next:1000
    });
    expect(nearestExactRoot(rows,5500)).toEqual({
      distanceMs:500,previous:5000,next:null
    });
    expect(()=>nearestExactRoot([],1000)).toThrow();
    expect(()=>nearestExactRoot(rows,NaN)).toThrow();
  });
  it("recognizes adjacent model disagreements through Tithi and Rashi wrapping",()=>{
    expect(sourceLabelsAreAdjacent(59,0,60)).toBe(true);
    expect(sourceLabelsAreAdjacent(0,59,60)).toBe(true);
    expect(sourceLabelsAreAdjacent(11,0,12)).toBe(true);
    expect(sourceLabelsAreAdjacent(2,2,27)).toBe(false);
    expect(sourceLabelsAreAdjacent(1,7,27)).toBe(false);
    expect(()=>sourceLabelsAreAdjacent(27,1,27)).toThrow();
  });
  it("requires 365+365+366 Gregorian India date samples per unique city",()=>{
    expect(daysInGregorianYear(2026)).toBe(365);
    expect(daysInGregorianYear(2027)).toBe(365);
    expect(daysInGregorianYear(2028)).toBe(366);
    expect([2026,2027,2028].reduce((n,y)=>n+daysInGregorianYear(y),0)).toBe(1096);
    expect(()=>daysInGregorianYear(2029)).toThrow();
  });
  it("uses actual same Swiss upper-limb sunrise daily, not a NOAA approximation screen",()=>{
    const script=readFileSync("scripts/wave3aq-exhaustive-sunrise.ts","utf8");
    expect(script).toContain("sweRiseTrans(swed,indiaCivilDayStartJulian");
    expect(script).toContain("jplHalfTithiAtMs(half,ms)");
    expect(script).toContain("siderealStateAtUtc(source.table,new Date(ms).toISOString())");
    expect(script).toContain("openVerifiedV6SiderealSource(catalog,lahiri)");
    expect(script).toContain("NOAAApproximationUsed:false");
    expect(script).not.toContain("approximateSunriseIST(");
    expect(script).toContain("productionV6ActivationDenied:productionDenied");
  });
  it("enforces the final year-specific complete census and preserves SEO and V5",()=>{
    const code=readFileSync("scripts/wave3aq-exhaustive-sunrise.ts","utf8");
    expect(code).toContain("exactSunrises!==expected");
    expect(code).toContain("referenceChecks!==cities.length");
    expect(code).toContain("fullSwissModelComparisonAllDays:false");
    expect(code).toContain("swissComparedOutsideRisk");
    expect(readFileSync("lib/panchang.ts","utf8")).not.toContain("wave3aq");
    expect(readFileSync("lib/muhurat.ts","utf8")).not.toContain("wave3aq");
  });
});
