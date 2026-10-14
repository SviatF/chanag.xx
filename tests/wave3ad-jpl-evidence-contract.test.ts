import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("Wave 3AD: independent JPL DE440s clock evidence integrity",()=>{
  it("loads JPL DE440s as a separate method, never a disguised Swiss or Brown wrapper",()=>{
    const s=readFileSync("scripts/wave3ad-jpl-de440s-oracle.py","utf8");
    expect(s).toContain("from skyfield import almanac");
    expect(s).toContain("load_file");
    expect(s).toContain('KERNEL_NAME = "de440s.bsp"');
    expect(s).toContain("almanac.moon_phase(self.eph");
    expect(s).toContain("almanac.find_risings(observer,self.sun");
    expect(s).toContain("normalize_delta(self.phase_deg");
    expect(s).toContain('if data[:7]!=b"DAF/SPK"');
    expect(s).toContain("hashlib.sha256(data).hexdigest()");
    expect(s).toContain("builtin=True");
    expect(s).not.toContain("sweCalc");
    expect(s).not.toContain("MoonPhase(date)");
  });
  it("compares three critically close dawn days and all eight previous mathematical Vedha candidates",()=>{
    const src=readFileSync("scripts/wave3ad-swiss-baseline.ts","utf8");
    expect(src).toContain('["patna","2027-01-31"]');
    expect(src).toContain('["kanpur","2026-11-21"]');
    expect(src).toContain('["lucknow","2027-09-17"]');
    expect(src).toContain('["2026-05-26","2027-10-25"]');
    expect(src).toContain('["delhi","kanpur","mumbai","chennai"]');
    expect(src).toContain("targetIndex*12");
    expect(src).toContain('ritualApproved:false');
    const p=readFileSync("scripts/wave3ad-jpl-de440s-oracle.py","utf8");
    expect(p).toContain("publishedPublisherRuleFullyReproduced");
    expect(p).toContain("PatnaSourceConflictNotYetCertified");
    expect(p).toContain('"certifiedFasts":0');
    expect(p).toContain("releaseDecision");
  });
  it("keeps the third JPL ephemeris only in research CLI, without a production import or new runtime dependency",()=>{
    const pkg=JSON.parse(readFileSync("package.json","utf8"));
    expect(pkg.scripts["audit:jpl-swiss-baseline"]).toContain("wave3ad-swiss-baseline.ts");
    const ci=readFileSync(".github/workflows/quality.yml","utf8");
    expect(ci).toContain('"skyfield==1.55"');
    expect(ci).toContain("de440s.bsp");
    expect(ci).toContain("python scripts/wave3ad-jpl-de440s-oracle.py");
    expect(ci).toContain("wave3ad-jpl-de440s-third-ephemeris");
    for(const f of ["lib/panchang.ts","lib/vrat.ts","lib/muhurat.ts","lib/festivals.ts","lib/seo-policy.ts"]){
      const c=readFileSync(f,"utf8");
      expect(c).not.toContain("wave3ad");
      expect(c).not.toContain("skyfield");
      expect(c).not.toContain("de440s.bsp");
    }
  });
});
