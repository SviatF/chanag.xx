import {describe,expect,it} from "vitest";
import {getPanchang} from "../lib/panchang";
import {findCityBySlug} from "../lib/cities";
import {calculateVratCalendar} from "../lib/vrat";
import {festivalBySlugYear} from "../lib/festivals";
import {festivalDateEvidenceStatus} from "../lib/ritual-evidence-matrix";
import {festivalDateEvidence,independentFestivalDateChecks} from "./fixtures/festival-date-evidence";
import {delhiEkadashiExamples,delhiFestivalExamples,delhiEkadashiEvidence,delhiFestivalEvidence} from "../lib/independent-calendar-evidence";
import {delhiDevutthana2026,delhiParanaPublicationExample,validatePublishedParana} from "../lib/ritual-source-boundaries";

function minute(s:string){const [h,m]=s.split(":").map(Number);return 60*h+m;}
function near(actual:string,expected:string,tol=2){expect(Math.abs(minute(actual)-minute(expected)),`${actual} vs source ${expected}`).toBeLessThanOrEqual(tol);}
const delhi=findCityBySlug("delhi");
if(!delhi)throw Error("Delhi missing from source registry");

describe("Source-dated independent publisher controls — locality and method scoped",()=>{
  it("matches five lunar/solar and locally excluded clock checkpoints, 22 Oct 2026 Delhi",async()=>{
    const p=await getPanchang(new Date("2026-10-22T06:00:00Z"),delhi);
    expect([p.date,p.tithi,p.paksha,p.nakshatra,p.yoga,p.karana]).toEqual(["2026-10-22","Ekadashi","Shukla","Shatabhisha","Vriddhi","Vishti"]);
    // Independent publicly available observations: Drik Panchang, Udyog Jyotish;
    // source details in docs/audits/INDEPENDENT_PUBLISHED_CALENDAR_2026-10-26.md.
    near(p.sunrise,"06:26",1);
    near(p.sunset,"17:45",1);
    near(p.tithiEnd,"14:48",2);
    near(p.nakshatraEnd,"20:49",2);
    near(p.yogaEnd,"23:40",2);
    near(p.karanaEnd,"14:48",2);
    near(p.rahu.start,"13:30",1);
    near(p.rahu.end,"14:55",1);
    expect(p.abhijit).toBeTruthy();
    near(p.abhijit!.start,"11:43",2);
    near(p.abhijit!.end,"12:28",2);
  });
  it("does not mislabel Smarta fasting / Vaishnava fasting as sunrise-Tithi observations",()=>{
    expect(delhiEkadashiExamples.map(x=>x.year)).toEqual([2026,2027]);
    const rows2026=calculateVratCalendar("ekadashi",2026,delhi).map(x=>x.date);
    const rows2027=calculateVratCalendar("ekadashi",2027,delhi).map(x=>x.date);
    expect(rows2026).not.toContain("2026-11-20");
    expect(rows2026).not.toContain("2026-11-21");
    expect(rows2027).not.toContain("2027-01-18");
    expect(rows2027).toContain("2027-01-19");
    expect(delhiEkadashiEvidence("ekadashi",2026,"mumbai")).toBeNull();
  });
  it("does not merge published Parana end-times of distinct Delhi fasting traditions",()=>{
    expect(validatePublishedParana(delhiDevutthana2026)).toEqual([]);
    expect(delhiDevutthana2026).toHaveLength(3);
    expect(new Set(delhiDevutthana2026.map(x=>x.publisherKey)).size).toBe(2);
    expect(delhiDevutthana2026.filter(x=>x.fastDate==="2026-11-21").map(x=>x.end)).toEqual(["08:56","10:21"]);
    expect(delhiDevutthana2026.every(x=>x.ritualMethodCertified===false&&!x.computedByPanchvani)).toBe(true);
    expect(delhiParanaPublicationExample("ekadashi","delhi",2026)).not.toBeNull();
    expect(delhiParanaPublicationExample("ekadashi","kanpur",2026)).toBeNull();
    expect(delhiParanaPublicationExample("ekadashi","delhi",2027)).toBeNull();
    expect(validatePublishedParana([{...delhiDevutthana2026[0],end:"13:00"}])).toContain("Smarta/2026-11-20:invalid-parana-clock");
  });
  it("requires two dated publication sources and does not promote 2027 festival city URLs",()=>{
    for(const [slug,day] of [["makar-sankranti","2027-01-15"],["akshaya-tritiya","2027-05-09"]] as const){
      expect(festivalBySlugYear(slug,2027)?.date).toBe(day);
      expect(delhiFestivalEvidence(slug,2027,"mumbai")).toBeNull();
    }
    expect(delhiFestivalExamples.every(x=>x.independentRitualTimingCertified===false)).toBe(true);
    for(const slug of ["akshaya-tritiya","chhath-puja"]){
      const ref=festivalBySlugYear(slug,2027)!;
      const result=festivalDateEvidenceStatus(slug,2027,ref.date,festivalDateEvidence,independentFestivalDateChecks);
      expect(result.status).toBe("two-publisher-date-corroboration");
      expect(result.safeForCeremonyFiltering).toBe(false);
    }
  });
});
