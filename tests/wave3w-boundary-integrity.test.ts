import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {criticalBoundaryNotice,criticalBoundaryNotices} from "../lib/critical-boundary-notices";
import {getPanchang} from "../lib/panchang";
import {cityBySlug} from "../lib/cities";
import {calculateVratCalendar} from "../lib/vrat";
import {MUHURAT_BUILD_DATA_VERSION} from "../lib/muhurat-build-data-schema";

describe("Wave 3W honest source evidence and astronomical sunrise semantics",()=>{
  it("flags exactly three genuinely documented publisher/clock-sensitive city dates",()=>{
    expect(criticalBoundaryNotices).toHaveLength(3);
    for(const n of criticalBoundaryNotices){
      expect(n.evidence.length).toBeGreaterThanOrEqual(2);
      expect(n.evidence.every(e=>e.url.startsWith("https://"))).toBe(true);
      expect(n.fastOrCeremonyDateCertified).toBe(false);
      expect(n.mathematicalCalculationChanged).toBe(false);
    }
    expect(criticalBoundaryNotice("kanpur","2026-11-21")).not.toBeNull();
    expect(criticalBoundaryNotice("patna","2027-01-31")).not.toBeNull();
    expect(criticalBoundaryNotice("lucknow","2027-09-17")).not.toBeNull();
    expect(criticalBoundaryNotice("delhi","2026-06-30")).toBeNull();
    expect(criticalBoundaryNotice("patna","2027-01-30")).toBeNull();
  });
  it("shows each source disagreement on its exact Daily Panchang page only",()=>{
    const page=readFileSync("app/panchang/[city]/[[...date]]/page.tsx","utf8");
    expect(page).toContain("criticalBoundaryNotice(city.slug,data.date)");
    expect(page).toContain("SUNRISE BOUNDARY · SOURCE REVIEW");
    expect(page).toContain("A sunrise-based Tithi is not automatically");
    expect(page).toContain("rel=\"noopener noreferrer\"");
    expect(page).not.toContain("approved Ekadashi fast day");
  });
  it("does not advertise 38/38 festival-year publication dates as independently validated",()=>{
    const header=readFileSync("components/Header.tsx","utf8");
    expect(header).toContain("Published dates · observance varies");
    expect(header).toContain("Maintained annual calendar");
    expect(header).not.toContain("Validated festival dates");
    expect(header).not.toContain("Validated year directories");
  });
  it("retains correct UT-correct Delhi calculation and no false Purnima fasting inference",async()=>{
    expect(MUHURAT_BUILD_DATA_VERSION).toBe(5);
    const city=cityBySlug("delhi");
    const day=await getPanchang(new Date("2026-06-30T06:00:00Z"),city);
    expect(day.tithi).toBe("Pratipada");
    expect(day.paksha).toBe("Krishna");
    const vrat=calculateVratCalendar("purnima",2026,city);
    expect(vrat.some(r=>r.date==="2026-06-30")).toBe(false);
  });
  it("requires deterministic boundary/source checks in CI but does not import them into ephemeris",()=>{
    const ci=readFileSync(".github/workflows/quality.yml","utf8");
    const pkg=JSON.parse(readFileSync("package.json","utf8"));
    expect(pkg.scripts["audit:boundary-integrity"]).toContain("wave3w-boundary-integrity-audit.ts");
    expect(ci).toContain("npm run audit:boundary-integrity");
    expect(ci).toContain("wave3w-boundary-integrity");
    for(const path of ["lib/panchang.ts","lib/vrat.ts","lib/muhurat.ts","lib/festivals.ts"]){
      expect(readFileSync(path,"utf8")).not.toContain("critical-boundary-notices");
    }
  });
});
