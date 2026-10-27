import {describe,expect,it} from "vitest";
import {delhiDevutthana2026,validatePublishedParana,delhiParanaPublicationExample,normalizePublishedPlusClock} from "../lib/ritual-source-boundaries";
import {delhi2027AstaSinglePublisher,paranaPublicationSources} from "./fixtures/independent-parana-asta-ledger";
import {getVerifiedMuhuratClosure} from "../lib/verified-muhurat-closures";
import {findCityBySlug} from "../lib/cities";
describe("2026 Delhi published Parana / 2027 Asta independent-verification gate",()=>{
 it("requires an exact city, date, and tradition match before displaying published windows",()=>{
  expect(paranaPublicationSources.length).toBe(3);
  expect(validatePublishedParana(delhiDevutthana2026)).toEqual([]);
  for(const value of delhiDevutthana2026){
    const match=paranaPublicationSources.find(x=>x.tradition===value.tradition);
    expect(match).toMatchObject({publisherKey:value.publisherKey,date:value.paranaDate,start:value.start,end:value.end});
  }
  expect(delhiParanaPublicationExample("purnima","delhi",2026)).toBeNull();
  expect(delhiParanaPublicationExample("ekadashi","delhi",2025)).toBeNull();
  const variants=delhiDevutthana2026.filter(x=>x.fastDate==="2026-11-21");
  expect(variants).toHaveLength(2);
  expect(variants[0].end).not.toBe(variants[1].end);
 });
 it("does not reinterpret 24-plus after-midnight clocks as same-day events",()=>{
  expect(delhi2027AstaSinglePublisher).toHaveLength(2);
  expect(normalizePublishedPlusClock("2027-09-12","29:22+")).toBe("2027-09-13T05:22");
  expect(normalizePublishedPlusClock("2027-09-12","23:59")).toBe("2027-09-12T23:59");
  expect(()=>normalizePublishedPlusClock("2027-09-12","29:22")).toThrow();
  expect(()=>normalizePublishedPlusClock("2027-09-12","05:22+")).toThrow();
  expect(()=>normalizePublishedPlusClock("2027-02-30","29:22+")).toThrow();
  expect(delhi2027AstaSinglePublisher.find(x=>x.planet==="Jupiter")?.endLocal).toBe(normalizePublishedPlusClock("2027-09-12","29:22+"));
  expect(delhi2027AstaSinglePublisher.every(x=>x.status==="single-publisher-observer-visibility-unverified")).toBe(true);
  expect(new Set(delhi2027AstaSinglePublisher.map(x=>new URL(x.source).hostname))).toHaveProperty("size",1);
 });
 it("must not promote Asta snapshots to verified Wedding/Griha eligibility",()=>{
  const delhi=findCityBySlug("delhi")!;
  const city=findCityBySlug("mumbai")!;
  expect(getVerifiedMuhuratClosure("wedding",2027,8,delhi)).toBeNull();
  expect(getVerifiedMuhuratClosure("wedding",2027,8,city)?.convention).toBe("Customary Marathi marriage calendar");
  const source=String.raw`lib/verified-muhurat-closures.ts`;
  expect(source).not.toBe("");
 });
});
