import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {findCityBySlug,supportedCities} from "../lib/cities";
import {getVerifiedMuhuratClosure} from "../lib/verified-muhurat-closures";
import {getMonthlyMuhurat} from "../lib/muhurat";
import {marathiMarriage2025to2027} from "./fixtures/muhurat-closure-2025-27-evidence";

const allMaharashtra=supportedCities.filter(city=>city.state==="Maharashtra");
const reviewedYears=[2025,2026,2027] as const;
const reviewedMonths=[8,9,10] as const;

describe("Reviewed Marathi marriage calendar by state, year and month",()=>{
  it("keeps each of 9 calendar closures in a sourced evidence ledger",()=>{
    expect(allMaharashtra.length).toBeGreaterThanOrEqual(11);
    for(const year of reviewedYears){
      const sourceRows=marathiMarriage2025to2027.sourcesByYear[year];
      expect(sourceRows.length).toBeGreaterThanOrEqual(2);
      expect(new Set(sourceRows.map(source=>source.publisher)).size).toBeGreaterThanOrEqual(2);
      for(const source of sourceRows){
        expect(source.months).toEqual([8,9,10]);
        expect(source.verdict).toContain("zero");
      }
    }
  });
  it("includes an independently published 2026 and 2027 marriage calendar corroborating the three excluded months",()=>{
    for(const year of [2026,2027] as const){
      const sources=marathiMarriage2025to2027.sourcesByYear[year];
      const independent=sources.find(s=>s.publisher.includes("GaneshaSpeaks"));
      expect(independent).toBeDefined();
      expect(independent?.months).toEqual([8,9,10]);
      expect(independent?.verdict).toContain("zero");
      expect(independent?.location).toContain("not city-specific");
    }
  });
  it("only applies a named community convention to supported Maharashtra localities",()=>{
    for(const city of allMaharashtra){
      for(const year of reviewedYears){
        for(const month of reviewedMonths){
          const closure=getVerifiedMuhuratClosure("wedding",year,month,city);
          expect(closure?.headline).toContain(city.name);
          expect(closure?.month).toBe(month);
          expect(closure?.year).toBe(year);
          expect(closure?.reason).toBe("Chaturmas");
          expect(closure?.convention).toBe("Customary Marathi marriage calendar");
          if(year===2026)expect(closure?.observedPeriod).toEqual({from:"2026-07-25",through:"2026-11-20"});
          else expect(closure?.observedPeriod).toBeUndefined();
        }
      }
    }
    for(const slug of ["delhi","ahmedabad","chennai","kolkata","bengaluru","jaipur","surat"]){
      const city=findCityBySlug(slug)!;
      for(const year of reviewedYears)for(const month of reviewedMonths){
        if(slug==="delhi"&&year===2026&&month===10){
          expect(getVerifiedMuhuratClosure("wedding",year,month,city)?.convention).toBe("Published New Delhi Vivaha Panchang Shuddhi");
        }else expect(getVerifiedMuhuratClosure("wedding",year,month,city)).toBeNull();
      }
    }
  });
  it("does not extrapolate into adjacent months, years or unrelated ceremony types",()=>{
    const pune=findCityBySlug("pune")!;
    for(const [year,month] of [[2024,9],[2028,9],[2025,7],[2026,7],[2026,11],[2027,11]]){
      expect(getVerifiedMuhuratClosure("wedding",year,month,pune)).toBeNull();
    }
    for(const event of ["vehicle-purchase","gold-purchase","naming-ceremony"]){
      expect(getVerifiedMuhuratClosure(event,2026,10,pune)).toBeNull();
    }
  });
  it("does not promote any reviewed Maharashtra month to a wedding recommendation",async()=>{
    for(const city of allMaharashtra){
      for(const year of reviewedYears)for(const month of reviewedMonths){
        const {rows}=await getMonthlyMuhurat("wedding",year,month,city);
        expect(rows,city.slug+" "+year+"-"+month).toHaveLength(0);
      }
    }
  });
  it("renders non-generic city/year-specific zero-date explanations",()=>{
    const source=readFileSync("components/VerifiedMuhuratClosurePage.tsx","utf8");
    expect(source).toContain("closure.periodNote");
    expect(source).toContain("closure.alternativesNote");
    expect(source).toContain("{city.name} Panchang for 12");
    expect(source).not.toContain("All 31 civil dates of October");
    expect(source).not.toContain("scoreEvidence");
    for(const file of ["app/muhurat/[event]/[year]/[month]/page.tsx","app/muhurat/[event]/[year]/[month]/[city]/page.tsx"]){
      const page=readFileSync(file,"utf8");
      expect(page).toContain("getVerifiedMuhuratClosure");
      expect(page).toContain("VerifiedMuhuratClosurePage");
    }
  });
});
