import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {getVerifiedMuhuratClosure} from "../lib/verified-muhurat-closures";
import {getMonthlyMuhurat} from "../lib/muhurat";
import {delhiWeddingOctober2026Sources} from "./fixtures/delhi-wedding-oct2026-source-ledger";

describe("DATA-05: independently reviewed Delhi 2026 October Vivaha eligibility",()=>{
  it("has three independently published exact-city zero-date source records",()=>{
    expect(delhiWeddingOctober2026Sources).toHaveLength(3);
    expect(new Set(delhiWeddingOctober2026Sources.map(r=>r.publisher)).size).toBe(3);
    for(const row of delhiWeddingOctober2026Sources){
      expect(row.year).toBe(2026);
      expect(row.month).toBe(10);
      expect(row.eligibleDates).toBe(0);
      expect(row.city.toLowerCase()).toContain("delhi");
      expect(new URL(row.url).protocol).toBe("https:");
    }
  });
  it("returns a precisely named convention, not a blanket national or astrological verdict",()=>{
    const closure=getVerifiedMuhuratClosure("wedding",2026,10,cityBySlug("delhi"));
    expect(closure?.code).toBe("delhi-vivaha-2026-october-published-closure");
    expect(closure?.convention).toBe("Published New Delhi Vivaha Panchang Shuddhi");
    expect(closure?.reason).toBe("Published monthly Vivaha prohibitions");
    expect(closure?.headline).toContain("Delhi in October 2026");
    expect(closure?.explanation).toContain("zero Shubh Vivaha dates");
    expect(closure?.periodNote).toContain("different rule families");
    expect(closure?.alternativesNote).toContain("not a universal religious prohibition");
  });
  it("does not extrapolate to neighbours, different dates, other rites, or another year",()=>{
    for(const slug of ["ghaziabad","faridabad","kanpur","agra","kolkata","jaipur"]){
      expect(getVerifiedMuhuratClosure("wedding",2026,10,cityBySlug(slug))).toBeNull();
    }
    const delhi=cityBySlug("delhi");
    for(const [year,month] of [[2026,9],[2026,11],[2025,10],[2027,10]]){
      expect(getVerifiedMuhuratClosure("wedding",year,month,delhi)).toBeNull();
    }
    for(const event of ["griha-pravesh","vehicle-purchase","business-opening","naming-ceremony"]){
      expect(getVerifiedMuhuratClosure(event,2026,10,delhi)).toBeNull();
    }
  });
  it("prevents publishing ranked 100/100 wedding dates in this exact city-month",async()=>{
    const {rows}=await getMonthlyMuhurat("wedding",2026,10,cityBySlug("delhi"));
    expect(rows).toHaveLength(0);
  });
  it("routes the Delhi city-month page to regional closure metadata and render, never the generic ranking",()=>{
    const code=readFileSync("app/muhurat/[event]/[year]/[month]/[city]/page.tsx","utf8");
    const ui=readFileSync("components/VerifiedMuhuratClosurePage.tsx","utf8");
    expect(code).toContain("getVerifiedMuhuratClosure(p.event,year,month,city)");
    expect(code).toContain("if(closure)return <VerifiedMuhuratClosurePage");
    expect(ui).toContain("REVIEWED {isWedding?");
    expect(ui).toContain("marathi?");
    expect(ui).not.toContain("REVIEWED REGIONAL {isWedding?\"MARRIAGE\":\"HOUSE-ENTRY\"} CALENDAR · MAHARASHTRA");
    expect(ui).toContain("closure.convention");
    // URLs are audit-only and are not imported into production source.
    expect(readFileSync("lib/verified-muhurat-closures.ts","utf8")).not.toContain("drikpanchang.com");
  });
});
