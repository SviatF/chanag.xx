import {describe,expect,it} from "vitest";
import {
  astaLocalMinute,astaReferenceErrors,evaluateAstaReferences,normalizeAsta24Plus,
  type AstaReference
} from "../lib/asta-reference-audit";
import {astaEvidenceLedger} from "./fixtures/asta-evidence-ledger";

const one:AstaReference={
  planet:"Jupiter",year:2027,locality:"Mumbai, Maharashtra",
  publisher:"Synthetic Publisher A",url:"https://citya.test/observer/mumbai/a",
  method:"observer-sensitive",precision:"minute",sourceLocationMode:"publisher-pinned",
  observerUrlProof:{cityToken:"mumbai",independentlyRepeatedAnonymousFetches:2,
    reviewedCity:"Mumbai, Maharashtra"},
  startLocal:"2027-08-19T19:34",endLocal:"2027-09-13T05:46",
  reviewedOn:"2026-10-13"
};
const two:AstaReference={
  ...one,publisher:"Synthetic Publisher B",url:"https://cityb.test/observer/mumbai/reference",
  startLocal:"2027-08-19T19:36",endLocal:"2027-09-13T05:48"
};

describe("Wave 3N: independently reviewed Asta evidence, never ritual approval",()=>{
  it("keeps every actually collected source valid with explicit civil time and location",()=>{
    expect(astaEvidenceLedger.length).toBeGreaterThan(5);
    for(const reference of astaEvidenceLedger){
      expect(astaReferenceErrors(reference)).toEqual([]);
      expect(reference.url).toMatch(/^https:\/\//);
      expect(reference.locality.length).toBeGreaterThan(4);
    }
  });
  it("understands Drik 24+ convention and after-midnight without date loss",()=>{
    expect(normalizeAsta24Plus("2026-08-10","29:39+")).toBe("2026-08-11T05:39");
    expect(normalizeAsta24Plus("2027-07-21","29:33+")).toBe("2027-07-22T05:33");
    expect(normalizeAsta24Plus("2026-06-31","25:00+")).toBeNull();
    expect(normalizeAsta24Plus("2026-08-10","48:00+")).toBeNull();
    expect(astaLocalMinute("2027-02-30T19:00")).toBeNull();
  });
  it("prohibits cross-location, date-only and duplicated-publisher corroboration",()=>{
    const different={...two,locality:"Pune, Maharashtra"};
    const dateOnly={...two,precision:"day" as const,startLocal:"2027-08-19",endLocal:"2027-09-13"};
    const clone={...two,url:"https://m.citya.test/mirror"};
    for(const extra of [different,dateOnly,clone]){
      const a=evaluateAstaReferences([one,extra],"Jupiter",2027,"Mumbai, Maharashtra");
      expect(a.status).toBe("insufficient-independent-minute-sources");
      expect(a.safeForCeremonyFiltering).toBe(false);
      expect(a.independentMinuteSourceCount).toBe(1);
    }
  });
  it("does not trust location-reactive publication URLs as pinned observer proof",()=>{
    const dynamic={...one,sourceLocationMode:"geolocated-snapshot" as const};
    const r=evaluateAstaReferences([dynamic,two],"Jupiter",2027,"Mumbai, Maharashtra");
    expect(r.status).toBe("location-not-reproducible");
    expect(r.independentMinuteSourceCount).toBe(2);
    expect(r.reproducibleMinuteSourceCount).toBe(1);
    expect(r.safeForCeremonyFiltering).toBe(false);
  });
  it("never promotes a source agreement directly to wedding eligibility",()=>{
    const a=evaluateAstaReferences([one,two],"Jupiter",2027,"Mumbai, Maharashtra");
    expect(a.status).toBe("comparison-ready");
    expect(a.independentMinuteSourceCount).toBe(2);
    expect(a.startSpreadMinutes).toBe(2);
    expect(a.endSpreadMinutes).toBe(2);
    expect(a.safeForCeremonyFiltering).toBe(false);
    expect(a.nextStep).toBe("independent-observer-model-benchmark");
  });
  it("rejects equally timed but methodologically incompatible source claims",()=>{
    const fixed={...two,method:"fixed-angular-threshold" as const};
    const a=evaluateAstaReferences([one,fixed],"Jupiter",2027,"Mumbai, Maharashtra");
    expect(a.status).toBe("method-disagreement");
    expect(a.safeForCeremonyFiltering).toBe(false);
    const undisclosed={...two,method:"not-disclosed" as const};
    expect(evaluateAstaReferences([one,undisclosed],"Jupiter",2027,"Mumbai, Maharashtra").status).toBe("method-disagreement");
  });
  it("refuses 2 minute-level publisher rows when the city URL replay proof is absent",()=>{
    const a=evaluateAstaReferences([
      {...one,observerUrlProof:undefined},{...two,observerUrlProof:undefined}
    ],"Jupiter",2027,"Mumbai, Maharashtra");
    expect(a.status).toBe("location-not-reproducible");
    expect(a.reproducibleMinuteSourceCount).toBe(0);
    expect(a.safeForCeremonyFiltering).toBe(false);
  });
  it("never upgrades two city-labeled fixed-angle sources to observer visibility proof",()=>{
    const r=evaluateAstaReferences([
      {...one,method:"fixed-angular-threshold"},
      {...two,method:"fixed-angular-threshold"}
    ],"Jupiter",2027,"Mumbai, Maharashtra");
    expect(r.status).toBe("method-disagreement");
    expect(r.reproducibleMinuteSourceCount).toBe(2);
    expect(r.safeForCeremonyFiltering).toBe(false);
  });
  it("quarantines internal contradictions of a single publisher, even with another matching site",()=>{
    const conflict={...one,startLocal:"2027-08-20T08:10"};
    const r=evaluateAstaReferences([one,conflict,two],"Jupiter",2027,"Mumbai, Maharashtra");
    expect(r.status).toBe("publisher-internal-conflict");
    expect(r.publisherInternalConflicts).toHaveLength(1);
    expect(r.safeForCeremonyFiltering).toBe(false);
  });
  it("rejects a claimed city URL token absent from the actual address",()=>{
    const r=evaluateAstaReferences([
      {...one,url:"https://citya.test/guru-year"},
      {...two,url:"https://cityb.test/guru-year"},
    ],"Jupiter",2027,"Mumbai, Maharashtra");
    expect(r.status).toBe("location-not-reproducible");
  });
  it("halts on minute-level publisher disagreement instead of averaging intervals",()=>{
    const conflicting={...two,startLocal:"2027-08-20T02:00"};
    const a=evaluateAstaReferences([one,conflicting],"Jupiter",2027,"Mumbai, Maharashtra");
    expect(a.status).toBe("boundary-disagreement");
    expect(a.startSpreadMinutes).toBeGreaterThan(300);
    expect(a.safeForCeremonyFiltering).toBe(false);
  });
  it("rejects impossible calendars and incorrectly declared precision",()=>{
    for(const record of [
      {...one,startLocal:"2027-02-30T08:00"},
      {...one,precision:"day" as const},
      {...one,endLocal:"2027-08-18T08:00"},
      {...one,url:"http://nonsecure.example.com/planet"},
      {...one,year:2026 as const},
    ])expect(astaReferenceErrors(record).length).toBeGreaterThan(0);
  });
  it("keeps all priority 2025–27 locality/planet comparisons unverified",()=>{
    const localities=["Mumbai, Maharashtra","Pune, Maharashtra","New Delhi","Chennai, Tamil Nadu"];
    let comparisons=0;
    for(const locality of localities)for(const year of [2025,2026,2027]){
      for(const planet of ["Jupiter","Venus"] as const){
        const a=evaluateAstaReferences(astaEvidenceLedger,planet,year,locality);
        expect(a.safeForCeremonyFiltering).toBe(false);
        expect(a.status).not.toBe("comparison-ready");
        comparisons++;
      }
    }
    expect(comparisons).toBe(24);
    const m=evaluateAstaReferences(astaEvidenceLedger,"Jupiter",2027,"Mumbai, Maharashtra");
    expect(m.independentMinuteSourceCount).toBe(1);
    expect(m.reproducibleMinuteSourceCount).toBe(0);
    const d=evaluateAstaReferences(astaEvidenceLedger,"Jupiter",2027,"New Delhi");
    expect(d.sourceCount).toBe(2);
    expect(d.independentMinuteSourceCount).toBe(0);
  });
});
