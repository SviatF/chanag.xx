import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {getMuhuratVerificationNotice} from "../lib/muhurat-verification-notice";
import {assessAstaEvidenceForFiltering,planetaryAsta2027Evidence} from "./fixtures/planetary-asta-2027-provenance";

describe("Wave 3J: full ceremony eligibility is never invented from a timing score",()=>{
  it("reports all non-closed wedding and house-entry result sets as candidates only",()=>{
    for(const [event,city,year,month] of [
      ["wedding","mumbai",2027,11],
      ["wedding","delhi",2027,8],
      ["griha-pravesh","pune",2027,10],
      ["vehicle-purchase","mumbai",2026,12],
    ] as const){
      const assessment=getMuhuratVerificationNotice(event,year,month,cityBySlug(city));
      expect(assessment.status).toBe("astronomical-candidate-only");
      expect(assessment.headline).toContain("NOT verified ceremony dates");
      expect(assessment.explanation).toContain("0–100 score measures window availability");
      expect(assessment.explanation).toContain("have NOT been independently verified");
    }
  });
  it("respects documented Maharashtra community closed months without making a national ban",()=>{
    const closure=getMuhuratVerificationNotice("wedding",2027,8,cityBySlug("mumbai"));
    expect(closure.status).toBe("reviewed-closed-calendar");
    expect(closure.explanation).toContain("not a universal prohibition");
    const delhi=getMuhuratVerificationNotice("wedding",2027,8,cityBySlug("delhi"));
    expect(delhi.status).toBe("astronomical-candidate-only");
  });
  it("keeps same-locality, independently-published minute precision mandatory before Asta gating",()=>{
    for(const city of ["Mumbai, Maharashtra","Kolkata, West Bengal","New Delhi"]){
      const result=assessAstaEvidenceForFiltering("Jupiter",2027,city);
      expect(result.readyForCeremonyFiltering).toBe(false);
      expect(result.independentMinuteSourceCount).toBeLessThan(2);
    }
    const delhi=assessAstaEvidenceForFiltering("Jupiter",2027,"New Delhi");
    expect(delhi.sourceCount).toBe(2);
    expect(delhi.independentMinuteSourceCount).toBe(0);
    const mumbai=assessAstaEvidenceForFiltering("Jupiter",2027,"Mumbai, Maharashtra");
    expect(mumbai.sourceCount).toBe(1);
    expect(assessAstaEvidenceForFiltering("Venus",2027,"Wardha, Maharashtra").readyForCeremonyFiltering).toBe(false);
  });
  it("retains method and locality differences instead of averaging Asta intervals",()=>{
    const mumbai=planetaryAsta2027Evidence.find(r=>r.locality==="Mumbai, Maharashtra")!;
    const kolkata=planetaryAsta2027Evidence.find(r=>r.locality==="Kolkata, West Bengal")!;
    expect(mumbai.startLocal.slice(0,10)).toBe("2027-08-19");
    expect(kolkata.startLocal.slice(0,10)).toBe("2027-08-18");
    expect(planetaryAsta2027Evidence.filter(r=>r.locality==="New Delhi").every(r=>r.precision==="day")).toBe(true);
  });
  it("renders explicit high-visibility notices on city-month, baseline-month and yearly pages",()=>{
    for(const path of [
      "app/muhurat/[event]/[year]/[month]/[city]/page.tsx",
      "app/muhurat/[event]/[year]/[month]/page.tsx",
      "app/muhurat/[event]/[year]/page.tsx",
    ]){
      const source=readFileSync(path,"utf8");
      expect(source).toContain("getMuhuratVerificationNotice");
      expect(source).toContain("{verification.headline}");
      expect(source).toContain("{verification.explanation}");
    }
    expect(readFileSync("lib/muhurat.ts","utf8")).not.toContain("planetary-asta-2027-provenance");
    expect(readFileSync("lib/muhurat.ts","utf8")).not.toContain("planetary-asta-research");
  });
});
