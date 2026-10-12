import {afterEach,describe,expect,it,vi} from "vitest";
import {phase1PriorityCities,primaryMuhuratEvents} from "../lib/seo-policy";
import {rollingDailyDates,rollingMonths} from "../lib/seo-sitemap";

function difference<T>(left:Set<T>,right:Set<T>){
  return [...left].filter(item=>!right.has(item));
}

function dailyUrls(){
  return new Set(phase1PriorityCities.flatMap(city=>
    rollingDailyDates(14,45).map(date=>`/panchang/${city}/${date}`)
  ));
}

function calendarMonthUrls(){
  return new Set(phase1PriorityCities.flatMap(city=>
    rollingMonths(2,12).map(item=>`/calendar/${city}/${item.year}/${item.slug}`)
  ));
}

function muhuratMonthUrls(){
  return new Set(primaryMuhuratEvents.flatMap(event=>
    rollingMonths(0,12).flatMap(item=>[
      `/muhurat/${event}/${item.year}/${item.slug}`,
      ...phase1PriorityCities.map(city=>`/muhurat/${event}/${item.year}/${item.slug}/${city}`)
    ])
  ));
}

afterEach(()=>{
  vi.useRealTimers();
});

describe("indexability churn budget",()=>{
  it("pins the current active rolling footprint so scope changes require an explicit review",()=>{
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T12:00:00Z"));

    expect(dailyUrls().size).toBe(1200);
    expect(calendarMonthUrls().size).toBe(300);
    expect(muhuratMonthUrls().size).toBe(819);
  });

  it("limits normal daily Panchang turnover to one date per active city",()=>{
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T12:00:00Z"));
    const before=dailyUrls();

    vi.setSystemTime(new Date("2026-10-13T12:00:00Z"));
    const after=dailyUrls();

    expect(difference(before,after)).toHaveLength(phase1PriorityCities.length);
    expect(difference(after,before)).toHaveLength(phase1PriorityCities.length);
  });

  it("documents the maximum routine month-boundary churn across daily, calendar and Muhurat rolling families",()=>{
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-31T12:00:00Z"));
    const before={
      daily:dailyUrls(),
      calendar:calendarMonthUrls(),
      muhurat:muhuratMonthUrls(),
    };

    vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
    const after={
      daily:dailyUrls(),
      calendar:calendarMonthUrls(),
      muhurat:muhuratMonthUrls(),
    };

    const outgoing=
      difference(before.daily,after.daily).length+
      difference(before.calendar,after.calendar).length+
      difference(before.muhurat,after.muhurat).length;
    const incoming=
      difference(after.daily,before.daily).length+
      difference(after.calendar,before.calendar).length+
      difference(after.muhurat,before.muhurat).length;

    // 20 Daily + 20 Calendar Month + 63 Muhurat Month URLs.
    expect(outgoing).toBe(103);
    expect(incoming).toBe(103);
  });
});
