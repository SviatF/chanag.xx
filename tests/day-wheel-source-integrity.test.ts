import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const source=readFileSync(new URL("../components/DayWheel.tsx",import.meta.url),"utf8");

describe("DayWheel source integrity",()=>{
  it("uses the canonical clock-to-angle mapper for the live hand and timed arcs",()=>{
    expect(source).toContain("minutesToDialAngle(clock.minutes)");
    expect(source).toContain("timedSectorPath(sector.start,sector.end");
    expect(source).not.toContain("start:30,end:72");
    expect(source).not.toContain("start:210,end:250");
  });

  it("keeps Sunrise and Sunset labels upright",()=>{
    expect(source).toContain("key:\"sunrise\"");
    expect(source).toContain("key:\"sunset\"");
    expect(source).not.toMatch(/transform=\{`rotate\(/);
  });
});
