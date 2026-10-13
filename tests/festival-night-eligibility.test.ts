import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {cityBySlug} from "../lib/cities";
import {festivalBySlugYear} from "../lib/festivals";
import {getPanchang} from "../lib/panchang";
import {getFestivalLocalReference} from "../lib/religious-integrity";
import {festivalNightEligibility} from "../lib/festival-night-eligibility";
import {addIsoDays} from "../lib/india-time";

async function evidence(kind:"janmashtami"|"diwali",year:2026|2027,citySlug="delhi"){
  const f=festivalBySlugYear(kind,year)!;
  const city=cityBySlug(citySlug);
  const date=new Date(`${f.date}T06:00:00Z`);
  const next=new Date(`${addIsoDays(f.date,1)}T06:00:00Z`);
  const [data,following]=await Promise.all([getPanchang(date,city),getPanchang(next,city)]);
  return {festival:f,data,result:festivalNightEligibility(kind,data,following)!};
}
function minutes(clock:string){const [h,m]=clock.split(":").map(Number);return h*60+m;}
describe("festival-specific lunar night eligibility backed by independent Delhi dates",()=>{
  it("Janmashtami 2026 Delhi: Ashtami expires DURING Nishita, not for its whole duration",async()=>{
    const {data,result}=await evidence("janmashtami",2026);
    // Drik 2026 New Delhi Janmashtami: Nishita 23:57–00:43, Ashtami ends 00:13 Sep 5.
    expect(result.status).toBe("partial");
    expect(result.overlap?.endDate).toBe("2026-09-05");
    expect(Math.abs(minutes(result.overlap!.end)-13)).toBeLessThanOrEqual(4);
    expect(Math.abs(minutes(result.period.start)-1437)).toBeLessThanOrEqual(5);
    expect(Math.abs(minutes(result.period.end)-43)).toBeLessThanOrEqual(5);
    expect(data.paksha).toBe("Krishna");
    expect(data.tithi).toBe("Ashtami");
  });
  it("Janmashtami 2027 Delhi: Ashtami ends BEFORE Nishita and no false overlap is shown",async()=>{
    const {result}=await evidence("janmashtami",2027);
    // Drik 2027 New Delhi: Ashtami ends 19:19 Aug 25; Nishita 00:01–00:45 Aug 26.
    expect(result.status).toBe("none");
    expect(result.overlap).toBeNull();
    expect(result.tithiEnd).toContain("19:");
  });
  it("Diwali 2026 Delhi: Amavasya covers the entire Pradosh and next sunrise",async()=>{
    const {festival,data,result}=await evidence("diwali",2026);
    // Drik Delhi: Pradosh 17:31–20:09 Nov 8; Amavasya ends 12:31 Nov 9.
    expect(result.status).toBe("full");
    expect(result.overlap?.start).toBe(result.period.start);
    expect(result.overlap?.end).toBe(result.period.end);
    expect(Math.abs(minutes(result.period.start)-1051)).toBeLessThanOrEqual(4);
    expect(Math.abs(minutes(result.period.end)-1209)).toBeLessThanOrEqual(5);
    const ref=getFestivalLocalReference(festival,data);
    expect(ref?.label).toBe("Pradosh reference");
    expect(ref?.note).toContain("Sthir Lagna");
  });
  it("Diwali 2027 Delhi: Amavasya ends during Pradosh, never display full evening as valid overlap",async()=>{
    const {result}=await evidence("diwali",2027);
    // Drik 2027: Amavasya ends 19:05 Oct 29 (all India)
    expect(result.status).toBe("partial");
    expect(result.overlap?.end).toMatch(/^19:0[3-7]$/);
    expect(result.overlap?.endDate).toBe("2027-10-29");
    expect(result.period.endDate).toBe("2027-10-29");
  });
  it("with inconsistent Tithi data, no fictional overlap is generated",async()=>{
    const {data}=await evidence("janmashtami",2026);
    const next=(await evidence("janmashtami",2027)).data;
    expect(festivalNightEligibility("janmashtami",data,next)).toBeNull();
    const matchingNext=await getPanchang(new Date("2026-09-05T06:00:00Z"),cityBySlug("delhi"));
    const impossible={...data,tithi:"Panchami"};
    const unresolved=festivalNightEligibility("janmashtami",impossible,matchingNext);
    expect(unresolved?.status).toBe("unverified");
    expect(unresolved?.overlap).toBeNull();
  });
  it("the city UI displays the actual Tithi overlap, not generic SEO ritual copy",()=>{
    const page=readFileSync("app/festivals/[festival]/[year]/[city]/page.tsx","utf8");
    expect(page).toContain("nightEvidence.explanation");
    expect(page).toContain("nightEvidence.overlap");
    expect(page).toContain("Sthir Lagna is not yet evaluated");
    expect(page).not.toContain("content.ritualBody");
  });
});
