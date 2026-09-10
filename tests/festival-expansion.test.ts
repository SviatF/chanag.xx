import {describe,expect,it} from "vitest";
import {
  festivalCatalogSlugs,
  festivalCoverageSnapshot,
  festivalDateIsValidated,
  festivalIndexYears,
  festivalPageIsIndexable,
  nextValidatedFestival,
  validateFestivalYear
} from "../lib/festival-expansion";

describe("Demand-led festival expansion registry",()=>{
  it("treats 2026 as a complete structurally valid catalog year",()=>{
    const coverage=validateFestivalYear(2026);
    expect(coverage.expected).toBe(festivalCatalogSlugs.length);
    expect(coverage.present).toBe(coverage.expected);
    expect(coverage.missing).toEqual([]);
    expect(coverage.issues).toEqual([]);
    expect(coverage.valid).toBe(true);
  });

  it("reports missing 2027 festival records without fabricating them",()=>{
    const coverage=validateFestivalYear(2027);
    expect(coverage.valid).toBe(true);
    expect(coverage.present).toBeLessThan(coverage.expected);
    expect(coverage.missing).toContain("dhanteras");
    expect(coverage.missing).toContain("chhath-puja");
    expect(festivalDateIsValidated("dhanteras",2027)).toBe(false);
  });

  it("does not expose absent future years as validated festival pages",()=>{
    expect(validateFestivalYear(2028).present).toBe(0);
    expect(validateFestivalYear(2028).valid).toBe(false);
    expect(festivalPageIsIndexable("diwali",2028)).toBe(false);
  });

  it("keeps index years inside available structurally valid dataset coverage",()=>{
    const years=festivalIndexYears();
    expect(years).toContain(2026);
    expect(years).toContain(2027);
    expect(years).not.toContain(2028);
    expect(festivalCoverageSnapshot().map(item=>item.year)).toEqual([2026,2027]);
  });

  it("validates stored festival ISO dates before sitemap eligibility",()=>{
    expect(festivalDateIsValidated("diwali",2026)).toBe(true);
    expect(festivalDateIsValidated("diwali",2027)).toBe(true);
    expect(festivalDateIsValidated("unknown-festival",2026)).toBe(false);
  });

  it("returns no fake next festival after validated coverage ends",()=>{
    expect(nextValidatedFestival(new Date("2027-12-31T06:00:00Z"))).toBeNull();
  });

  it("returns the next real validated festival inside coverage",()=>{
    const next=nextValidatedFestival(new Date("2026-11-07T06:00:00Z"));
    expect(next?.slug).toBe("diwali");
    expect(next?.date).toBe("2026-11-08");
  });
});
