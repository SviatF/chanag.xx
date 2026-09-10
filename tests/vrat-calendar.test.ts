import {describe,expect,it} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {isVratIndexable} from "../lib/seo-policy";
import {calculateVratCalendar,findVratBySlug,vratCalendarSummary} from "../lib/vrat";

const mumbai=findCityBySlug("mumbai")!;
const delhi=findCityBySlug("delhi")!;
const chennai=findCityBySlug("chennai")!;

describe("Demand-backed Vrat calendar engine",()=>{
  it("accepts only the three supported lunar-reference clusters",()=>{
    expect(findVratBySlug("ekadashi")?.name).toBe("Ekadashi");
    expect(findVratBySlug("purnima")?.name).toBe("Purnima");
    expect(findVratBySlug("amavasya")?.name).toBe("Amavasya");
    expect(findVratBySlug("random-vrat")).toBeUndefined();
  });

  it("builds a full-year Ekadashi sunrise reference without fabricating ritual selection",()=>{
    const rows=calculateVratCalendar("ekadashi",2026,mumbai);
    expect(rows.length).toBeGreaterThanOrEqual(22);
    expect(rows.length).toBeLessThanOrEqual(28);
    expect(rows.every(row=>row.tithi==="Ekadashi")).toBe(true);
    expect(rows.every(row=>row.paksha==="Shukla"||row.paksha==="Krishna")).toBe(true);
    expect(rows.map(row=>row.date)).toEqual(rows.map(row=>row.date).slice().sort());
    expect(rows.every((row,index)=>row.sequence===index+1)).toBe(true);
  });

  it("keeps Purnima observations in Shukla Paksha",()=>{
    const rows=calculateVratCalendar("purnima",2026,mumbai);
    expect(rows.length).toBeGreaterThanOrEqual(11);
    expect(rows.length).toBeLessThanOrEqual(14);
    expect(rows.every(row=>row.tithi==="Purnima"&&row.paksha==="Shukla")).toBe(true);
  });

  it("keeps Amavasya observations in Krishna Paksha",()=>{
    const rows=calculateVratCalendar("amavasya",2026,mumbai);
    expect(rows.length).toBeGreaterThanOrEqual(11);
    expect(rows.length).toBeLessThanOrEqual(14);
    expect(rows.every(row=>row.tithi==="Amavasya"&&row.paksha==="Krishna")).toBe(true);
  });

  it("returns local sunrise and transition times in a stable format",()=>{
    const rows=calculateVratCalendar("purnima",2026,mumbai);
    expect(rows.length).toBeGreaterThan(0);
    for(const row of rows){
      expect(row.sunrise).toMatch(/^\d{2}:\d{2}$/);
      expect(row.tithiEnd).toMatch(/^(\d{2}:\d{2}|—)$/);
      expect(row.date).toMatch(/^2026-\d{2}-\d{2}$/);
      expect(row.tithiEndDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("is location-sensitive because the civil-date reference is local sunrise",()=>{
    const delhiRows=calculateVratCalendar("ekadashi",2026,delhi);
    const chennaiRows=calculateVratCalendar("ekadashi",2026,chennai);
    expect(delhiRows.length).toBeGreaterThan(0);
    expect(chennaiRows.length).toBeGreaterThan(0);
    expect(delhiRows[0].sunrise).not.toBe(chennaiRows[0].sunrise);
  });

  it("summarizes the yearly list and keeps indexation inside the rolling priority-city policy",()=>{
    const rows=calculateVratCalendar("ekadashi",2026,mumbai);
    const summary=vratCalendarSummary(rows);
    expect(summary.count).toBe(rows.length);
    expect(summary.shukla+summary.krishna).toBe(rows.length);
    expect(isVratIndexable("ekadashi",2026,"delhi")).toBe(true);
    expect(isVratIndexable("ekadashi",2026,"agra")).toBe(false);
    expect(isVratIndexable("ekadashi",2100,"delhi")).toBe(false);
    expect(isVratIndexable("unsupported",2026,"delhi")).toBe(false);
  });
});