import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const source=readFileSync(new URL("../components/DayWheel.tsx",import.meta.url),"utf8");

describe("DayWheel style-locked geometry source",()=>{
  it("uses one canonical time-to-angle mapper for NOW",()=>{
    expect(source).toContain("minutesToDialAngle(clock.minutes)");
    expect(source).not.toContain("function liveAngle");
  });

  it("does not hardcode the timed Rahu/Yamaganda/Gulika windows",()=>{
    expect(source).toContain("exactWindowSector(\"rahu\"");
    expect(source).toContain("exactWindowSector(\"yamaganda\"");
    expect(source).toContain("exactWindowSector(\"gulika\"");
    expect(source).not.toContain('{key:"rahu",label:"Rahu Kalam",value:formatWindow(data.rahu),start:30,end:72}');
  });

  it("keeps the approved SVG/CSS styling contract",()=>{
    expect(source).toContain('import styles from "./DayWheel.module.css"');
    expect(source).toContain('strokeWidth="1.15"');
    expect(source).toContain('filter="url(#soft-shadow)"');
    expect(source).not.toMatch(/transform=\{`rotate\(/);
  });
});
