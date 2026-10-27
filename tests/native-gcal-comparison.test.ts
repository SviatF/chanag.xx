import {describe,it,expect} from "vitest";
import {isGcalEkadashiFast,isoGcalNativeDate,shardFor} from "../lib/native-gcal-comparison";
describe("native GCal oracle must exclude non-Ekadashi fasting",()=>{
 it("does NOT interpret festival fasting as Ekadashi fasting",()=>{
  expect(isGcalEkadashiFast({date:"22 Mar 2027",sunriseTithi:"Purnima"})).toBe(false);
  expect(isGcalEkadashiFast({date:"15 Apr 2027",sunriseTithi:"Navami"})).toBe(false);
  expect(isGcalEkadashiFast({date:"3 Jan 2027",sunriseTithi:"Ekadasi (suitable for fasting)"})).toBe(true);
  expect(isGcalEkadashiFast({date:"19 Jan 2027",sunriseTithi:"Dvadasi (suitable for fasting)"})).toBe(true);
  expect(isGcalEkadashiFast({date:"2 Jan 2027",sunriseTithi:"Ekadasi (not suitable for fasting)"})).toBe(false);
 });
 it("deterministically includes each record exactly once across shards",()=>{
  for(const city of ["delhi","mumbai","kolkata","pune","chennai"]){
   for(const year of [2026,2027]){
    const shard=shardFor(city,year,16);
    expect(shard).toBeGreaterThanOrEqual(0);expect(shard).toBeLessThan(16);
    expect(shard).toBe(shardFor(city,year,16));
   }
  }
  expect(isoGcalNativeDate("4 Mar 2027")).toBe("2027-03-04");
 });
});
