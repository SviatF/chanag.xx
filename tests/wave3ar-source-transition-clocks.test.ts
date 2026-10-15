import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {bisectSwissRoot,eventDegrees,signedAngleDegrees,rootDisagreementTier}
  from "../lib/v6-root-clock-reconciliation";

describe("Wave 3AR direct physical Swiss-vs-JPL event clocks",()=>{
  it("recovers exact root UT with a continuous angular event function",()=>{
    const jpl=Date.parse("2027-07-17T01:00:00.000Z");
    const expectedSwiss=jpl+8*60_000+27_000;
    const model=(at:number)=>90+(at-expectedSwiss)/(86400000/0.9856);
    const result=bisectSwissRoot(90,jpl,model);
    expect(Math.abs(result.swissRootUtcMs-expectedSwiss)).toBeLessThan(100);
    expect(result.deltaSeconds).toBeCloseTo(507,1);
    expect(result.iterations).toBeGreaterThan(10);
  });
  it("works across sidereal 359→0° circular wrap",()=>{
    const jpl=Date.parse("2027-01-01T00:00:00.000Z");
    const swiss=jpl-47_000;
    const angle=(at:number)=>(360+(at-swiss)/1_000_000)%360;
    const r=bisectSwissRoot(0,jpl,angle);
    expect(Math.abs(r.deltaSeconds+47)).toBeLessThan(.1);
    expect(signedAngleDegrees(359.998,0)).toBeCloseTo(-.002,8);
    expect(signedAngleDegrees(.002,0)).toBeCloseTo(.002,8);
  });
  it("rejects a model with an unbracketed or descending event",()=>{
    expect(()=>bisectSwissRoot(30,500000,(at)=>50)).toThrow(/bracket/);
    expect(()=>bisectSwissRoot(30,500000,(at)=>40-at/60000)).toThrow(/bracket/);
    expect(()=>bisectSwissRoot(NaN,500000,()=>0)).toThrow();
  });
  it("supports JPL Tithi, moon Pada and exact zodiac boundaries",()=>{
    expect(eventDegrees(0,60)).toBe(0);
    expect(eventDegrees(59,60)).toBeCloseTo(354,9);
    expect(eventDegrees(27,108)).toBe(90);
    expect(eventDegrees(11,12)).toBe(330);
    expect(()=>eventDegrees(108,108)).toThrow();
  });
  it("separates review tiers without mistaking disagreement for an error",()=>{
    expect(rootDisagreementTier(0)).toBe("0-30s");
    expect(rootDisagreementTier(30)).toBe("0-30s");
    expect(rootDisagreementTier(31)).toBe("31-120s");
    expect(rootDisagreementTier(121)).toBe("121-300s");
    expect(rootDisagreementTier(598)).toBe("301-600s");
    expect(rootDisagreementTier(601)).toBe(">600s");
  });
  it("keeps live V5 and all ritual decisions blocked",()=>{
    const script=readFileSync("scripts/wave3ar-reconcile-jpl-swiss-event-clocks.ts","utf8");
    const triage=readFileSync("scripts/wave3ar-disagreement-triage.mjs","utf8");
    expect(script).toContain("bisectSwissRoot(");
    expect(script).toContain("independentAyanamsaSourceApproved:false");
    expect(script).toContain("fullProductionV6Released:false");
    expect(triage).toContain("mismatchesByFamily:totals");
    expect(readFileSync("lib/panchang.ts","utf8")).not.toContain("wave3ar");
    expect(readFileSync("lib/muhurat.ts","utf8")).not.toContain("wave3ar");
  });
});
