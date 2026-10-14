import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {getVerifiedMuhuratClosure} from "../lib/verified-muhurat-closures";
import {getMuhuratVerificationNotice} from "../lib/muhurat-verification-notice";
import {getFestivalRuleProfile} from "../lib/religious-integrity";
import {festivalBySlugYear} from "../lib/festivals";
import {vratDefinitions} from "../lib/vrat";
describe("Wave 3T ritual evidence taxonomy does not falsely approve dates",()=>{
  it("keeps custom Marathi closure scoped to state, year, event and month",()=>{
    const pune=findCityBySlug("pune")!;
    const delhi=findCityBySlug("delhi")!;
    expect(getVerifiedMuhuratClosure("wedding",2027,9,pune)).not.toBeNull();
    expect(getVerifiedMuhuratClosure("wedding",2027,9,delhi)).toBeNull();
    expect(getVerifiedMuhuratClosure("griha-pravesh",2026,9,pune)).not.toBeNull();
    expect(getVerifiedMuhuratClosure("griha-pravesh",2027,9,pune)).toBeNull();
    const n=getMuhuratVerificationNotice("griha-pravesh",2027,9,pune);
    expect(n.status).toBe("astronomical-candidate-only");
    expect(n.explanation).toContain("NOT");
  });
  it("keeps Diwali and Janmashtami timings as astronomical references, not Lagna-certified Puja",()=>{
    const diwali=getFestivalRuleProfile(festivalBySlugYear("diwali",2026)!);
    const janmashtami=getFestivalRuleProfile(festivalBySlugYear("janmashtami",2026)!);
    expect(diwali.limitations.join(" ")).toContain("Lagna");
    expect(diwali.ruleSummary).toContain("Amavasya overlap");
    expect(janmashtami.limitations.join(" ")).toContain("Smarta/Vaishnava");
  });
  it("retains the three Vrat sunrise-not-observance caution statements",()=>{
    for(const def of Object.values(vratDefinitions)){
      expect(def.methodology).toContain("sunrise");
      expect(def.ritualCaution).toMatch(/not|rather than|does not/i);
    }
    expect(vratDefinitions.ekadashi.ritualCaution).toContain("Parana");
  });
  it("requires the ritual audit in CI but never imports it into public engines",()=>{
    const ci=readFileSync(".github/workflows/quality.yml","utf8");
    expect(ci).toContain("npm run audit:ritual-evidence");
    expect(ci).toContain("wave3t-ritual-evidence-matrix");
    expect(ci).toContain("npm run audit:muhurat");
    expect(ci).toContain("npm run audit:festivals");
    expect(ci).toContain("wave3t-full-muhurat-truth");
    expect(ci).toContain("wave3t-full-festival-truth");
    expect(ci.indexOf("npm run audit:ritual-evidence")).toBeLessThan(
      ci.indexOf("npm run audit:muhurat"));
    expect(ci.indexOf("npm run audit:muhurat")).toBeLessThan(
      ci.indexOf("npm run audit:festivals"));
    const pkg=JSON.parse(readFileSync("package.json","utf8"));
    expect(pkg.scripts["audit:ritual-evidence"]).toContain("wave3t-ritual-evidence-audit.ts");
    expect(pkg.scripts.build).not.toContain("ritual-evidence-audit");
    for(const path of ["lib/muhurat.ts","lib/verified-muhurat-closures.ts",
      "lib/festivals.ts","lib/vrat.ts","lib/festival-expansion.ts"]){
      const src=readFileSync(path,"utf8");
      expect(src).not.toContain("wave3t-ritual-evidence-audit");
      expect(src).not.toContain("ritual-evidence-matrix");
    }
    const audit=readFileSync("scripts/wave3t-ritual-evidence-audit.ts","utf8");
    expect(audit).toContain("safeForCeremonyFiltering:false");
    expect(audit).toContain("certifiedRegionalRitualDates:0");
    expect(audit).toContain("certifiedVratFastOrParanaTimings:0");
  });
});
