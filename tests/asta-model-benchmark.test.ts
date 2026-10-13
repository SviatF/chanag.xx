import {describe,expect,it} from "vitest";
import {
  ASTA_MODEL_IDS,astaThresholdDegrees,eclipticLongitudeSeparationDegrees,
  greatCircleSeparationDegrees,localIstDateTimeToJulian,
  nearestAstaResidualMinutes,scanAstaModelCrossings
} from "../lib/asta-model-benchmark";

describe("Wave 3O: research-only observer model and residual safety",()=>{
  it("distinguishes spherical geometry from wrapped ecliptic longitudes",()=>{
    expect(ASTA_MODEL_IDS).toHaveLength(3);
    expect(greatCircleSeparationDegrees(120,0,120,0)).toBeCloseTo(0,6);
    expect(greatCircleSeparationDegrees(0,0,90,0)).toBeCloseTo(90,6);
    expect(eclipticLongitudeSeparationDegrees(359,1)).toBe(2);
    expect(eclipticLongitudeSeparationDegrees(1,359)).toBe(2);
    expect(eclipticLongitudeSeparationDegrees(0,180)).toBe(180);
  });
  it("retains the documented Jupiter and Venus angular threshold conventions",()=>{
    expect(astaThresholdDegrees("Jupiter",true)).toBe(11);
    expect(astaThresholdDegrees("Jupiter",false)).toBe(11);
    expect(astaThresholdDegrees("Venus",false)).toBe(10);
    expect(astaThresholdDegrees("Venus",true)).toBe(8);
  });
  it("finds and bisects physically continuous Asta entry and exit",()=>{
    // Negative margin within (2,6): entering at 2, exiting at 6.
    const events=scanAstaModelCrossings(jd=>({
      marginDegrees:(jd-2)*(jd-6),retrograde:false
    }),0,8,0.25);
    expect(events).toHaveLength(2);
    expect(events[0].kind).toBe("enter");
    expect(events[0].julian).toBeCloseTo(2,5);
    expect(events[0].quality).toBe("continuous-threshold");
    expect(events[1].kind).toBe("exit");
    expect(events[1].julian).toBeCloseTo(6,5);
    expect(nearestAstaResidualMinutes(2.1,"enter",events)).toBe(-144);
    expect(nearestAstaResidualMinutes(7,"enter",[])).toBeNull();
  });
  it("does not turn the Venus 10/8 degree station discontinuity into an exact clock",()=>{
    const events=scanAstaModelCrossings(jd=>({
      marginDegrees:jd<4?-1:1,retrograde:jd>=4
    }),3,5,0.25);
    expect(events).toHaveLength(1);
    expect(events[0].quality).toBe("station-switch-unresolved");
    expect(nearestAstaResidualMinutes(4,"exit",events)).toBeNull();
  });
  it("keeps Indian civil dates and after-midnight source clocks exact",()=>{
    const before=localIstDateTimeToJulian("2027-08-19T19:34");
    const after=localIstDateTimeToJulian("2027-08-20T00:34");
    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(Math.round((after!-before!)*1440)).toBe(300);
    expect(localIstDateTimeToJulian("2027-02-30T08:00")).toBeNull();
    expect(localIstDateTimeToJulian("2027-03-10T29:12")).toBeNull();
  });
  it("rejects broken sample intervals and non-finite coordinate sets",()=>{
    expect(()=>scanAstaModelCrossings(()=>({marginDegrees:0,retrograde:false}),2,2)).toThrow();
    expect(()=>greatCircleSeparationDegrees(NaN,0,3,0)).toThrow();
    expect(()=>eclipticLongitudeSeparationDegrees(Infinity,0)).toThrow();
  });
});
