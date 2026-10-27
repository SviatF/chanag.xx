import {describe,expect,it} from "vitest";
import {isGcalEkadashiFast,parseGcalNativeXml} from "../lib/gcal-native-xml.mjs";
describe("native GCal 11 original XML research-only interpretation",()=>{
 it("does not count Janmashtami, Gaura Purnima and Rama Navami as Ekadashi fasts",()=>{
  expect(isGcalEkadashiFast("Astami",["Sri Krsna Janmastami","(Fast today)"])).toBe(false);
  expect(isGcalEkadashiFast("Purnima",["Gaura Purnima","(Fast today)"])).toBe(false);
  expect(isGcalEkadashiFast("Navami",["Rama Navami","(Fast today)"])).toBe(false);
 });
 it("counts Ekadashi or Dvadashi fasting declared by original GCal",()=>{
  expect(isGcalEkadashiFast("Ekadasi (suitable for fasting)",[])).toBe(true);
  expect(isGcalEkadashiFast("Dvadasi (suitable for fasting)",[])).toBe(true);
  expect(isGcalEkadashiFast("Ekadasi (not suitable for fasting)",[])).toBe(false);
  expect(isGcalEkadashiFast("Dvadasi",["Fasting for Rama Ekadasi"])).toBe(true);
 });
 it("rejects partial original executable output instead of calling it a full-year match",()=>{
  const xml='<?xml version="1.0"?><xml><request name="Calendar" version="GCal 11"><arg name="latitude" val="+28.61667"/><arg name="longitude" val="+77.20000"/><arg name="timezone" val="+5.50000"/><arg name="dst" val="0"/><arg name="daycount" val="1"/></request></xml>';
  expect(()=>parseGcalNativeXml(xml,{city:"delhi",year:2027,lat:28.6139,lng:77.209})).toThrow(/Incomplete/);
 });
});
