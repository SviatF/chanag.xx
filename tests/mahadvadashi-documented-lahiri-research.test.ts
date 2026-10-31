import {describe,it,expect} from "vitest";
import {documentedMahadvadashiPredicates,MAHADVADASHI_PUBLISH_GUARD,
 type IndependentRuleDay} from "../lib/mahadvadashi-documented-rule-research";
import {directlySolveSwissLahiriNakshatraIngress,DIRECT_LAHIRI_RELEASE_GUARD}
 from "../lib/direct-swiss-lahiri-nakshatra-research";
const mk=()=>{
 const start=Date.UTC(2027,0,1);
 return Array.from({length:10},(_,i):IndependentRuleDay=>({
  date:new Date(start+i*86400000).toISOString().slice(0,10),
  sunriseTithi:9,arunodayaTithi:9,sunsetTithi:9,
  swissNakshatra:10,jplNakshatra:10}));
};
const classify=(days:IndependentRuleDay[],source:"swiss-lahiri"|"jpl-lahiri-anchored"="swiss-lahiri")=>
 documentedMahadvadashiPredicates(days,days[1].date,source);
describe("independent GCal-documented observance decision predicates",()=>{
 it("Unmilani requires TWO clean consecutive Ekadashi sunrises",()=>{
  const a=mk();a[0].sunriseTithi=10;a[0].arunodayaTithi=10;
  a[1].sunriseTithi=10;a[1].arunodayaTithi=10;
  expect(classify(a).family).toBe("Unmilani");
  a[0].arunodayaTithi=9;
  expect(classify(a).family).toBe("NO_DOCUMENTED_SUBTYPE");
 });
 it("Trisprsha requires Ekadashi at sunrise and Trayodashi at next sunrise",()=>{
  const a=mk();
  a[1].sunriseTithi=10;a[1].arunodayaTithi=10;a[2].sunriseTithi=12;
  expect(classify(a).family).toBe("Trisprsha");
  // This boundary condition can resemble the source subtype in a different
  // ephemeris, but is NOT the documented proof of Trisprsha today.
  a[1].sunriseTithi=11;a[1].arunodayaTithi=10;
  expect(classify(a).family).toBe("NO_DOCUMENTED_SUBTYPE");
  expect(classify(a).nearBoundaryNotARule).toBe(true);
 });
 it("Vyanjuli requires two Dvadasi sunrises following a clean Ekadashi",()=>{
  const a=mk();a[0].sunriseTithi=10;a[0].arunodayaTithi=10;
  a[1].sunriseTithi=11;a[2].sunriseTithi=11;
  expect(classify(a).family).toBe("Vyanjuli");
  a[2].sunriseTithi=12;
  expect(classify(a).family).toBe("NO_DOCUMENTED_SUBTYPE");
 });
 it("Paksha-vardhini is a LATER repeated full/new moon near sunrise",()=>{
  const a=mk();a[0].sunriseTithi=10;a[0].arunodayaTithi=10;
  a[1].sunriseTithi=11;a[2].sunriseTithi=12;
  a[4].sunriseTithi=14;a[5].sunriseTithi=14;
  expect(classify(a).family).toBe("Paksha-vardhini");
  a[5].sunriseTithi=15;
  expect(classify(a).family).toBe("NO_DOCUMENTED_SUBTYPE");
 });
 it("Vijaya and Jaya MUST NOT share one repeat-Nakshatra test",()=>{
  const a=mk();a[0].sunriseTithi=10;a[0].arunodayaTithi=10;
  a[1].sunriseTithi=11;a[1].sunsetTithi=11;
  a[2].sunriseTithi=12;a[1].swissNakshatra=21;a[2].swissNakshatra=22;
  expect(classify(a).family).toBe("Vijaya");
  a[1].swissNakshatra=6;
  expect(classify(a).family).toBe("NO_DOCUMENTED_SUBTYPE");
  a[2].sunriseTithi=11;
  expect(classify(a).family).toBe("Jaya");
 });
 it("sidereal source is a distinct input and not a hidden GCal oracle",()=>{
  const a=mk();a[0].sunriseTithi=10;a[1].sunriseTithi=11;
  a[1].sunsetTithi=11;
  a[1].swissNakshatra=21;a[1].jplNakshatra=22;
  expect(classify(a).family).toBe("Vijaya");
  expect(classify(a,"jpl-lahiri-anchored").family).toBe("NO_DOCUMENTED_SUBTYPE");
  expect(MAHADVADASHI_PUBLISH_GUARD.publicRitualApproval).toBe(false);
 });
 it("numerically solves direct Swiss Lahiri 2027-09-13 21→22 ingress independently of GCal",()=>{
  const jpl=Date.parse("2027-09-13T00:34:40.836Z");
  const root=directlySolveSwissLahiriNakshatraIngress(jpl,22);
  expect(Math.abs(root.swissMinusJplSeconds)).toBeLessThan(600);
  expect(root.swissMoonIndexAfterSolvedRoot).toBe(22);
  expect(root.independentlyCertifiedAyanamsa).toBe(false);
  expect(DIRECT_LAHIRI_RELEASE_GUARD.publicationAuthorized).toBe(false);
 });
});
