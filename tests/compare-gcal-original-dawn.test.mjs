import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {normalizeOriginalGcalTithiIndex} from "../scripts/compare-gcal-original-dawn.mjs";

describe("GCal original Tithi one-based, reversed Paksha rotation vs Swiss zero-based",()=>{
 it("maps waxing Purnima to independent index 14",()=>{
  assert.equal(normalizeOriginalGcalTithiIndex(30),14);
 });
 it("maps waning Pratipada to independent index 15",()=>{
  assert.equal(normalizeOriginalGcalTithiIndex(1),15);
 });
 it("maps waxing Navami to independent index 8",()=>{
  assert.equal(normalizeOriginalGcalTithiIndex(24),8);
 });
 it("maps waning Navami to independent index 23",()=>{
  assert.equal(normalizeOriginalGcalTithiIndex(9),23);
 });
 it("rejects an out-of-range original GCal tithi index rather than masking source errors",()=>{
  for(const v of [0,31,-1,NaN,1.5])
   assert.throws(()=>normalizeOriginalGcalTithiIndex(v),/Invalid original/);
 });
});
