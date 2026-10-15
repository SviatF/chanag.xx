import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {JPL_V6_ROOTS_ASSET_SHA256} from "../lib/jpl-v6-pinned-data";
import {getJplSiderealCandidate,type JplSiderealObservation} from "../lib/jpl-v6-sidereal-candidate";
const sample=(overrides:Partial<JplSiderealObservation>={}):JplSiderealObservation=>({
  atUtc:"2027-01-31T01:10:00.000Z",
  sunTropicalDeg:80.5,
  moonTropicalDeg:47.25,
  lahiriEffectiveDeg:24.5,
  effectiveSunMoonOffsetDisagreementArcsec:2,
  kernelSha256:"c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2",
  skyfieldVersion:"1.55",
  coordinateFrame:"geocentric apparent ecliptic and equinox of date",
  lunarRootAssetSha256:JPL_V6_ROOTS_ASSET_SHA256,
  siderealOffsetSource:"Swiss/Moshier Lahiri UT, tropical-minus-sidereal solar longitude",
  ...overrides
});
describe("Wave 3AN: JPL sidereal candidate mathematics and source guards",()=>{
  it("derives Sun/Moon Lahiri sidereal, Nakshatra, Pada, Rashi and Yoga from one offset",()=>{
    const x=getJplSiderealCandidate(sample());
    expect(x.sunSiderealDeg).toBeCloseTo(56,9);
    expect(x.moonSiderealDeg).toBeCloseTo(22.75,9);
    expect(x.nakshatra).toBe("Bharani");
    expect(x.nakshatraPada).toBe(3);
    expect(x.moonRashi).toBe("Mesha");
    expect(x.solarRashi).toBe("Vrishabha");
    expect(x.yogaLongitudeDeg).toBeCloseTo(78.75,9);
    expect(x.yoga).toBe("Atiganda");
    expect(x.publicReleaseAllowed).toBe(false);
    expect(x.fullyJplSiderealIndependentlyCertified).toBe(false);
  });
  it("identifies true near-boundary uncertainty, not an arbitrary corrected label",()=>{
    const x=getJplSiderealCandidate(sample({moonTropicalDeg:24.5001,sunTropicalDeg:24.5001}));
    expect(x.nakshatra).toBe("Ashwini");
    expect(x.nakshatraPada).toBe(1);
    expect(x.nearBoundary.map(a=>a.field)).toEqual(expect.arrayContaining([
      "Nakshatra","Nakshatra Pada","Moon Rashi","Sun Rashi","Yoga"
    ]));
    expect(x.ritualRulesCertified).toBe(false);
  });
  it("normalizes zodiac wrapping for Moon/Sun without negative signs or out of range",()=>{
    const x=getJplSiderealCandidate(sample({sunTropicalDeg:15,moonTropicalDeg:7}));
    expect(x.sunSiderealDeg).toBeCloseTo(350.5,9);
    expect(x.moonSiderealDeg).toBeCloseTo(342.5,9);
    expect(x.moonRashi).toBe("Meena");
    expect(x.solarRashi).toBe("Meena");
    expect(x.nakshatra).toBe("Uttara Bhadrapada");
    expect(x.nakshatraPada).toBeGreaterThanOrEqual(1);
    expect(x.nakshatraPada).toBeLessThanOrEqual(4);
  });
  it("rejects foreign kernels, invalid date frames and impossible Lahiri deltas",()=>{
    expect(()=>getJplSiderealCandidate(sample({kernelSha256:"untrusted" as JplSiderealObservation["kernelSha256"]}))).toThrow(/provenance/);
    expect(()=>getJplSiderealCandidate(sample({atUtc:"2027-01-31"}))).toThrow(/provenance/);
    expect(()=>getJplSiderealCandidate(sample({lahiriEffectiveDeg:0}))).toThrow(/impossible/);
    expect(()=>getJplSiderealCandidate(sample({moonTropicalDeg:NaN}))).toThrow(/Invalid JPL/);
    expect(()=>getJplSiderealCandidate(sample({effectiveSunMoonOffsetDisagreementArcsec:1000}))).toThrow(/inconsistent/);
    expect(()=>getJplSiderealCandidate(sample({coordinateFrame:"J2000" as JplSiderealObservation["coordinateFrame"]}))).toThrow(/provenance/);
  });
  it("flags inconsistent body-dependent Lahiri corrections rather than certifying",()=>{
    const x=getJplSiderealCandidate(sample({effectiveSunMoonOffsetDisagreementArcsec:95}));
    expect(x.nearBoundary.some(row=>row.field==="Lahiri cross-body offset")).toBe(true);
    expect(x.publicReleaseAllowed).toBe(false);
  });
  it("guarantees no unverified JPL-sidereal code leaks into live V5 routes",()=>{
    for(const path of ["lib/panchang.ts","lib/calendar-conventions.ts","lib/vrat.ts",
      "lib/festivals.ts","lib/muhurat.ts","app/panchang/[city]/[[...date]]/page.tsx"]){
      expect(readFileSync(path,"utf8")).not.toContain("jpl-v6-sidereal-candidate");
    }
    const y=readFileSync("scripts/wave3an-jpl-sidereal-oracle.py","utf8");
    expect(y).toContain("ecliptic_frame");
    expect(y).toContain("almanac.moon_phase");
    expect(y).toContain("KERNEL_SHA");
  });
});
