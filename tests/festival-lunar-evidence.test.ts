import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {festivalBySlugYear,festivalsForYear} from "../lib/festivals";
import {getPanchang,type Panchang} from "../lib/panchang";
import {getFestivalTithiEvidence,nextTithiState} from "../lib/festival-lunar-evidence";
import {buildFestivalCityQualityContent} from "../lib/festival-content-engine";
import {getLunarMonthConventions} from "../lib/calendar-conventions";
import {getFestivalLocalReference} from "../lib/religious-integrity";

describe("festival-specific Tithi vs sunrise-state truth",()=>{
  it("never confuses a sunrise Tritiya with the Chaturthi that begins later",async()=>{
    const festival=festivalBySlugYear("ganesh-chaturthi",2026)!;
    const city=cityBySlug("ahmedabad");
    const date=new Date(festival.date+"T06:00:00Z");
    const data=await getPanchang(date,city);
    const evidence=getFestivalTithiEvidence(festival,data);
    expect(data.tithi).toBe("Tritiya");
    expect(evidence.key).toBe("begins-on-date");
    expect(evidence.target).toBe("Shukla Chaturthi");
    expect(evidence.explanation).toContain("next transition");
    expect(evidence.explanation).toContain(data.tithiEnd);
    const content=buildFestivalCityQualityContent(festival,city,data,getLunarMonthConventions(date,city,data),getFestivalLocalReference(festival,data));
    expect(content.directAnswer).toContain("Shukla Chaturthi");
    expect(content.directFacts.some(x=>x.label==="Festival Tithi begins")).toBe(true);
  });
  it("distinguishes Navami at sunrise and Dashami later on Dussehra",async()=>{
    const festival=festivalBySlugYear("dussehra",2026)!;
    const city=cityBySlug("hyderabad");
    const data=await getPanchang(new Date(festival.date+"T06:00:00Z"),city);
    const result=getFestivalTithiEvidence(festival,data);
    expect(data.tithi).toBe("Navami");
    expect(result.key).toBe("begins-on-date");
    expect(result.target).toBe("Shukla Dashami");
    expect(result.explanation).toContain(data.tithiEnd);
  });
  it("handles paksha change correctly at Purnima and Amavasya",()=>{
    expect(nextTithiState({paksha:"Shukla",tithi:"Purnima"})).toEqual({paksha:"Krishna",tithi:"Pratipada"});
    expect(nextTithiState({paksha:"Krishna",tithi:"Amavasya"})).toEqual({paksha:"Shukla",tithi:"Pratipada"});
    expect(nextTithiState({paksha:"Shukla",tithi:"Chaturdashi"})).toEqual({paksha:"Shukla",tithi:"Purnima"});
  });
  it("does not invent festival-specific lunar claims for solar or post-observance festivals",async()=>{
    const data=await getPanchang(new Date("2026-01-14T06:00:00Z"),cityBySlug("mumbai"));
    for(const slug of ["makar-sankranti","holi"]){
      const festival=festivalBySlugYear(slug,2026)!;
      expect(getFestivalTithiEvidence(festival,data).key).toBe("not-applicable");
    }
  });
  it("keeps unresolved festival markers explicit instead of forging a Puja clock",async()=>{
    const festival=festivalBySlugYear("ganesh-chaturthi",2026)!;
    const data=await getPanchang(new Date(festival.date+"T06:00:00Z"),cityBySlug("ahmedabad"));
    const artificial={...data,paksha:"Krishna" as const,tithi:"Ekadashi",tithiEnd:"16:00",tithiEndDate:data.date} satisfies Panchang;
    const result=getFestivalTithiEvidence(festival,artificial);
    expect(result.key).toBe("not-in-first-transition");
    expect(result.value).toBeNull();
    expect(result.explanation).toContain("not identified");
  });
  it("covers all catalog names for both years without claiming every observance rule",()=>{
    for(const year of [2026,2027]){
      for(const festival of festivalsForYear(year)){
        expect(festival.slug).toBeTruthy();
        expect(festival.pujaRule).toBeTruthy();
      }
    }
  });
});
