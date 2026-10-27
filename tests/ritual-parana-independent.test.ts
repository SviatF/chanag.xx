import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {calculateIndependentParanaGeometry,isEkadashiDvadashiNativeFast,parseGcalNativeDate,boundaryAlignment,predictStandardParana} from "../lib/ritual-parana-independent";

describe("Independent (from GCal implementation) research-only Parana geometry",()=>{
 it("rejects non-Ekadashi fasting flags rather than inflating ISKCON totals",()=>{
  expect(isEkadashiDvadashiNativeFast({sunriseTithi:"Purnima"})).toBe(false);
  expect(isEkadashiDvadashiNativeFast({sunriseTithi:"Astami"})).toBe(false);
  expect(isEkadashiDvadashiNativeFast({sunriseTithi:"Dvadasi (suitable for fasting)"})).toBe(true);
  expect(isEkadashiDvadashiNativeFast({sunriseTithi:"Ekadasi (suitable for fasting)"})).toBe(true);
 });
 it("uses civil date, and strictly rejects impossible/parana-not-next-day inputs",()=>{
  expect(parseGcalNativeDate("21 Nov 2026")).toBe("2026-11-21");
  expect(()=>parseGcalNativeDate("31 Feb 2027")).toThrow();
  expect(()=>calculateIndependentParanaGeometry(cityBySlug("delhi"),"2026-11-21","2026-11-23")).toThrow();
 });
 it("calculates GCal-independent sunrise/daylight third, Vedha indicators and Hari Vasara phase boundaries",()=>{
  const x=calculateIndependentParanaGeometry(cityBySlug("delhi"),"2027-01-03","2027-01-04");
  expect(x.sunrise.date).toBe("2027-01-04");
  expect(x.sunset.date).toBe("2027-01-04");
  expect(x.daylightThird.date).toBe("2027-01-04");
  expect(x.dwadashiAtParanaSunrise).toBe(true);
  expect(x.dwadashiWindow).not.toBeNull();
  expect(x.dwadashiWindow!.start.date).toMatch(/^2027-/);
  expect(x.dwadashiWindow!.firstQuarterEnds).toBeTruthy();
  expect(x.paranaWindowCertified).toBe(false);
  expect(x.safeForPublication).toBe(false);
  expect(x.mahadwadasiSubtypeCertified).toBe(false);
  const ordinary=predictStandardParana(x);
  expect(ordinary.valid).toBe(true);
  expect(ordinary.certifiedRitualRecommendation).toBe(false);
  expect(ordinary.start).toMatch(/^[0-2]\d:[0-5]\d$/);
 });
 it("keeps Trisprsa-like skipped-Dvadashi sunrise as a distinct, not-certified class",()=>{
  const x=calculateIndependentParanaGeometry(cityBySlug("delhi"),"2027-01-19","2027-01-20");
  expect(x.trispashaAstronomicalCandidate).toBe(true);
  expect(x.dwadashiEndedBeforeParanaSunrise).toBe(true);
  expect(x.dwadashiWindow?.firstQuarterEnds).toBeTruthy();
  expect(x.safeForPublication).toBe(false);
  expect(predictStandardParana(x).validMahadvadasiRule).toBe(false);
 });
 it("preserves minute-level boundary discrepancies for human review",()=>{
  const m=boundaryAlignment("07:14",{sunrise:"07:13",quarter:"10:21"});
  expect(m).toMatchObject({best:"sunrise",deltaMinutes:1,withinTolerance:true});
  expect(boundaryAlignment("07:14",{sunrise:"09:14"}).withinTolerance).toBe(false);
  expect(boundaryAlignment(null,{sunrise:"07:14"}).best).toBeNull();
 });
});
