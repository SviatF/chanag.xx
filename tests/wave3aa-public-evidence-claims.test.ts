import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("Wave 3AA public evidence honesty and release scope",()=>{
  it("never represents mathematical sunrise Tithi references as selected fast or Parana days",()=>{
    const notice=readFileSync("components/CalendarEvidenceNotice.tsx","utf8");
    expect(notice).toContain("NOT RITUAL-APPROVED");
    expect(notice).toContain("do not select an approved fasting day, Parana interval");
    expect(notice).toContain("A computed sunrise state or maintained festival date");
    expect(notice).not.toContain("RITUAL-CERTIFIED");
    for(const path of [
      "app/vrat/[vrat]/[year]/page.tsx",
      "app/vrat/[vrat]/[year]/[city]/page.tsx"
    ]){
      const src=readFileSync(path,"utf8");
      expect(src).toContain('<CalendarEvidenceNotice scope="sunrise-tithi-reference"');
      expect(src).toContain('import CalendarEvidenceNotice from "@/components/CalendarEvidenceNotice"');
    }
  });
  it("marks curated festivals as published records, not automatically validated observances",()=>{
    const yearPage=readFileSync("app/festivals/[festival]/[year]/page.tsx","utf8");
    expect(yearPage).toContain('<CalendarEvidenceNotice scope="maintained-festival-date"');
    const city=readFileSync("app/festivals/[festival]/[year]/[city]/page.tsx","utf8");
    // City-specific astronomy and observance paragraphs already supply the
    // evidence caveats; don't add templated near-duplicate explanations.
    expect(city).not.toContain('<CalendarEvidenceNotice scope="maintained-festival-date"');
    expect(city).not.toContain("VERIFIED REGIONAL DATE");
    expect(city).toContain("SOURCE-REVIEWED REGIONAL OBSERVANCE");
    expect(city).toContain("is listed for ");
    expect(city).toContain("local observance rules may differ");
  });
  it("publishes the actual state of the V5 calculation and unresolved ritual selectors",()=>{
    const page=readFileSync("app/accuracy/page.tsx","utf8");
    expect(page).toContain("sweCalcUt");
    expect(page).toContain("V5");
    expect(page).toContain("no blanket certification");
    expect(page).toContain("Guru/Shukra Asta");
    expect(page).toContain("coordinates, timing precision, sunrise convention");
    const ctx=readFileSync("lib/muhurat-verification-notice.ts","utf8");
    expect(ctx).toContain("astronomical-candidate-only");
    expect(ctx).toContain("NOT verified ceremony dates");
  });
});
