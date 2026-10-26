import {describe,expect,it} from "vitest";
import {
  auditVratSunriseRows,festivalDateEvidenceStatus,
  type FestivalPublishedEvidence,type RitualVratObservation
} from "../lib/ritual-evidence-matrix";
import {festivalDateEvidence,independentFestivalDateChecks,festivalTraditionDateEvidence} from "./fixtures/festival-date-evidence";
import {festivalsForYear} from "../lib/festivals";

const first:FestivalPublishedEvidence={
  slug:"diwali",year:2027,date:"2027-10-29",
  source:"https://drikpanchang.com/festivals/diwali",
  sourceLocality:"Delhi national-calendar reference",observedOn:"2026-10-13"
};
const second={...first,source:"https://prokerala.com/calendar/2027"};
const sunrise=(date:string,seq:number,repeat=false):RitualVratObservation=>({
  date,paksha:"Krishna",tithi:"Ekadashi",sunrise:"06:13",
  tithiEnd:"17:01",tithiEndDate:date,
  sequence:seq,repeatedAtSunrise:repeat
});
describe("Wave 3T ritual certification must never follow from generic published calendar dates",()=>{
  it("counts second-publisher dates without upgrading local Puja-time or ritual validity",()=>{
    const r=festivalDateEvidenceStatus("diwali",2027,first.date,[first],[second]);
    expect(r.status).toBe("two-publisher-date-corroboration");
    expect(r.rawRecords).toBe(2);
    expect(r.distinctPublisherDomainCount).toBe(2);
    expect(r.exactPujaTimeCertified).toBe(false);
    expect(r.localRitualDateCertified).toBe(false);
    expect(r.safeForCeremonyFiltering).toBe(false);
  });
  it("counts different URLs of the SAME publisher only once",()=>{
    const copied={...first,source:"https://www.drikpanchang.com/another"};
    const r=festivalDateEvidenceStatus("diwali",2027,first.date,[first],[copied]);
    expect(r.status).toBe("one-publisher-date-only");
    expect(r.distinctPublisherDomainCount).toBe(1);
  });
  it("refuses to silently average contradictory published festival dates",()=>{
    const conflict={...second,date:"2027-10-28"};
    const r=festivalDateEvidenceStatus("diwali",2027,first.date,[first],[conflict]);
    expect(r.status).toBe("published-date-mismatch");
    expect(r.conflictingSourceCount).toBeGreaterThan(0);
    expect(r.safeForCeremonyFiltering).toBe(false);
  });
  it("audits actual complete festival catalog and checks Smarta/ISKCON variation separately",()=>{
    const rows=[2026,2027].flatMap(year=>festivalsForYear(year));
    const result=rows.map(f=>festivalDateEvidenceStatus(
      f.slug,f.year,f.date,festivalDateEvidence,independentFestivalDateChecks));
    expect(result).toHaveLength(38);
    expect(result.filter(x=>x.status==="two-publisher-date-corroboration")).toHaveLength(independentFestivalDateChecks.length);
    expect(result.filter(x=>x.status==="one-publisher-date-only")).toHaveLength(38-independentFestivalDateChecks.length);
    expect(result.every(x=>!x.localRitualDateCertified&&!x.exactPujaTimeCertified)).toBe(true);
    expect(festivalTraditionDateEvidence.some(x=>x.tradition==="ISKCON")).toBe(true);
  });
  it("validates sunrise Tithi recurrence without labeling it the fast or Parana day",()=>{
    const rows=[sunrise("2026-08-20",1),sunrise("2026-08-21",2,true)];
    const checked=auditVratSunriseRows("ekadashi",2026,rows);
    expect(checked.errors).toEqual([]);
    expect(checked.repeatedAtSunrise).toBe(1);
    expect(checked.actualFastDayCertified).toBe(false);
    expect(checked.paranaTimeCalculated).toBe(false);
    expect(checked.smarthaVaishnavaConventionResolved).toBe(false);
  });
  it("quarantines Delhi-like Purnima endpoints equal to the rounded sunrise minute",()=>{
    const row:RitualVratObservation={
      date:"2026-06-30",paksha:"Shukla",tithi:"Purnima",
      sunrise:"05:27",tithiEnd:"05:27",tithiEndDate:"2026-06-30",
      sequence:1,repeatedAtSunrise:false
    };
    const report=auditVratSunriseRows("purnima",2026,[row]);
    expect(report.errors).toEqual([]);
    expect(report.boundarySensitiveCount).toBe(1);
    expect(report.nearSunriseBoundaryRows[0].status).toBe("needs-independent-minute-review");
    expect(report.actualFastDayCertified).toBe(false);
    expect(report.paranaTimeCalculated).toBe(false);
    const farEarlier=auditVratSunriseRows("purnima",2026,[{...row,tithiEnd:"05:10"}]);
    expect(farEarlier.errors).toContain("transition-before-sunrise:2026-06-30");
    expect(farEarlier.boundarySensitiveCount).toBe(0);
  });
  it("fails closed on duplicate, backward, malformed and unsupported Vrat transitions",()=>{
    const rows=[
      sunrise("2026-08-21",1),
      {...sunrise("2026-08-20",2),tithiEndDate:"2026-08-19"}
    ];
    const checked=auditVratSunriseRows("ekadashi",2026,rows);
    expect(checked.errors.length).toBeGreaterThan(0);
    const wrong=auditVratSunriseRows("amavasya",2026,[sunrise("2026-08-20",1)]);
    expect(wrong.errors).toContain("wrong-tithi:2026-08-20");
  });
  it("rejects future year date drift and no-source date claims",()=>{
    expect(()=>festivalDateEvidenceStatus("diwali",2027,"2027-02-30",[],[])).toThrow();
    const r=festivalDateEvidenceStatus("diwali",2027,"2027-10-29",[],[]);
    expect(r.status).toBe("no-published-date");
    expect(r.safeForCeremonyFiltering).toBe(false);
  });
});
