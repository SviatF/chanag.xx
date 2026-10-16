import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {regionalIngressCandidates,compareRegionalIngress,SANKRANTI_RULES}
  from "../lib/wave3au-sankranti-policy";

const h=3600_000;
const day={
  date:"2027-03-15",
  sunriseUtcMs:Date.UTC(2027,2,15,0,30), // 06:00 IST
  sunsetUtcMs:Date.UTC(2027,2,15,12,30)  // 18:00 IST
};
const event=(hFromSunrise:number)=>day.sunriseUtcMs+hFromSunrise*h;

describe("Wave 3AU: separate model sign-at-sunrise from regional month-start date",()=>{
  it("does not confuse Bengal midnight, Tamil sunset and Kerala 3/5-daylight cutoffs",()=>{
    const morning=regionalIngressCandidates(event(4),day);
    expect(morning.proposedMonthStart).toEqual({
      "bengal-midnight-v5":"2027-03-16",
      "tamil-sunset-v5":"2027-03-15",
      "kerala-three-fifths-v5":"2027-03-15"
    });
    const afterKerala=regionalIngressCandidates(event(8),day);
    expect(afterKerala.proposedMonthStart).toEqual({
      "bengal-midnight-v5":"2027-03-16",
      "tamil-sunset-v5":"2027-03-15",
      "kerala-three-fifths-v5":"2027-03-16"
    });
    const afterSunset=regionalIngressCandidates(event(13),day);
    expect(afterSunset.proposedMonthStart).toEqual({
      "bengal-midnight-v5":"2027-03-16",
      "tamil-sunset-v5":"2027-03-16",
      "kerala-three-fifths-v5":"2027-03-16"
    });
    expect(morning.ritualDateApproved).toBe(false);
    expect(morning.independentlyCertified).toBe(false);
  });
  it("correctly assigns exact ingress at sunset or Kerala 3/5 threshold",()=>{
    const keralaCutoff=event(7.2);
    expect(regionalIngressCandidates(keralaCutoff,day).proposedMonthStart["kerala-three-fifths-v5"])
      .toBe("2027-03-15");
    expect(regionalIngressCandidates(keralaCutoff+1,day).proposedMonthStart["kerala-three-fifths-v5"])
      .toBe("2027-03-16");
    expect(regionalIngressCandidates(day.sunsetUtcMs,day).proposedMonthStart["tamil-sunset-v5"])
      .toBe("2027-03-15");
    expect(regionalIngressCandidates(day.sunsetUtcMs+1,day).proposedMonthStart["tamil-sunset-v5"])
      .toBe("2027-03-16");
  });
  it("detects model shifts only when they change actual civil-date rule cutoffs",()=>{
    const earlier=regionalIngressCandidates(event(7.2)-60_000,day);
    const later=regionalIngressCandidates(event(7.2)+60_000,day);
    const delta=compareRegionalIngress(earlier,later);
    expect(delta.changedRules).toEqual(["kerala-three-fifths-v5"]);
    expect(delta.ritualPublicationAllowed).toBe(false);
    expect(compareRegionalIngress(earlier,earlier).changedRules).toEqual([]);
  });
  it("rejects corrupt, mismatched, missing or out-of-range astronomical clocks",()=>{
    expect(()=>regionalIngressCandidates(Number.NaN,day)).toThrow();
    expect(()=>regionalIngressCandidates(event(4),{...day,date:"2028-03-15"})).toThrow();
    expect(()=>regionalIngressCandidates(event(4),{...day,sunsetUtcMs:day.sunriseUtcMs-1})).toThrow();
    expect(()=>regionalIngressCandidates(event(4),{...day,date:"2027-02-30"})).toThrow();
  });
  it("requires SHA-pinned JPL sources, full city/event scan and prior 44 dawn cases",()=>{
    const source=readFileSync("scripts/wave3au-sankranti-regional-review.ts","utf8");
    expect(source).toContain("openVerifiedV6SiderealSource(originalText,anchorsText)");
    expect(source).toContain("validateSiderealTransitionTable(JSON.parse(nativeText))");
    expect(source).toContain("previous.changedSolarRashiClassifications!==44");
    expect(source).toContain("for(let i=0;i<36;i++)");
    expect(source).toContain("evaluated!==36*454");
    expect(source).toContain("sunClocks(city,indiaDate(oldEvent[0]))");
    expect(source).toContain("SE_CALC_SET");
    expect(source).toContain("siderealStateAtUtc(native");
    expect(source).toContain("independentCalendarAuthorityValidated:false");
    expect(source).toContain("productionV6ReleaseAllowed:false");
    expect(SANKRANTI_RULES).toHaveLength(3);
    for(const path of ["lib/panchang.ts","lib/calendar-conventions.ts",
      "lib/festivals.ts","lib/vrat.ts","lib/muhurat.ts"])
      expect(readFileSync(path,"utf8")).not.toContain("wave3au");
  });
});
