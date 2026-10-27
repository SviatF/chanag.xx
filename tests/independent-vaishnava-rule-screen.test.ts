import {describe,it,expect} from "vitest";
import {independentlyScreenVaishnavaDay} from "../lib/independent-vaishnava-rule-screen";
const fixture=(overrides:Record<string,unknown>={})=>({
 date:"2027-01-19",sunriseTithiIndex:10,arunodayaTithiIndex:10,followingSunriseTithiIndex:12,
 nearFiveMinuteAstronomicalBoundary:false,hariVasara:null,...overrides
});
describe("Independent partial Vedha / Hari Vasara research rule screen",()=>{
 it("flags Dvadashi kshaya without inventing a verified fasting date",()=>{
  const r=independentlyScreenVaishnavaDay(fixture());
  expect(r.requiresKshayaReview).toBe(true);
  expect(r.certifiedFastDate).toBeNull();
  expect(r.certifiedParana).toBeNull();
 });
 it("marks dashami during arunodaya as a blocker",()=>{
  const r=independentlyScreenVaishnavaDay(fixture({arunodayaTithiIndex:9,followingSunriseTithiIndex:11}));
  expect(r.tentativeFastEligibility).toBe("dashami-vedha-flag");
 });
 it("does not infer fasting from repeated ekadashi or other tithi",()=>{
  expect(independentlyScreenVaishnavaDay(fixture({followingSunriseTithiIndex:10})).requiresMahadvadashiReview).toBe(true);
  expect(independentlyScreenVaishnavaDay(fixture({sunriseTithiIndex:11})).tentativeFastEligibility).toBe("not-ekadashi-at-sunrise");
 });
 it("retains Hari Vasara first-quarter lower bound without calling it certified Parana",()=>{
  const obs=fixture({followingSunriseTithiIndex:11,hariVasara:{validOrder:true,
    dwadashiStart:{date:"2027-01-19",time:"23:01"},dwadashiEnd:{date:"2027-01-20",time:"20:14"},
    firstQuarterEnds:{date:"2027-01-20",time:"04:19"},researchEarliestPostSunriseAndQuarter:{date:"2027-01-20",time:"07:14"}}});
  const r=independentlyScreenVaishnavaDay(obs);
  expect(r.hariVasaraLowerBound).toBe("2027-01-20T07:14");
  expect(r.certifiedParana).toBeNull();
 });
 it("rejects out-of-range Tithi and invalid astronomical ordering",()=>{
  expect(()=>independentlyScreenVaishnavaDay(fixture({sunriseTithiIndex:30}))).toThrow();
  expect(()=>independentlyScreenVaishnavaDay(fixture({hariVasara:{validOrder:false}}))).toThrow();
 });
});
