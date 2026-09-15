import {describe,expect,it} from "vitest";
import {
  forwardSpanMinutes,
  midpointMinutes,
  minutesToDialAngle,
  parseClockMinutes,
  progressThroughWindow,
} from "../lib/day-wheel-geometry";

describe("DayWheel time geometry",()=>{
  it("maps the reported Mumbai Rahu interval and NOW marker to one coordinate system",()=>{
    const start=parseClockMinutes("15:37");
    const now=parseClockMinutes("16:14");
    const end=parseClockMinutes("17:09");

    expect(start).toBe(937);
    expect(now).toBe(974);
    expect(end).toBe(1029);
    expect(forwardSpanMinutes(start!,end!)).toBe(92);
    expect(minutesToDialAngle(start!)).toBeCloseTo(125.75,6);
    expect(minutesToDialAngle(now!)).toBeCloseTo(116.5,6);
    expect(minutesToDialAngle(end!)).toBeCloseTo(102.75,6);
    expect(progressThroughWindow(now!,start!,end!)).toBeCloseTo(37/92,6);
  });

  it("places Sunrise 06:26 on its exact dial angle",()=>{
    const sunrise=parseClockMinutes("06:26");
    expect(sunrise).toBe(386);
    expect(minutesToDialAngle(sunrise!)).toBeCloseTo(263.5,6);
  });

  it("handles day/night windows that wrap through midnight",()=>{
    const sunset=parseClockMinutes("18:30")!;
    const sunrise=parseClockMinutes("06:30")!;

    expect(forwardSpanMinutes(sunset,sunrise)).toBe(720);
    expect(midpointMinutes(sunset,sunrise)).toBe(0);
  });

  it("keeps the approved cardinal clock orientation",()=>{
    expect(minutesToDialAngle(0)).toBe(0);
    expect(minutesToDialAngle(6*60)).toBe(270);
    expect(minutesToDialAngle(12*60)).toBe(180);
    expect(minutesToDialAngle(18*60)).toBe(90);
  });

  it("rejects malformed clock values",()=>{
    expect(parseClockMinutes("24:00")).toBeNull();
    expect(parseClockMinutes("06:60")).toBeNull();
    expect(parseClockMinutes("sunrise")).toBeNull();
  });
});
