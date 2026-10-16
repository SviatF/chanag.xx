import {describe,it,expect} from "vitest";
import {inspectRenderedContentTrust,summarizeContentTrust} from "../scripts/content-trust-integrity.mjs";
const url="/panchang/mumbai/2026-10-16";
const wrap=(body)=>`<html><body><main><h1>Mumbai Panchang 2026-10-16</h1>${body}<a href="/methodology">Method</a><a href="/accuracy">Accuracy</a></main></body></html>`;

describe("Content Trust Recovery CT1",()=>{
  it("rejects the old unverified subjective Daily activity claims",()=>{
    const previous=wrap("<h2>Traditional favorable signals</h2><p>Favorable signal Leadership tasks</p>");
    expect(inspectRenderedContentTrust(url,previous).issues).toContain("unverified-activity-advice");
  });
  it("rejects invented pseudo-scientific daily narrative used for uniqueness",()=>{
    const previous=wrap("<h2>DAY FINGERPRINT</h2><p>LOCAL DAY INTERPRETATION and mid-morning-edge sunrise</p>");
    const issues=inspectRenderedContentTrust(url,previous).issues;
    expect(issues).toContain("synthetic-day-fingerprint");
    expect(issues).toContain("synthetic-local-interpretation");
    expect(issues).toContain("invented-sunrise-taxonomy");
  });
  it("requires visible links to methodology and accuracy without pretending to certify facts",()=>{
    const missing="<main><h1>Mumbai Panchang</h1><p>Tithi</p></main>";
    expect(inspectRenderedContentTrust(url,missing).issues).toEqual(["missing-methodology-link","missing-accuracy-link"]);
    const result=inspectRenderedContentTrust(url,wrap("<p>Tithi Shashthi Nakshatra Jyeshtha sunrise 06:33</p>"));
    expect(result.issues).toEqual([]);
    expect(result.riskFlags).toContain("ritual-rules-unverified-external");
    const summary=summarizeContentTrust([result,null]);
    expect(summary.inspected).toBe(1);
    expect(summary.failures).toHaveLength(0);
    expect(summary.remainingExternalReviewFlags["astronomy-unverified-external"]).toBe(1);
  });
  it("never blocks non-Daily routes or alters robots and index policy",()=>{
    expect(inspectRenderedContentTrust("/muhurat/wedding/2026/10/mumbai",wrap("Traditional favorable signals"))).toBeNull();
    expect(inspectRenderedContentTrust("/panchang/mumbai/2026-10-16",'<main><p>factual</p></main>').issues).toContain("missing-methodology-link");
  });
});
