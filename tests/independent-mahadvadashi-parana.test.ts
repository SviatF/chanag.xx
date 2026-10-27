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
  expect(researchParanaMethodFromIndependentKind(null,26,27)).toBe("GCal-viddha-research");
  expect(researchParanaMethodFromIndependentKind(null,11,12)).toBe("GCal-viddha-research");
  expect(researchParanaMethodFromIndependentKind(null,10,11)).toBe("GCal-normal");
  expect(researchParanaMethodFromIndependentKind("TRISPRSHA")).toBe("GCal-trisprsha-research");
  expect(researchParanaMethodFromIndependentKind("UNMILANI")).toBe("GCal-unmilani-research");
  expect(researchParanaMethodFromIndependentKind("VYANJULI")).toBe("GCal-vyanjuli-research");
  expect(researchParanaMethodFromIndependentKind("PAKSHA_VARDHINI")).toBe("GCal-viddha-research");
  expect(researchParanaMethodFromIndependentKind("NAKSHATRA_REVIEW")).toBe("GCal-nakshatra-review");
  expect(()=>researchParanaMethodFromIndependentKind("Vijaya Mahadvadasi" as never)).toThrow(/GCal source strings are forbidden/);
 });
});
describe("full independent sunrise sequence date transfers (RESEARCH ONLY)",()=>{
 it("moves Viddha Ekadashi to following Dvadashi after Dashami at Arunodaya",()=>{
  const seq=[make("2027-10-24",24),make("2027-10-25",25,24),make("2027-10-26",26),make("2027-10-27",27)];
  const prior=classifyMahadvadashiSequence(seq,"2027-10-25");
  const moved=classifyMahadvadashiSequence(seq,"2027-10-26");
  expect(prior.fastCandidates.iskcon).toBeNull();
  expect(moved.fastCandidates.iskcon).toBe("2027-10-26");
  expect(moved.certified).toBe(false);
 });
 it("detects Ekadashi Kshaya: Arunodaya Ekadashi but Dvadashi at sunrise",()=>{
  const seq=[make("2027-07-29",24),make("2027-07-30",26,25),make("2027-07-31",27)];
  const result=classifyMahadvadashiSequence(seq,"2027-07-30");
  expect(result.fastCandidates.iskcon).toBe("2027-07-30");
  expect(result.reason).toContain("absent at both consecutive sunrises");
 });
 it("assigns complete Kshaya even when Ekadashi ended before Arunodaya",()=>{
  // Day before: Dasami sunrise; fast day: Dvadasi already at Arunodaya.
  // This was the remaining 2027-10-26 regional GCal gap.
  const seq=[make("2027-10-25",24,24),make("2027-10-26",26,26),make("2027-10-27",27,27)];
  const day=classifyMahadvadashiSequence(seq,"2027-10-26");
  expect(day.fastCandidates.iskcon).toBe("2027-10-26");
  expect(day.reason).toContain("Kshaya");
  expect(day.certified).toBe(false);
 });
 it("does not apply Kshaya transfer when an ordinary intervening Ekadashi sunrise exists",()=>{
  const seq=[make("2027-10-24",24,24),make("2027-10-25",25,25),make("2027-10-26",26,26),make("2027-10-27",27,27)];
  expect(classifyMahadvadashiSequence(seq,"2027-10-26").fastCandidates.iskcon).toBeNull();
 });
 it("defers Ekadashi to Vyanjuli Dvadashi even with near-boundary risk",()=>{
  const seq=[make("2026-08-22",9),make("2026-08-23",10),{...make("2026-08-24",11),nearBoundary:true},make("2026-08-25",11)];
  expect(classifyMahadvadashiSequence(seq,"2026-08-23").fastCandidates.iskcon).toBeNull();
  const special=classifyMahadvadashiSequence(seq,"2026-08-24");
  expect(special.kind).toBe("VYANJULI");
  expect(special.fastCandidates.iskcon).toBe("2026-08-24");
  expect(special.needsManualReview).toBe(true);
 });
 it("moves Paksha-vardhini rather than counting both consecutive fasts",()=>{
  const idx=[9,10,11,12,13,14,14,0,1,2].map((n,i)=>make("2027-06-"+String(i+13).padStart(2,"0"),n));
  expect(classifyMahadvadashiSequence(idx,"2027-06-14").fastCandidates.iskcon).toBeNull();
  const next=classifyMahadvadashiSequence(idx,"2027-06-15");
  expect(next.kind).toBe("PAKSHA_VARDHINI");
  expect(next.fastCandidates.iskcon).toBe("2027-06-15");
 });
 it("classifies Lahiri Sravana V i j a y a candidate on bright Dvadashi at consecutive sunrises",()=>{
  const seq=[
    {...make("2027-09-10",9),nakshatraIndex:19},
    {...make("2027-09-11",10),nakshatraIndex:20},
    {...make("2027-09-12",11),nakshatraIndex:21},
    {...make("2027-09-13",12),nakshatraIndex:21}
  ];
  expect(classifyMahadvadashiSequence(seq,"2027-09-11").fastCandidates.iskcon).toBeNull();
  const next=classifyMahadvadashiSequence(seq,"2027-09-12");
  expect(next.kind).toBe("NAKSHATRA_REVIEW");
  expect(next.nakshatraSubtype).toBe("VIJAYA");
  expect(next.fastCandidates.iskcon).toBe("2027-09-12");
  expect(next.certified).toBe(false);
 });
 it("rejects unsupported Nakshatra indexes instead of inventing special fasts",()=>{
  const seq=[{...make("2027-09-11",10),nakshatraIndex:20},{...make("2027-09-12",11),nakshatraIndex:30},make("2027-09-13",12)];
  expect(()=>classifyMahadvadashiSequence(seq,"2027-09-12")).toThrow(/Invalid independent dawn/);
 });
});
describe("independently calculated Parana timing bounds",()=>{
 const t=(s:string)=>Date.parse(s);
 it("calculates independently timed Viddha Parana on Trayodashi sunrise",()=>{
  const d=(v:string)=>Date.parse(v);
  const opts={fastDate:"2027-10-26",paranaDate:"2027-10-27",
   sunrise:d("2027-10-27T01:00:00Z"),sunset:d("2027-10-27T12:00:00Z"),
   dwadashiStart:d("2027-10-25T16:00:00Z"),dwadashiEnd:d("2027-10-26T15:00:00Z"),
   trayodashiEnd:d("2027-10-27T08:00:00Z"),method:"GCal-viddha-research" as const};
  const result=calculateIndependentParana(opts);
  expect(result.from).toBe(opts.sunrise);
  expect(result.to).toBe(d("2027-10-27T04:40:00Z"));
  expect(result.certified).toBe(false);
  expect(calculateIndependentParana({...opts,trayodashiEnd:null}).status).toBe("special-rule-review");
 });
 it("separately computes Unmilani and Vyanjuli from sunrise through Dvadasi/third daylight",()=>{
  const parse=(v:string)=>Date.parse(v);
  const day={fastDate:"2027-03-04",paranaDate:"2027-03-05",
   sunrise:parse("2027-03-05T01:00:00Z"),sunset:parse("2027-03-05T13:00:00Z"),
   dwadashiStart:parse("2027-03-04T14:00:00Z"),dwadashiEnd:parse("2027-03-05T04:00:00Z")};
  for(const method of ["GCal-unmilani-research","GCal-vyanjuli-research"] as const){
   const result=calculateIndependentParana({...day,method});
   expect(result.from).toBe(day.sunrise);
   expect(result.to).toBe(day.dwadashiEnd);
   expect(result.status).toBe("calculated-research-only");
   expect(result.certified).toBe(false);
  }
  const expired=calculateIndependentParana({...day,method:"GCal-vyanjuli-research",
    dwadashiEnd:parse("2027-03-05T00:30:00Z")});
  expect(expired.status).toBe("special-rule-review");
 });
 it("calculates Trisprsa Parana after Dvadashi expires before following sunrise",()=>{
  const t=(v:string)=>Date.parse(v);
  const start=t("2027-01-20T01:30Z"),sunset=t("2027-01-20T13:30Z");
  const result=calculateIndependentParana({
   fastDate:"2027-01-19",paranaDate:"2027-01-20",sunrise:start,sunset,
   dwadashiStart:t("2027-01-19T03:00Z"),dwadashiEnd:t("2027-01-19T23:00Z"),
   method:"GCal-trisprsha-research"});
  expect(result.from).toBe(start);
  expect(result.to).toBe(t("2027-01-20T05:30Z"));
  expect(result.certified).toBe(false);
 });
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
