import {describe,expect,it} from "vitest";
import {
  angularSourceErrors,comparePublishedAngularFamily,
  temporalGapFromAngularToLocalSnapshot,toIstEvidenceInstant
} from "../lib/asta-global-angular-evidence";
import {globalAngularEvidence} from "./fixtures/asta-global-angular-evidence";
import {astaEvidenceLedger} from "./fixtures/asta-evidence-ledger";
const locate=(p:"Jupiter"|"Venus",y:number,pub:string)=>globalAngularEvidence.find(
  x=>x.planet===p&&x.year===y&&x.publisher===pub
)!;
describe("Wave 3R: source-convention corroboration with explicit NPT→IST math",()=>{
  it("validates all cited raw source records, preserving their original clock zone",()=>{
    expect(globalAngularEvidence).toHaveLength(7);
    for(const s of globalAngularEvidence)expect(angularSourceErrors(s)).toEqual([]);
    expect(globalAngularEvidence.filter(s=>s.publisher==="VedicMarga").every(s=>
      s.geographicScope==="nonlocal-angular")).toBe(true);
  });
  it("converts NPT to IST by EXACTLY 15 minutes; does not silently use one UTC zone",()=>{
    const x=toIstEvidenceInstant("2026-07-14T18:19","Asia/Kathmandu");
    expect(x?.istLocal).toBe("2026-07-14T18:04");
    expect(x?.sourceOffsetMinutes).toBe(345);
    expect(toIstEvidenceInstant("2026-08-13T16:09","Asia/Kathmandu")?.istLocal)
      .toBe("2026-08-13T15:54");
    expect(toIstEvidenceInstant("2027-08-16T19:58","Asia/Kathmandu")?.istLocal)
      .toBe("2027-08-16T19:43");
    expect(toIstEvidenceInstant("2027-09-15T03:28","Asia/Kathmandu")?.istLocal)
      .toBe("2027-09-15T03:13");
    expect(toIstEvidenceInstant("2027-01-01T00:05","Asia/Kathmandu")?.istLocal)
      .toBe("2026-12-31T23:50");
    expect(toIstEvidenceInstant("2027-02-30T12:00","Asia/Kathmandu")).toBeNull();
  });
  it("finds a real cross-publisher agreement on fixed-angle Guru 2026 within one minute",()=>{
    const r=comparePublishedAngularFamily(globalAngularEvidence,"Jupiter",2026);
    expect(r.status).toBe("fixed-angle-published-minute-agreement");
    expect(r.distinctPublisherDomainCount).toBe(2);
    expect(r.minutePublisherCount).toBe(2);
    expect(r.startSpreadMinutes).toBe(0);
    expect(r.endSpreadMinutes).toBe(1);
    expect(r.independentAstronomicalImplementationVerified).toBe(false);
    expect(r.independentCityObserverVerified).toBe(false);
    expect(r.sameSpecificFormulaValidated).toBe(false);
    expect(r.safeForCeremonyFiltering).toBe(false);
  });
  it("does not fake minute corroboration from day-only August 2027 Guru evidence",()=>{
    const r=comparePublishedAngularFamily(globalAngularEvidence,"Jupiter",2027);
    expect(r.status).toBe("date-only-publisher-agreement");
    expect(r.minutePublisherCount).toBe(1);
    expect(r.calendarDatesAgree).toBe(true);
    expect(r.startSpreadMinutes).toBeNull();
    expect(r.safeForCeremonyFiltering).toBe(false);
  });
  it("does not fake Shukra 2027 minute agreement from day-only Delhi",()=>{
    const r=comparePublishedAngularFamily(globalAngularEvidence,"Venus",2027);
    expect(r.status).toBe("date-only-publisher-agreement");
    expect(r.minutePublisherCount).toBe(1);
    expect(r.sources.find(x=>x.publisher==="VedicMarga")?.startIst)
      .toBe("2027-07-06T20:43");
    expect(r.sources.find(x=>x.publisher==="VedicMarga")?.endIst)
      .toBe("2027-09-17T22:49");
  });
  it("counts a duplicate mirror of same publisher once",()=>{
    const first=locate("Jupiter",2025,"VedicMarga");
    const clone={...first,url:"https://m.vedicmarga.com/transit/jupiter/combust/"};
    const r=comparePublishedAngularFamily([first,clone],"Jupiter",2025);
    expect(r.status).toBe("single-publisher-only");
    expect(r.distinctPublisherDomainCount).toBe(1);
    expect(r.safeForCeremonyFiltering).toBe(false);
  });
  it("compares Mumbai Drik 2027 only as an explicit CROSS-METHOD time gap",()=>{
    const global=locate("Jupiter",2027,"VedicMarga");
    const local=astaEvidenceLedger.find(x=>x.planet==="Jupiter"&&
      x.year===2027&&x.locality==="Mumbai, Maharashtra")!;
    const r=temporalGapFromAngularToLocalSnapshot(global,local);
    expect(r?.startGapMinutes).toBe(-4311);
    expect(r?.endGapMinutes).toBe(2727);
    expect(r?.comparison).toBe("cross-method-time-gap-not-local-validation");
    expect(r?.sourceMethodsEquivalent).toBe(false);
    expect(r?.safeForCeremonyFiltering).toBe(false);
    expect(temporalGapFromAngularToLocalSnapshot(locate("Venus",2027,"VedicMarga"),local))
      .toBeNull();
  });
  it("detects actual independently published fixed-angle disagreements",()=>{
    const first=locate("Jupiter",2026,"VedicMarga");
    const second={...locate("Jupiter",2026,"Swarn Siddhi"),
      startLocal:"2026-07-15T19:00"};
    const r=comparePublishedAngularFamily([first,second],"Jupiter",2026);
    expect(r.status).toBe("fixed-angle-minute-disagreement");
    expect(r.startSpreadMinutes).toBeGreaterThan(1000);
    expect(r.safeForCeremonyFiltering).toBe(false);
  });
  it("fails closed on incorrect dates, missing locality and false minute precision",()=>{
    const first=locate("Jupiter",2026,"VedicMarga");
    for(const row of [
      {...first,startLocal:"2026-02-30T12:00"},
      {...first,url:"http://www.vedicmarga.com/data"},
      {...first,geographicScope:"city-labeled-angular" as const},
      {...first,precision:"day" as const}
    ])expect(angularSourceErrors(row).length).toBeGreaterThan(0);
    expect(()=>comparePublishedAngularFamily(globalAngularEvidence,"Jupiter",2026,-1)).toThrow();
  });
});
