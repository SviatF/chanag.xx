import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {validateSiderealTransitionTable,siderealStateAtUtc,
  type JplSiderealTransitionTable} from "../lib/jpl-v6-sidereal-transitions";
const kernel="c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2";
const roots="0cab0c6accaf2e2125fe417bf4a4f14a22453a4013a1609dce6dce84ec44142e";
const low=Date.parse("2026-01-01T00:00:00.000Z");
const high=Date.parse("2029-01-01T00:00:00.000Z");
const distribute=(count:number,modulus:number)=>Array.from({length:count},
  (_,i)=>[Math.round(low+(i+1)*(high-low)/(count+1)),(i+1)%modulus] as [number,number]);
function fixture(){
  const moonPada=distribute(4332,108);
  const nakshatra=moonPada.filter(([,idx])=>idx%4===0)
    .map(([ms,idx])=>[ms,idx/4] as [number,number]);
  const family=(modulus:number,count:number)=>distribute(count,modulus);
  return {
    wave:"3AO",schema:1,status:"research-only",
    coverageStartUtc:"2026-01-01T00:00:00.000Z",
    coverageEndUtc:"2029-01-01T00:00:00.000Z",
    years:[2026,2027,2028],
    solarLunarKernelSha256:kernel,lunarRootSourceSha256:roots,
    lahiriAnchorSha256:"a".repeat(64),maxMeasuredAnchorMidpointErrorArcsec:0.1,
    fullIndependentAyanamsaApproved:false,ritualSelectionCertified:false,
    productionSwitchAllowed:false,
    events:{moonPada,nakshatra,yoga:family(27,1164),
      moonRashi:family(12,481),sunRashi:family(12,36)}
  } as JplSiderealTransitionTable;
}
describe("Wave 3AO: fail-closed global sidereal transitions",()=>{
  it("validates all families and does precise UTC root binary lookup",()=>{
    const table=validateSiderealTransitionTable(fixture());
    const first=table.events.moonPada[0][0];
    const old=siderealStateAtUtc(table,new Date(first-1).toISOString());
    const now=siderealStateAtUtc(table,new Date(first).toISOString());
    expect(old.moonPada.index).toBe(0);
    expect(now.moonPada.index).toBe(1);
    expect(now.nakshatra.index).toBe(0);
    expect(now.nakshatraPada).toBe(2);
    expect(now.moonPada.nextTransitionUtc).toBe(new Date(table.events.moonPada[1][0]).toISOString());
    expect(now.productionReleaseAllowed).toBe(false);
  });
  it("blocks forged JPL kernel/root source, missing validation and production approval",()=>{
    const valid=fixture();
    expect(()=>validateSiderealTransitionTable({...valid,solarLunarKernelSha256:"bad"})).toThrow(/source hash/);
    expect(()=>validateSiderealTransitionTable({...valid,productionSwitchAllowed:true})).toThrow(/release gate/);
    expect(()=>validateSiderealTransitionTable({...valid,ritualSelectionCertified:true})).toThrow();
    expect(()=>validateSiderealTransitionTable({...valid,lahiriAnchorSha256:"short"})).toThrow();
    expect(()=>validateSiderealTransitionTable({...valid,maxMeasuredAnchorMidpointErrorArcsec:1.5})).toThrow();
    expect(()=>validateSiderealTransitionTable({})).toThrow();
  });
  it("rejects missing transitions, skipped indices and divergent nakshatra/pada roots",()=>{
    const corrupt=fixture();
    corrupt.events.yoga[3][1]=13;
    expect(()=>validateSiderealTransitionTable(corrupt)).toThrow(/Skipped/);
    const lost=fixture();
    lost.events.nakshatra.pop();
    expect(()=>validateSiderealTransitionTable(lost)).toThrow(/shared JPL/);
    const truncated=fixture();
    truncated.events.yoga=truncated.events.yoga.slice(0,20);
    expect(()=>validateSiderealTransitionTable(truncated)).toThrow(/Incomplete/);
    const unordered=fixture();
    unordered.events.moonRashi[1][0]=unordered.events.moonRashi[0][0];
    expect(()=>validateSiderealTransitionTable(unordered)).toThrow(/Unordered/);
  });
  it("does not extrapolate beyond supported 2026–2028 range",()=>{
    const table=validateSiderealTransitionTable(fixture());
    expect(()=>siderealStateAtUtc(table,"2029-01-01T00:00:00.000Z")).toThrow(/outside/);
    expect(()=>siderealStateAtUtc(table,"2025-12-31T23:59:00.000Z")).toThrow(/outside/);
    expect(()=>siderealStateAtUtc(table,"invalid")).toThrow(/outside/);
  });
  it("proves global transition producer uses source-checked JPL with interpolated Lahiri",()=>{
    const python=readFileSync("scripts/wave3ao-build-sidereal-transitions.py","utf8");
    expect(python).toContain("KERNEL_SHA");
    expect(python).toContain("ecliptic_frame");
    expect(python).toContain("25");
    expect(python).toContain("coarse");
    const ts=readFileSync("scripts/wave3ao-lahiri-anchors.ts","utf8");
    expect(ts).toContain("maxMidpointArcsec");
    expect(ts).toContain("SE_SIDM_LAHIRI");
    for(const path of ["lib/panchang.ts","lib/vrat.ts","lib/muhurat.ts",
      "app/panchang/[city]/[[...date]]/page.tsx"]){
      expect(readFileSync(path,"utf8")).not.toContain("jpl-v6-sidereal-transitions");
    }
  });
});
