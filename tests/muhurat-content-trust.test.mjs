import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {inspectRenderedMuhuratTrust,summarizeMuhuratTrust} from "../scripts/muhurat-content-trust.mjs";
const url="/muhurat/wedding/2027/11/delhi";
const doc=(main)=>`<html><main ${main.attrs??""}><h1>Wedding Muhurat</h1>${main.html??""}<script type="application/ld+json">${JSON.stringify(main.ld??{"@context":"https://schema.org","@type":"CollectionPage","name":"screened"})}</script></main></html>`;
describe("CT2: public Muhurat trust boundary",()=>{
  it("rejects scored ItemList for unapproved ceremony candidates",()=>{
    const old=doc({html:"Astronomical candidates NOT verified ceremony dates",ld:{"@graph":[{"@type":"ItemList",itemListElement:[{name:"2027-11-12 · Planning Score 100/100"}]}]}});
    expect(inspectRenderedMuhuratTrust(url,old).issues).toContain("unverified-list-score-schema");
  });
  it("accepts candidate-only status with explicit non-ceremonial clock score",()=>{
    const html=doc({attrs:'data-ritual-status="candidate-only"',html:"<h2>Astronomical candidates · NOT verified ceremony dates</h2><p>Why November has 75/100 clock-window availability</p>"});
    const report=inspectRenderedMuhuratTrust(url,html);
    expect(report.issues).toEqual([]);
    expect(report.riskFlags).toContain("full-ceremony-eligibility-unverified");
    expect(summarizeMuhuratTrust([report]).independentCeremonyCertification).toBe(false);
  });
  it("checks regional closure and yearly pages separately",()=>{
    const closure=doc({html:"REVIEWED REGIONAL WEDDING CALENDAR · Reviewed convention · not a blanket prohibition"});
    expect(inspectRenderedMuhuratTrust(url,closure).category).toBe("reviewed-regional-closure");
    const yearly=doc({html:"Candidate-only evidence: NOT verified ceremony dates"});
    expect(inspectRenderedMuhuratTrust("/muhurat/wedding/2027",yearly).issues).toEqual([]);
  });
  it("guards against reintroducing machine-readable ceremony score rankings",()=>{
    for(const path of ["app/muhurat/[event]/[year]/[month]/page.tsx","app/muhurat/[event]/[year]/[month]/[city]/page.tsx"]){
      const s=readFileSync(path,"utf8");
      expect(s).toContain('data-ritual-status="candidate-only"');
      expect(s).toContain("verification.explanation");
      expect(s).not.toContain('"@type":"ItemList"');
      expect(s).not.toContain("Planning Score ${r.planning.score}/100");
      expect(s).toContain("{verification.headline}");
    }
    const s=readFileSync("lib/muhurat.ts","utf8");
    expect(s).toContain("getVerifiedMuhuratClosure");
  });
});
