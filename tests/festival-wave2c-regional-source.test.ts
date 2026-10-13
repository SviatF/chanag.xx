import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {festivalBySlugYear,festivalsForYear} from "../lib/festivals";
import {festivalPageIsIndexable} from "../lib/festival-expansion";
import {getRegionalFestivalObservance} from "../lib/festival-regional-observances";
import {festivalDateEvidence} from "./fixtures/festival-date-evidence";
import {festivalRegionalDateEvidence} from "./fixtures/festival-regional-date-evidence";

describe("Wave 2C: independently documented festival dates and regional variance",()=>{
  it("covers all 19 maintained 2027 Delhi reference dates exactly once",()=>{
    const refs=festivalDateEvidence.filter(r=>r.year===2027);
    expect(refs).toHaveLength(19);
    expect(new Set(refs.map(x=>x.slug)).size).toBe(19);
    expect(new Set(refs.map(x=>x.source)).size).toBe(1);
    for(const row of festivalsForYear(2027)){
      expect(refs.find(x=>x.slug===row.slug)?.date).toBe(row.date);
      expect(festivalPageIsIndexable(row.slug,2027)).toBe(false);
    }
  });
  it("distinguishes Kolkata Bengal Vijayadashami from general Dussehra in 2026",()=>{
    const ref=festivalRegionalDateEvidence[0];
    const f=festivalBySlugYear(ref.slug,ref.year)!;
    const local=getRegionalFestivalObservance(f,cityBySlug(ref.city));
    expect(f.date).toBe(ref.standardDate);
    expect(local?.date).toBe(ref.localDate);
    expect(local?.message).toContain("21 October 2026");
    expect(local?.message).toContain("20 October 2026");
    expect(getRegionalFestivalObservance(f,cityBySlug("delhi"))).toBeNull();
    expect(getRegionalFestivalObservance(festivalBySlugYear("dussehra",2027)!,cityBySlug("kolkata"))).toBeNull();
    const jsx=readFileSync("app/festivals/[festival]/[year]/[city]/page.tsx","utf8");
    expect(jsx).toContain("regionalObservance.message");
    expect(jsx).toContain("regionalObservance.date");
  });
});
