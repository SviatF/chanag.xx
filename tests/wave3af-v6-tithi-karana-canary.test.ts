import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
  validateJplHalfTithiTable,jplHalfTithiAtMs,jplHalfTithiForDate,
  type JplHalfTithiTable
} from "../lib/jpl-v6-tithi-karana-canary";

const KNOWN_SHA="c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2";
/** Synthetic structural fixture: NOT a JPL ephemeris and NOT a date oracle. */
function fixture():JplHalfTithiTable{
  const start=Date.parse("2024-12-15T00:00:00.000Z");
  return {
    wave:"3AF",ephemeris:"JPL DE440s",skyfieldVersion:"1.55",
    kernelSha256:KNOWN_SHA,coverageStartUtc:"2024-12-15T00:00:00Z",
    coverageEndUtc:"2031-01-15T00:00:00Z",
    halfTithiBoundaryCount:4800,
    halfTithiTransitions:Array.from({length:4800},(_,i)=>
      [start+i*41_400_000,i%60] as const),
    canaryOnly:true,ritualSelectionCertified:false
  };
}
describe("Wave 3AF V6 read-only JPL half-Tithi and Karana canary",()=>{
  it("validates provenance, half-phase order and complete 2025–2030 date envelope",()=>{
    const f=fixture();
    expect(validateJplHalfTithiTable(f)).toBe(f);
    expect(()=>validateJplHalfTithiTable({...f,kernelSha256:"not JPL"})).toThrow();
    expect(()=>validateJplHalfTithiTable({...f,ritualSelectionCertified:true})).toThrow();
    expect(()=>validateJplHalfTithiTable({...f,halfTithiBoundaryCount:1})).toThrow();
    expect(()=>validateJplHalfTithiTable({...f,halfTithiTransitions:
      f.halfTithiTransitions.map((x,i)=>i===200?[x[0],x[1]+3] as const:x)})).toThrow();
    expect(()=>validateJplHalfTithiTable({...f,halfTithiTransitions:
      f.halfTithiTransitions.map((x,i)=>i===200?[x[0]-18_000_000,x[1]] as const:x)})).toThrow();
  });
  it("never mistakes first and second half of a Tithi for the next boundary",()=>{
    const f=validateJplHalfTithiTable(fixture());
    const roots=f.halfTithiTransitions;
    // Synthetic index 120 ≡ 0 (first half); Tithi ends at index 122.
    const early=jplHalfTithiAtMs(f,roots[120][0]+1);
    expect(early.halfPhaseIndex).toBe(0);
    expect(early.tithiIndex).toBe(0);
    expect(early.karanaIndex).toBe(0);
    expect(early.nextKaranaBoundaryUtc).toBe(new Date(roots[121][0]).toISOString());
    expect(early.nextTithiBoundaryUtc).toBe(new Date(roots[122][0]).toISOString());
    // Index 121 ≡ 1 (second half); both next Tithi and Karana end at 122.
    const late=jplHalfTithiForDate(f,new Date(roots[121][0]+1000));
    expect(late.halfPhaseIndex).toBe(1);
    expect(late.tithiIndex).toBe(0);
    expect(late.nextTithiBoundaryUtc).toBe(new Date(roots[122][0]).toISOString());
    expect(late.nextKaranaBoundaryUtc).toBe(late.nextTithiBoundaryUtc);
    expect(late.approvedRitualFast).toBe(false);
    expect(late.approvedCeremony).toBe(false);
  });
  it("fails closed for dates outside transition-table coverage",()=>{
    const f=fixture();
    expect(()=>jplHalfTithiAtMs(f,f.halfTithiTransitions[0][0]-1)).toThrow();
    expect(()=>jplHalfTithiAtMs(f,f.halfTithiTransitions.at(-1)![0]+1)).toThrow();
    expect(()=>jplHalfTithiAtMs(f,NaN)).toThrow();
    expect(()=>jplHalfTithiForDate(f,new Date("invalid"))).toThrow();
  });
  it("requires actual JPL numeric phase generation plus every supported city-day in CI",()=>{
    const gen=readFileSync("scripts/wave3af-build-jpl-tithi-table.py","utf8");
    expect(gen).toContain("almanac.moon_phase");
    expect(gen).toContain("kernel.read_bytes()");
    expect(gen).toContain("EXPECTED_KERNEL_SHA");
    expect(gen).toContain("halfTithiTransitions");
    expect(gen).toContain("np.floor(phase/6)");
    expect(gen).toContain("idx[crossing+1]");
    const audit=readFileSync("scripts/wave3af-dynamic-all-city-days-v6-canary.ts","utf8");
    expect(audit).toContain("for(const city of cityList)");
    expect(audit).toContain("localDayMidnight<END");
    expect(audit).toContain("supportedCities");
    expect(audit).toContain("sweRiseTrans");
    expect(audit).toContain("jplHalfTithiAtMs");
    expect(audit).toContain("maxNOAAErrorSeconds");
    expect(audit).toContain("checkedApproximateSunriseErrorMaxSeconds");
    expect(audit).toContain("productionPanchangStillV5:true");
    expect(audit).toContain("muhuratSnapshotsStillV5:true");
    const ci=readFileSync(".github/workflows/quality.yml","utf8");
    expect(ci).toContain("wave3af-build-jpl-tithi-table.py");
    expect(ci).toContain("npm run audit:jpl-v6-all-dynamic-city-days");
    expect(ci).toContain("wave3af-v6-global-jpl-tithi-karana-and-dynamic-impact");
    for(const source of ["lib/panchang.ts","lib/vrat.ts","lib/muhurat.ts","lib/festivals.ts"]){
      expect(readFileSync(source,"utf8")).not.toContain("jpl-v6-tithi-karana-canary");
    }
  });
});
