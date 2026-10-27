import {describe,it,expect} from "vitest";
import {classifyMahadvadashiSequence,identifySourceMahadvadashi} from "../lib/independent-mahadvadashi";
import {calculateIndependentParana,minutesBetween,researchParanaMethodFromIndependentKind} from "../lib/independent-parana";
const make=(date:string,sunriseIndex:number,arunodayaIndex=sunriseIndex)=>({date,sunriseIndex,arunodayaIndex});
describe("independent Mahadvadashi structural rules",()=>{
 it("identifies two Ekadashi sunrises as Unmilani on second day",()=>{
  const dates=[make("2027-03-03",10),make("2027-03-04",10),make("2027-03-05",11)];
  const x=classifyMahadvadashiSequence(dates,"2027-03-04");
  expect(x.kind).toBe("UNMILANI");
  expect(x.fastCandidates.smarta).toBe("2027-03-03");
  expect(x.fastCandidates.vaishnava).toBe("2027-03-04");
  expect(x.certified).toBe(false);
 });
 it("classifies Trisprsha when Ekadashi jumps to Trayodashi",()=>{
  const x=classifyMahadvadashiSequence([make("2027-01-18",9),make("2027-01-19",10),make("2027-01-20",12)],"2027-01-19");
  expect(x.kind).toBe("TRISPRSHA");
 });
 it("classifies Vyanjuli with two Dvadashi sunrises",()=>{
  const x=classifyMahadvadashiSequence([make("2027-01-18",10),make("2027-01-19",11),make("2027-01-20",11)],"2027-01-19");
  expect(x.kind).toBe("VYANJULI");
 });
 it("detects a later repeated full Moon Paksha-vardhini trigger",()=>{
  const seq=[10,11,12,13,14,14,0].map((n,i)=>make("2027-07-"+String(i+10).padStart(2,"0"),n));
  const x=classifyMahadvadashiSequence(seq,"2027-07-11");
  expect(x.kind).toBe("PAKSHA_VARDHINI");
 });
 it("labels non-Tithi Nakshatra kinds as unverified",()=>{
  expect(identifySourceMahadvadashi("Vijaya Mahadvadasi")).toBe("NAKSHATRA_REVIEW");
  expect(identifySourceMahadvadashi("Paksa vardhini Mahadvadasi")).toBe("PAKSHA_VARDHINI");
  expect(()=>classifyMahadvadashiSequence([make("2027-02-01",10),make("2027-02-03",11),make("2027-02-04",12)],"2027-02-03")).toThrow();
 });
});
describe("independent Parana method provenance",()=>{
 it("does not accept an original GCal subtype and isolates structural cases",()=>{
  expect(researchParanaMethodFromIndependentKind(null)).toBe("GCal-normal");
  expect(researchParanaMethodFromIndependentKind("TRISPRSHA")).toBe("GCal-trisprsha-review");
  expect(researchParanaMethodFromIndependentKind("UNMILANI")).toBe("GCal-trisprsha-review");
  expect(researchParanaMethodFromIndependentKind("VYANJULI")).toBe("GCal-trisprsha-review");
  expect(researchParanaMethodFromIndependentKind("PAKSHA_VARDHINI")).toBe("GCal-trisprsha-review");
  expect(researchParanaMethodFromIndependentKind("NAKSHATRA_REVIEW")).toBe("GCal-nakshatra-review");
  expect(researchParanaMethodFromIndependentKind("Vijaya Mahadvadasi" as never)).not.toBe("GCal-normal");
 });
});
describe("independently calculated Parana timing bounds",()=>{
 const t=(s:string)=>Date.parse(s);
 it("starts after sunrise/Hari Vasara and ends at first-third daylight or Dvadashi",()=>{
  const x=calculateIndependentParana({fastDate:"2027-01-19",paranaDate:"2027-01-20",
   sunrise:t("2027-01-20T01:30:00Z"),sunset:t("2027-01-20T12:30:00Z"),
   dwadashiStart:t("2027-01-19T21:30:00Z"),dwadashiEnd:t("2027-01-20T08:30:00Z"),method:"GCal-normal"});
  expect(x.from).toBe(t("2027-01-20T01:30:00Z"));
  expect(x.to).toBe(t("2027-01-20T05:10:00Z"));
  expect(x.certified).toBe(false);
 });
 it("retains lower-bound-only Parana when first-quarter exceeds one-third daylight",()=>{
  const x=calculateIndependentParana({fastDate:"2027-01-19",paranaDate:"2027-01-20",
   sunrise:t("2027-01-20T01:30:00Z"),sunset:t("2027-01-20T12:30:00Z"),
   dwadashiStart:t("2027-01-20T03:00:00Z"),dwadashiEnd:t("2027-01-20T12:00:00Z"),method:"GCal-normal"});
  expect(x.openEnded).toBe(true);
  expect(x.from).toBe(t("2027-01-20T05:15:00Z"));
  expect(x.to).toBeNull();
 });
 it("does not approve past-sunrise Dvadashi or Nakshatra special constraints",()=>{
  const base={fastDate:"2027-01-19",paranaDate:"2027-01-20",sunrise:t("2027-01-20T01:30Z"),sunset:t("2027-01-20T12:30Z"),
   dwadashiStart:t("2027-01-19T04:00Z"),dwadashiEnd:t("2027-01-20T00:00Z")};
  expect(calculateIndependentParana({...base,method:"GCal-normal"}).status).toBe("special-rule-review");
  expect(calculateIndependentParana({...base,method:"GCal-nakshatra-review"}).to).toBeNull();
 });
 it("compares source clock minutes in fixed IST with midnight rollover",()=>{
  expect(minutesBetween(t("2027-01-20T01:30Z"),"07:00")).toBe(0);
 });
});
