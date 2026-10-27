import {describe,expect,it} from "vitest";
import {parseGcalAnnualText,isoDayGap} from "../lib/gcal-annual-parser.mjs";

const fixture=`Pausa (Narayana) Masa, Gaurabda 540      GCal 11, Build 5
                         Delhi [India] (28N40 77E13, +5:30)
  18 Jan 2027 Mo   Dasami                           G Krittika
  19 Jan 2027 Tu   Ekadasi (suitable for fasting)    G Rohini          *
                  Trisprsa Mahadvadasi
                  Fasting for Putrada Ekadasi
  20 Jan 2027 We   Trayodasi                        G Mrigasira
                  Break fast 07:14 (sunrise) - 10:46 (1/3 of daylight) LT
   3 Mar 2027 We   Ekadasi (not suitable for fasting)K Purva-asadha
   4 Mar 2027 Th   Ekadasi (suitable for fasting)    K Uttara-asadha   *
                  Unmilani Mahadvadasi
                  Fasting for Vijaya Ekadasi
   5 Mar 2027 Fr   Dvadasi                          K Sravana
                  Break fast 06:42 (sunrise) - 09:55 (end of tithi) LT
  16 Jun 2027 We   Dvadasi (suitable for fasting)    G Citra
                  Paksa vardhini Mahadvadasi
                  Fasting for Pandava Nirjala Ekadasi
  17 Jun 2027 Th   Trayodasi                         G Visakha
                  Break fast 06:04 (sunrise) - 06:05 (end of naksatra) LT
  19 Mar 2027 Fr   Dvadasi                          G Aslesa
                  Break fast 07:14 (1/4 of tithi) - 10:28 (1/3 of daylight) LT`;
describe("GCAL independent export annual parser fail-closed",()=>{
 const result=parseGcalAnnualText(fixture,{city:"Delhi",year:2027});
 it("distinguishes source fast date from sunrise Ekadasi and repeated Vedha",()=>{
  expect(result.fasts.map(x=>x.date)).toEqual(["2027-01-19","2027-03-04","2027-06-16"]);
  expect(result.ineligibleEkadashi).toContain("2027-03-03");
  expect(result.pairs[1]).toMatchObject({prevNotSuitable:true,paranaDate:"2027-03-05"});
 });
 it("captures Mahadvadasi and Trayodasi-at-sunrise Parana separately",()=>{
  expect(result.pairs[0]).toMatchObject({dwadashiExpiredBeforeParanaSunrise:true,paranaSunriseTithi:"Trayodasi"});
  expect(result.pairs[0].mahadvadasi[0]).toContain("Trisprsa");
  expect(result.pairs[1].mahadvadasi[0]).toContain("Unmilani");
  expect(result.pairs[2].mahadvadasi[0]).toBe("Paksa vardhini Mahadvadasi");
  expect(result.summary.paranaEndNakshatra).toBe(1);
  expect(result.summary.paranaWindowsUnder15Minutes).toBe(1);
  expect(result.pairs[1].parana).toMatchObject({end:"09:55",endReason:"end of tithi"});
 });
 it("rejects dishonest provenance, locale and civil clock regressions",()=>{
  expect(()=>parseGcalAnnualText(fixture,{city:"Bombay",year:2027})).toThrow(/city mismatch/);
  expect(()=>parseGcalAnnualText(fixture.replace("GCal 11, Build 5","GCal 9"),{city:"Delhi",year:2027})).toThrow(/software build/);
  expect(isoDayGap("2027-03-03","2027-03-05")).toBe(2);
  expect(result.warnings).toContain("insufficient-days:9");
 });
 it("preserves source-only Parana lower bound without inventing a closing time",()=>{
  const mumbai=fixture.replaceAll("Delhi [India]","Bombay [India]").replace(
    "Break fast 06:42 (sunrise) - 09:55 (end of tithi) LT",
    "Break fast after 10:50 (1/4 of tithi) LT");
  const compared=parseGcalAnnualText(mumbai,{city:"Bombay",year:2027});
  const parana=compared.pairs[1].parana;
  expect(parana).toMatchObject({validClock:true,openEnded:true,start:"10:50",end:null,startReason:"1/4 of tithi"});
  expect(compared.summary.openEndedParana).toBe(1);
  expect(compared.summary.unparsedParana).toBe(0);
 });
});