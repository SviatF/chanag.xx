import {describe,expect,it} from "vitest";
import {
  centeredClockwiseWedge,
  clockwiseWedgeForTimeInterval,
  forwardMidpointMinutes,
  minutesToDialAngle,
  parseClockMinutes,
} from "../lib/day-wheel-geometry";

describe("DayWheel geometry",()=>{
  it("uses familiar clockwise cardinal orientation",()=>{
    expect(minutesToDialAngle(0)).toBe(0);
    expect(minutesToDialAngle(6*60)).toBe(90);
    expect(minutesToDialAngle(12*60)).toBe(180);
    expect(minutesToDialAngle(18*60)).toBe(270);
  });

  it("maps the reported Rahu window to its exact clockwise visual span",()=>{
    const start=parseClockMinutes("15:37")!;
    const end=parseClockMinutes("17:09")!;
    const wedge=clockwiseWedgeForTimeInterval(start,end);

    expect(minutesToDialAngle(start)).toBeCloseTo(234.25,6);
    expect(minutesToDialAngle(end)).toBeCloseTo(257.25,6);
    expect(wedge.start).toBeCloseTo(234.25,6);
    expect(wedge.end).toBeCloseTo(257.25,6);
    expect(wedge.end-wedge.start).toBeCloseTo(23,6);
  });

  it("places NOW 16:14 about 40.2% through 15:37–17:09",()=>{
    const start=parseClockMinutes("15:37")!;
    const now=parseClockMinutes("16:14")!;
    const end=parseClockMinutes("17:09")!;
    expect((now-start)/(end-start)).toBeCloseTo(37/92,6);
  });

  it("centers Sunrise 06:26 exactly while preserving a decorative width",()=>{
    const sunrise=parseClockMinutes("06:26")!;
    const wedge=centeredClockwiseWedge(sunrise,40);
    expect(minutesToDialAngle(sunrise)).toBeCloseTo(96.5,6);
    expect((wedge.start+wedge.end)/2).toBeCloseTo(96.5,6);
    expect(wedge.end-wedge.start).toBeCloseTo(40,6);
  });

  it("handles intervals that cross midnight",()=>{
    const start=parseClockMinutes("23:30")!;
    const end=parseClockMinutes("00:45")!;
    const wedge=clockwiseWedgeForTimeInterval(start,end);
    expect(wedge.start).toBeCloseTo(352.5,6);
    expect(wedge.end).toBeCloseTo(371.25,6);
    expect(wedge.end-wedge.start).toBeCloseTo(18.75,6);
  });

  it("computes day and night midpoints across normal and wrapped ranges",()=>{
    expect(forwardMidpointMinutes(parseClockMinutes("06:26")!,parseClockMinutes("18:40")!)).toBe(753);
    expect(forwardMidpointMinutes(parseClockMinutes("18:40")!,parseClockMinutes("06:26")!)).toBe(33);
  });
});
