import {describe,expect,it} from "vitest";
import {activeIndexCitySlugs,primaryMuhuratEvents,primaryVratTypes} from "../lib/seo-policy";
import {
  currentCityHotset,
  currentMuhuratHotset,
  currentVratHotset,
  homepageHotset,
  upcomingFestivalHotset,
} from "../lib/hotset-links";

const reference=new Date("2026-10-12T06:00:00Z");

describe("hotset internal discovery",()=>{
  it("prioritizes today, current month and current year for every active city",()=>{
    const rows=currentCityHotset(reference);
    expect(rows).toHaveLength(activeIndexCitySlugs().length);
    expect(new Set(rows.map(row=>row.slug))).toEqual(new Set(activeIndexCitySlugs()));
    for(const row of rows){
      expect(row.todayHref).toBe(`/panchang/${row.slug}/2026-10-12`);
      expect(row.monthHref).toBe(`/calendar/${row.slug}/2026/10`);
      expect(row.yearHref).toBe(`/calendar/${row.slug}/2026`);
    }
  });

  it("builds current-month Muhurat hotsets for all three primary events and 25 active cities",()=>{
    const groups=currentMuhuratHotset(reference);
    expect(groups.map(group=>group.event)).toEqual([...primaryMuhuratEvents]);
    expect(groups).toHaveLength(3);
    for(const group of groups){
      expect(group.parentHref).toBe(`/muhurat/${group.event}/2026/10`);
      expect(group.cityLinks).toHaveLength(activeIndexCitySlugs().length);
    }
  });

  it("builds current-year Vrat hotsets for every active city",()=>{
    const groups=currentVratHotset(reference);
    expect(groups.map(group=>group.vrat)).toEqual([...primaryVratTypes]);
    for(const group of groups){
      expect(group.parentHref).toBe(`/vrat/${group.vrat}/2026`);
      expect(group.cityLinks).toHaveLength(activeIndexCitySlugs().length);
    }
  });

  it("keeps festival hotset limited to the nearest validated upcoming festivals",()=>{
    const rows=upcomingFestivalHotset(reference,2);
    expect(rows).toHaveLength(2);
    expect(rows.map(row=>row.festival.slug)).toEqual(["dussehra","karwa-chauth"]);
    for(const row of rows){
      expect(row.festival.date>="2026-10-12").toBe(true);
      expect(row.cityLinks).toHaveLength(activeIndexCitySlugs().length);
    }
  });

  it("keeps homepage hotset compact and current-focused",()=>{
    const rows=homepageHotset(reference,"mumbai");
    expect(rows.length).toBe(11);
    expect(rows.some(row=>row.href==="/panchang/mumbai/2026-10-12")).toBe(true);
    expect(rows.some(row=>row.href==="/calendar/mumbai/2026/10")).toBe(true);
    expect(rows.every(row=>!row.href.includes("/2027/"))).toBe(true);
  });
});
