import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {getPanchang} from "../lib/panchang";
import {festivalBySlugYear} from "../lib/festivals";
import {festivalTruthReferences} from "../lib/content-truth-references";
import {checkAgainstReference,checkPanchangIntegrity} from "../lib/content-truth-checks";

describe("external-source integrity ledger (snapshots, not circular fixtures)",()=>{
  for(const source of festivalTruthReferences){
    it(`checks independent ${source.id} against source-linked fact values`,async()=>{
      expect(source.source).toMatch(/^https:\/\/www\.drikpanchang\.com\//);
      const festival=festivalBySlugYear(source.festival,Number(source.date.slice(0,4)));
      expect(festival?.date).toBe(source.date);
      const city=findCityBySlug(source.city)!;
      const data=await getPanchang(new Date(source.date+"T06:00:00Z"),city);
      expect(checkPanchangIntegrity(data)).toEqual([]);
      expect(checkAgainstReference(data,source)).toEqual([]);
    });
  }
  it("flags explicit contradictions instead of rewriting references",async()=>{
    const ref=festivalTruthReferences[0];
    const city=findCityBySlug(ref.city)!;
    const data=await getPanchang(new Date(ref.date+"T06:00:00Z"),city);
    const corrupted={...data,tithiEnd:"00:01"};
    expect(checkAgainstReference(corrupted,ref).some(x=>x.field==="tithiEnd")).toBe(true);
    const corruptedWindow={...data,sunrise:"18:59",sunset:"06:01"};
    expect(checkPanchangIntegrity(corruptedWindow).some(x=>x.field==="solar-day")).toBe(true);
  });
});
