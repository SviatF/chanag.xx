import {afterEach,describe,expect,it,vi} from "vitest";
import {findCityBySlug} from "../lib/cities";
import {buildCityContentProfile} from "../lib/city-content-profile";
import {festivalCityPageIsIndexable} from "../lib/festival-expansion";
import {
  activeIndexCitySlugs,
  isDailyIndexable,
  isMonthlyIndexable,
  isMonthlyMuhuratIndexable,
  isPriorityCity,
  isRegionalIndexable,
  isVratIndexable,
  isWave2ControlledCity,
  isYearlyCalendarIndexable,
  phase1PriorityCities,
  primaryMuhuratEvents,
  primaryVratTypes,
  wave2ControlledCities,
} from "../lib/seo-policy";
import {rollingDailyDates,rollingMonths} from "../lib/seo-sitemap";

const reference=new Date("2026-10-12T12:00:00Z");
const disclaimerPattern=/not (?:financial|legal|medical|professional|personalized) advice|not a (?:recommendation|substitute|guaranteed|personalized)|qualified practitioner|accuracy\s*&\s*limitations|explicit limitations/i;

afterEach(()=>vi.useRealTimers());

describe("Wave 2 controlled city activation",()=>{
  it("activates exactly five new cities on top of the 20-city baseline",()=>{
    vi.useFakeTimers();vi.setSystemTime(reference);
    expect(phase1PriorityCities).toHaveLength(20);
    expect(wave2ControlledCities).toEqual(["pimpri-chinchwad","ghaziabad","ludhiana","agra","nashik"]);
    expect(activeIndexCitySlugs()).toHaveLength(25);
    expect(new Set(activeIndexCitySlugs()).size).toBe(25);
    for(const slug of wave2ControlledCities){
      expect(isPriorityCity(slug)).toBe(true);
      expect(isWave2ControlledCity(slug)).toBe(true);
    }
  });

  it("limits Wave 2 Daily Panchang to -3/+14 days",()=>{
    vi.useFakeTimers();vi.setSystemTime(reference);
    for(const city of wave2ControlledCities){
      const allowed=rollingDailyDates(14,45).filter(date=>isDailyIndexable(city,date));
      expect(allowed).toHaveLength(18);
      expect(allowed[0]).toBe("2026-10-09");
      expect(allowed.at(-1)).toBe("2026-10-26");
      expect(isDailyIndexable(city,"2026-10-08")).toBe(false);
      expect(isDailyIndexable(city,"2026-10-27")).toBe(false);
    }
  });

  it("keeps Wave 2 calendars to current month and current year only",()=>{
    vi.useFakeTimers();vi.setSystemTime(reference);
    const months=rollingMonths(2,12);
    for(const city of wave2ControlledCities){
      const allowedMonths=months.filter(item=>isMonthlyIndexable(city,item.year,item.month));
      expect(allowedMonths).toEqual([{year:2026,month:10,slug:"10"}]);
      expect(isYearlyCalendarIndexable(2026,city)).toBe(true);
      expect(isYearlyCalendarIndexable(2025,city)).toBe(false);
      expect(isYearlyCalendarIndexable(2027,city)).toBe(false);
    }
  });

  it("keeps Wave 2 Muhurat to current month and Vrat to current year",()=>{
    vi.useFakeTimers();vi.setSystemTime(reference);
    const months=rollingMonths(0,12);
    for(const city of wave2ControlledCities){
      for(const event of primaryMuhuratEvents){
        const allowed=months.filter(item=>isMonthlyMuhuratIndexable(event,item.year,item.month,city));
        expect(allowed).toEqual([{year:2026,month:10,slug:"10"}]);
      }
      for(const vrat of primaryVratTypes){
        expect(isVratIndexable(vrat,2026,city)).toBe(true);
        expect(isVratIndexable(vrat,2025,city)).toBe(false);
        expect(isVratIndexable(vrat,2027,city)).toBe(false);
      }
    }
  });

  it("opens validated 2026 festival city pages but holds back regional expansion",()=>{
    vi.useFakeTimers();vi.setSystemTime(reference);
    for(const citySlug of wave2ControlledCities){
      const city=findCityBySlug(citySlug)!;
      expect(festivalCityPageIsIndexable("diwali",2026,citySlug)).toBe(true);
      expect(festivalCityPageIsIndexable("diwali",2027,citySlug)).toBe(false);
      for(const language of ["bengali","tamil","malayalam","gujarati","marathi"]){
        expect(isRegionalIndexable(language,city)).toBe(false);
      }
    }
  });

  it("gives every Wave 2 city its own editorial locality signature without disclaimer copy",()=>{
    const profiles=wave2ControlledCities.map(slug=>buildCityContentProfile(findCityBySlug(slug)!));
    expect(new Set(profiles.map(item=>item.signature)).size).toBe(wave2ControlledCities.length);
    expect(new Set(profiles.map(item=>item.dailyContext)).size).toBe(wave2ControlledCities.length);
    for(const profile of profiles){
      expect(profile.geoContext.length).toBeGreaterThan(20);
      expect(profile.dailyContext.length).toBeGreaterThan(100);
      expect(disclaimerPattern.test([profile.geoContext,profile.dailyContext,profile.signature].join(" "))).toBe(false);
    }
  });
});
