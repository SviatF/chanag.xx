import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {compareSunriseConventions} from "../lib/sunrise-convention-differential";
import {independentAstronomicalCheck,independentTithiIndexAt} from "../lib/wave3ac-independent-astronomy";

describe("Wave 3AC real independent Sun/Moon calculation and release boundaries",()=>{
  it("calculates real Patna 2027 288° phase event and independently derived rise",()=>{
    const city=cityBySlug("patna"),date="2027-01-31";
    const alt=independentAstronomicalCheck(city,date);
    const swiss=compareSunriseConventions(city,date);
    expect(alt.sourceIndependentOfSwissEphemeris).toBe(true);
    expect(alt.comparisonUsesSwissEphemeris).toBe(false);
    expect(alt.library).toBe("astronomy-engine");
    expect(alt.lunarTheory).toContain("Brown");
    expect(alt.independentRise.ist.startsWith(date)).toBe(true);
    expect(alt.independentBoundaryChronologyValid).toBe(true);
    expect(alt.independentPhase288Boundary).not.toBeNull();
    expect(alt.phaseDegreesAtBoundary).toBeCloseTo(288,1);
    expect(Math.abs(alt.independentRise.unixMs-Date.parse(swiss.defaultApparentUpperLimb.sunrise.utc))).toBeLessThan(900_000);
    expect(Math.abs(alt.independentPhase288Boundary!.unixMs-
      Date.parse(swiss.defaultApparentUpperLimb.previousTithiEnds.utc))).toBeLessThan(3_600_000);
    expect(alt.certifiedPujaFastOrParana).toBe(false);
    expect(alt.safeToChangeProduction).toBe(false);
    expect(alt.calibratedAbsoluteAstrometricAccuracy).toBe(false);
  },20_000);
  it("can independently calculate phase at an arbitrary UT instant without Swiss state",()=>{
    for(const d of ["2026-05-26T00:00:00.000Z","2027-01-31T01:00:00.000Z","2027-10-25T00:00:00.000Z"]){
      const tithi=independentTithiIndexAt(new Date(d));
      expect(tithi).toBeGreaterThanOrEqual(0);
      expect(tithi).toBeLessThan(30);
    }
    expect(()=>independentAstronomicalCheck(cityBySlug("patna"),"2027-02-29"))
      .toThrow(/Invalid ISO/);
  });
  it("does not import the independent model into runtime Panchang, Muhurat, Vrat or festival selectors",()=>{
    const pn=readFileSync("package.json","utf8");
    const pkg=JSON.parse(pn);
    expect(pkg.devDependencies["astronomy-engine"]).toBe("2.1.19");
    expect(pkg.dependencies["astronomy-engine"]).toBeUndefined();
    expect(pkg.scripts["audit:independent-astronomy"]).toContain("wave3ac-independent-ephemeris-compare.ts");
    const workflow=readFileSync(".github/workflows/quality.yml","utf8");
    expect(workflow).toContain("npm run audit:independent-astronomy");
    expect(workflow).toContain("wave3ac-independent-astronomy-evidence");
    const audit=readFileSync("scripts/wave3ac-independent-ephemeris-compare.ts","utf8");
    expect(audit).toContain("astronomicalEngineChanged:false");
    expect(audit).toContain("PatnaSourceConflictClosed:false");
    expect(audit).toContain("certifiedISKCONFasts:0");
    for(const source of ["lib/panchang.ts","lib/vrat.ts","lib/muhurat.ts","lib/festivals.ts","lib/seo-policy.ts"]){
      expect(readFileSync(source,"utf8")).not.toContain("wave3ac-independent-astronomy");
      expect(readFileSync(source,"utf8")).not.toContain("astronomy-engine");
    }
  });
});
