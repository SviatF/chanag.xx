import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const source=readFileSync(new URL("../components/DayWheel.tsx",import.meta.url),"utf8");

describe("DayWheel equal-width visual model",()=>{
  it("uses one canonical time-to-angle mapper for NOW",()=>{
    expect(source).toContain("minutesToDialAngle(clock.minutes)");
    expect(source).not.toContain("function liveAngle");
  });

  it("renders eight equal 45-degree sectors",()=>{
    expect(source).toContain("const SECTOR_SPAN=45");
    expect(source).toContain('equalSector("night"');
    expect(source).toContain('equalSector("sunset"');
    expect(source).toContain('equalSector("day"');
    expect(source).toContain('equalSector("rahu"');
    expect(source).toContain('equalSector("gulika"');
    expect(source).toContain('equalSector("abhijit"');
    expect(source).toContain('equalSector("yamaganda"');
    expect(source).toContain('equalSector("sunrise"');
  });

  it("formats user-facing timing copy in 12-hour AM/PM notation",()=>{
    expect(source).toContain("function formatClock12");
    expect(source).toContain("formatClock12(value.start)");
    expect(source).toContain("formatClock12(value.end)");
    expect(source).toContain('formatClock12(data.sunrise)');
    expect(source).toContain('formatClock12(data.sunset)');
    expect(source).toContain('["12 AM",0]');
    expect(source).toContain('["6 AM",90]');
    expect(source).toContain('["12 PM",180]');
    expect(source).toContain('["6 PM",270]');
  });

  it("keeps a subtle truthful timing layer on the real 24-hour outer ring",()=>{
    expect(source).toContain("const TIME_RING_R=250");
    expect(source).toContain("clockwiseWedgeForTimeInterval");
    expect(source).toContain("parseClockMinutes");
    expect(source).toContain('timingArc("rahu",data.rahu)');
    expect(source).toContain('timingArc("gulika",data.gulika)');
    expect(source).toContain('timingArc("abhijit",data.abhijit)');
    expect(source).toContain('timingArc("yamaganda",data.yamaganda)');
    expect(source).toContain("const sunriseMarker=useMemo(()=>instantMarker(data.sunrise)");
    expect(source).toContain("const sunsetMarker=useMemo(()=>instantMarker(data.sunset)");
    expect(source).toContain("ringArcPath(TIME_RING_R,arc.start,arc.end)");
    expect(source).toContain('strokeWidth="3.4"');
  });

  it("starts the NOW pointer outside the center disc instead of through it",()=>{
    expect(source).toContain("const handStart=handAngle===null?null:polar(CENTER_R+14,handAngle)");
    expect(source).toContain("x1={handStart.x}");
    expect(source).toContain("y1={handStart.y}");
  });

  it("keeps the approved SVG/CSS styling contract",()=>{
    expect(source).toContain('import styles from "./DayWheel.module.css"');
    expect(source).toContain('strokeWidth="1.15"');
    expect(source).toContain('filter="url(#soft-shadow)"');
    expect(source).not.toMatch(/transform=\{`rotate\(/);
  });
});
