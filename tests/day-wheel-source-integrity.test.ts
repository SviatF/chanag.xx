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
    expect(source).not.toContain("exactWindowSector(");
  });

  it("keeps exact timing copy inside the aesthetic sectors",()=>{
    expect(source).toContain("formatWindow(data.rahu)");
    expect(source).toContain("formatWindow(data.gulika)");
    expect(source).toContain("formatWindow(data.yamaganda)");
    expect(source).toContain("formatWindow(data.abhijit)");
    expect(source).toContain('`${data.sunrise} – ${data.sunset}`');
    expect(source).toContain('`${data.sunset} – ${data.sunrise}`');
  });

  it("keeps the approved SVG/CSS styling contract",()=>{
    expect(source).toContain('import styles from "./DayWheel.module.css"');
    expect(source).toContain('strokeWidth="1.15"');
    expect(source).toContain('filter="url(#soft-shadow)"');
    expect(source).not.toMatch(/transform=\{`rotate\(/);
  });
});
