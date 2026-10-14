import {describe,expect,it} from "vitest";
import {
  auditCitySourceReproducibility,sourceCaptureErrors,type AstaSourceCapture
} from "../lib/asta-city-source-reproducibility";
import {unstableAstaCitySourceCaptures} from "./fixtures/asta-city-source-captures";
import {astaEvidenceLedger} from "./fixtures/asta-evidence-ledger";

describe("Wave 3S same Drik URL can show different observer cities",()=>{
  it("validates the actual indexed vs fresh page snapshots as literal source observations",()=>{
    expect(unstableAstaCitySourceCaptures).toHaveLength(4);
    for(const c of unstableAstaCitySourceCaptures){
      expect(sourceCaptureErrors(c)).toEqual([]);
      expect(c.url).toMatch(/^https:///);
    }
  });
  it("detects 2 different observer cities rendered by exactly 1 Drik URL",()=>{
    const report=auditCitySourceReproducibility(
      unstableAstaCitySourceCaptures,astaEvidenceLedger);
    expect(report.invalidCaptures).toEqual([]);
    expect(report.conflictingURLCount).toBe(1);
    const unstable=report.urls.find(x=>x.observationCount===2)!;
    expect(unstable.state).toBe("observed-multi-locality-at-one-url");
    expect(unstable.cities).toContain("Mumbai, Maharashtra");
    expect(unstable.cities).toContain("Washington, D.C., Washington, D.C., United States");
    expect(unstable.cityPermalinkIndependentlyVerified).toBe(false);
    expect(unstable.yearParams).toContainEqual({raw:"3206",renderedYear:2027});
    expect(report.safeForCeremonyFiltering).toBe(false);
    expect(report.independentlyCityPinnedURLCount).toBe(0);
  });
  it("does not promote Mumbai 2027 Guru Asta despite matching indexed source time",()=>{
    const report=auditCitySourceReproducibility(
      unstableAstaCitySourceCaptures,astaEvidenceLedger);
    const m=report.targetRows.find(r=>
      r.locality==="Mumbai, Maharashtra"&&r.planet==="Jupiter"&&r.year===2027)!;
    expect(m.sameSourceMatch).toBe(true);
    expect(m.observedCities.length).toBe(2);
    expect(m.reason).toBe("observed-locality-conflict");
    expect(m.hasIndependentImmutableCityPermalink).toBe(false);
  });
  it("does not promote one Latur or Wardha indexed source to a reproducible city permalink",()=>{
    const report=auditCitySourceReproducibility(
      unstableAstaCitySourceCaptures,astaEvidenceLedger);
    const forLocation=(locality:string)=>report.targetRows.find(x=>x.locality===locality)!;
    expect(forLocation("Latur, Maharashtra").reason).toBe("single-capture-context-only");
    expect(forLocation("Wardha, Maharashtra").reason).toBe("single-capture-context-only");
    expect(report.urls.every(x=>x.cityPermalinkIndependentlyVerified===false)).toBe(true);
  });
  it("retains historical evidence without pretending missing sources were replayed",()=>{
    const report=auditCitySourceReproducibility(
      unstableAstaCitySourceCaptures,astaEvidenceLedger);
    expect(report.targetRows.some(r=>r.reason==="no-observation-for-url")).toBe(true);
    expect(report.targetRows.every(r=>r.safeForCeremonyFiltering===false)).toBe(true);
  });
  it("rejects fabricated or swapped page observations",()=>{
    const valid=unstableAstaCitySourceCaptures[0];
    const cases:AstaSourceCapture[]=[
      {...valid,startLocal:"2027-02-30T11:00"},
      {...valid,endLocal:"2027-01-01T01:00"},
      {...valid,renderedLocality:""},
      {...valid,capturedOn:"2026-02-30"},
      {...valid,url:"http://unsafe.example.net"},
      {...valid,renderedYear:2026},
    ];
    for(const invalid of cases)
      expect(sourceCaptureErrors(invalid).length).toBeGreaterThan(0);
    expect(auditCitySourceReproducibility(cases,astaEvidenceLedger).invalidCaptures)
      .toHaveLength(cases.length);
  });
});
