import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {festivals2026} from "../lib/festivals";
import {phase1PriorityCities,primaryMuhuratEvents,primaryVratTypes,yearlyIndexYears} from "../lib/seo-policy";
import {rollingDailyDates,rollingMonths,sitemapPriorityCities} from "../lib/seo-sitemap";
import {
  calendarMonthSsgPriority,
  calendarMonthStaticKey,
  cityCalendarYearSsgPriority,
  cityCalendarYearStaticKey,
  datedPanchangSsgPriority,
  datedPanchangStaticKey,
  festivalCitySsgPilot,
  festivalCitySsgPriority,
  festivalCityStaticKey,
  hinduCalendarYearSsgPriority,
  hinduCalendarYearStaticKey,
  muhuratCityMonthSsgPriority,
  muhuratCityMonthStaticKey,
  muhuratMonthSsgPriority,
  muhuratMonthStaticKey,
  muhuratSsgPriorityCitySlugs,
  vratCitySsgPriority,
  vratCityStaticKey,
  vratYearSsgPriority,
  vratYearStaticKey,
} from "../lib/static-seo-routes";

describe("SSG/ISR SEO architecture",()=>{
  it("pre-renders the 2026 festival priority matrix and keeps it duplicate-free",()=>{
    const expectedCount=phase1PriorityCities.length*festivals2026.length;
    expect(phase1PriorityCities.length).toBe(20);
    expect(festivals2026.length).toBe(19);
    expect(expectedCount).toBe(380);
    expect(festivalCitySsgPriority.length).toBe(expectedCount);
    expect(festivalCitySsgPilot).toBe(festivalCitySsgPriority);

    const keys=festivalCitySsgPriority.map(festivalCityStaticKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("ganesh-chaturthi/2026/ahmedabad");
    expect(keys).toContain("dussehra/2026/hyderabad");

    for(const city of phase1PriorityCities){
      expect(festivalCitySsgPriority.filter(item=>item.city===city)).toHaveLength(festivals2026.length);
    }
    for(const festival of festivals2026){
      expect(festivalCitySsgPriority.filter(item=>item.festival===festival.slug)).toHaveLength(phase1PriorityCities.length);
    }
  });

  it("pre-renders the full SEO-policy Vrat matrix",()=>{
    const years=yearlyIndexYears();
    expect(primaryVratTypes.length).toBe(3);
    expect(years.length).toBe(4);
    expect(vratYearSsgPriority).toHaveLength(primaryVratTypes.length*years.length);
    expect(vratCitySsgPriority).toHaveLength(primaryVratTypes.length*years.length*phase1PriorityCities.length);
    expect(vratYearSsgPriority).toHaveLength(12);
    expect(vratCitySsgPriority).toHaveLength(240);

    const yearKeys=vratYearSsgPriority.map(vratYearStaticKey);
    const cityKeys=vratCitySsgPriority.map(vratCityStaticKey);
    expect(new Set(yearKeys).size).toBe(yearKeys.length);
    expect(new Set(cityKeys).size).toBe(cityKeys.length);
  });

  it("pre-renders only explicit dated Panchang URLs from the live sitemap window",()=>{
    const dates=rollingDailyDates(14,45);
    expect(sitemapPriorityCities.length).toBe(20);
    expect(dates.length).toBe(60);
    expect(datedPanchangSsgPriority).toHaveLength(sitemapPriorityCities.length*dates.length);
    expect(datedPanchangSsgPriority).toHaveLength(1200);
    expect(datedPanchangSsgPriority.every(item=>item.date.length===1&&/^\d{4}-\d{2}-\d{2}$/.test(item.date[0]))).toBe(true);

    const keys=datedPanchangSsgPriority.map(datedPanchangStaticKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.some(key=>/^[^/]+$/.test(key))).toBe(false);
  });

  it("pre-renders monthly calendar URLs from the live sitemap window",()=>{
    const months=rollingMonths(2,12);
    expect(months.length).toBe(15);
    expect(calendarMonthSsgPriority).toHaveLength(sitemapPriorityCities.length*months.length);
    expect(calendarMonthSsgPriority).toHaveLength(300);

    const keys=calendarMonthSsgPriority.map(calendarMonthStaticKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("pre-renders the SEO-policy yearly Hindu calendar matrix",()=>{
    const years=yearlyIndexYears();
    expect(years.length).toBe(4);
    expect(hinduCalendarYearSsgPriority).toHaveLength(years.length);
    expect(hinduCalendarYearSsgPriority).toHaveLength(4);
    expect(cityCalendarYearSsgPriority).toHaveLength(sitemapPriorityCities.length*years.length);
    expect(cityCalendarYearSsgPriority).toHaveLength(80);

    const nationalKeys=hinduCalendarYearSsgPriority.map(hinduCalendarYearStaticKey);
    const cityKeys=cityCalendarYearSsgPriority.map(cityCalendarYearStaticKey);
    expect(new Set(nationalKeys).size).toBe(nationalKeys.length);
    expect(new Set(cityKeys).size).toBe(cityKeys.length);

    for(const city of sitemapPriorityCities){
      expect(cityCalendarYearSsgPriority.filter(item=>item.city===city.slug)).toHaveLength(years.length);
    }
  });

  it("pre-renders the Phase 7B Muhurat priority batch at exactly 165 pages",()=>{
    const priorityMonths=rollingMonths(0,4);
    expect(primaryMuhuratEvents).toHaveLength(3);
    expect(priorityMonths).toHaveLength(5);
    expect(muhuratSsgPriorityCitySlugs).toEqual([
      "mumbai","delhi","bengaluru","hyderabad","ahmedabad",
      "chennai","kolkata","surat","pune","jaipur",
    ]);
    expect(muhuratMonthSsgPriority).toHaveLength(15);
    expect(muhuratCityMonthSsgPriority).toHaveLength(150);
    expect(muhuratMonthSsgPriority.length+muhuratCityMonthSsgPriority.length).toBe(165);

    const baselineKeys=muhuratMonthSsgPriority.map(muhuratMonthStaticKey);
    const cityKeys=muhuratCityMonthSsgPriority.map(muhuratCityMonthStaticKey);
    expect(new Set(baselineKeys).size).toBe(baselineKeys.length);
    expect(new Set(cityKeys).size).toBe(cityKeys.length);

    for(const month of priorityMonths){
      expect(muhuratMonthSsgPriority.filter(item=>item.year===String(month.year)&&item.month===month.slug)).toHaveLength(primaryMuhuratEvents.length);
      for(const city of muhuratSsgPriorityCitySlugs){
        expect(muhuratCityMonthSsgPriority.filter(item=>item.year===String(month.year)&&item.month===month.slug&&item.city===city)).toHaveLength(primaryMuhuratEvents.length);
      }
    }
  });

  it("pre-renders priority festival pages while preserving ISR fallback",()=>{
    const source=readFileSync("app/festivals/[festival]/[year]/[city]/page.tsx","utf8");
    expect(source).toContain("generateStaticParams");
    expect(source).toContain("festivalCitySsgPilot");
    expect(source).toContain("export const dynamicParams=true");
    expect(source).toContain("export const revalidate=86400");
    expect(source).not.toContain('dynamic=\"force-dynamic\"');
  });

  it("pre-renders Vrat year and city pages while preserving ISR fallback",()=>{
    const yearSource=readFileSync("app/vrat/[vrat]/[year]/page.tsx","utf8");
    const citySource=readFileSync("app/vrat/[vrat]/[year]/[city]/page.tsx","utf8");
    expect(yearSource).toContain("generateStaticParams");
    expect(yearSource).toContain("vratYearSsgPriority");
    expect(yearSource).toContain("export const dynamicParams=true");
    expect(citySource).toContain("generateStaticParams");
    expect(citySource).toContain("vratCitySsgPriority");
    expect(citySource).toContain("export const dynamicParams=true");
    expect(yearSource).toContain("export const revalidate=604800");
    expect(citySource).toContain("export const revalidate=604800");
  });

  it("pre-renders explicit dated Panchang pages while keeping the undated today route on hourly ISR",()=>{
    const source=readFileSync("app/panchang/[city]/[[...date]]/page.tsx","utf8");
    expect(source).toContain("generateStaticParams");
    expect(source).toContain("datedPanchangSsgPriority");
    expect(source).toContain("export const dynamicParams=true");
    expect(source).toContain("export const revalidate=3600");
    expect(datedPanchangSsgPriority.every(item=>item.date.length===1)).toBe(true);
  });

  it("pre-renders sitemap-visible monthly calendars while preserving daily ISR fallback",()=>{
    const source=readFileSync("app/calendar/[city]/[year]/[month]/page.tsx","utf8");
    expect(source).toContain("generateStaticParams");
    expect(source).toContain("calendarMonthSsgPriority");
    expect(source).toContain("export const dynamicParams=true");
    expect(source).toContain("export const revalidate=86400");
  });

  it("pre-renders yearly calendar hubs while preserving daily ISR fallback",()=>{
    const nationalSource=readFileSync("app/hindu-calendar/[year]/page.tsx","utf8");
    const citySource=readFileSync("app/calendar/[city]/[year]/page.tsx","utf8");
    expect(nationalSource).toContain("generateStaticParams");
    expect(nationalSource).toContain("hinduCalendarYearSsgPriority");
    expect(nationalSource).toContain("export const dynamicParams=true");
    expect(nationalSource).toContain("export const revalidate=86400");
    expect(citySource).toContain("generateStaticParams");
    expect(citySource).toContain("cityCalendarYearSsgPriority");
    expect(citySource).toContain("export const dynamicParams=true");
    expect(citySource).toContain("export const revalidate=86400");
  });

  it("pre-renders the Muhurat priority batch while preserving daily ISR fallback",()=>{
    const baselineSource=readFileSync("app/muhurat/[event]/[year]/[month]/page.tsx","utf8");
    const citySource=readFileSync("app/muhurat/[event]/[year]/[month]/[city]/page.tsx","utf8");
    expect(baselineSource).toContain("generateStaticParams");
    expect(baselineSource).toContain("muhuratMonthSsgPriority");
    expect(baselineSource).toContain("export const dynamicParams=true");
    expect(baselineSource).toContain("export const revalidate=86400");
    expect(citySource).toContain("generateStaticParams");
    expect(citySource).toContain("muhuratCityMonthSsgPriority");
    expect(citySource).toContain("export const dynamicParams=true");
    expect(citySource).toContain("export const revalidate=86400");
  });

  it("keeps static assets asset-first and the Worker API-first",()=>{
    const wrangler=readFileSync("wrangler.jsonc","utf8");
    expect(wrangler).toContain('\"run_worker_first\": [\"/api/*\"]');
  });
});
