import {describe,expect,it} from "vitest";
import {festivalBySlugYear,festivalsForYear} from "../lib/festivals";
import {festivalDateEvidence,festivalTraditionDateEvidence} from "./fixtures/festival-date-evidence";
import {festivalIndexYears} from "../lib/festival-expansion";

describe("Wave 2D: source coverage and observance distinction",()=>{
  it("compares all maintained festival dates in both years against cited local calendar observations",()=>{
    for(const year of [2026,2027]){
      const maintained=festivalsForYear(year);
      const sources=festivalDateEvidence.filter(ref=>ref.year===year);
      expect(maintained).toHaveLength(19);
      expect(sources).toHaveLength(19);
      expect(new Set(sources.map(s=>s.slug)).size).toBe(19);
      for(const ref of sources){
        expect(ref.source).toMatch(/^https:\/\/www\.drikpanchang\.com\//);
        expect(ref.sourceLocality).toBeTruthy();
        expect(festivalBySlugYear(ref.slug,year)?.date).toBe(ref.date);
      }
    }
    expect(new Set(festivalDateEvidence.map(s=>s.source)).size).toBeLessThan(38);
  });
  it("keeps Smarta Rama Navami as base date but records ISKCON separately",()=>{
    expect(festivalBySlugYear("rama-navami",2026)?.date).toBe("2026-03-26");
    const smarta=festivalTraditionDateEvidence.find(v=>v.tradition==="Smarta");
    const iskcon=festivalTraditionDateEvidence.find(v=>v.tradition==="ISKCON");
    expect(smarta?.date).toBe("2026-03-26");
    expect(iskcon?.date).toBe("2026-03-27");
    expect(smarta?.source).toBe(iskcon?.source);
  });
  it("does not auto-open 2027 or change indexable festival years",()=>{
    expect(festivalIndexYears()).toEqual([2026]);
  });
});
