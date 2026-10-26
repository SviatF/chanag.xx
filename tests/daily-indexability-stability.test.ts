import {afterEach,describe,expect,it,vi} from "vitest";
import {isDailyIndexable,isDailyPageIndexable,DAILY_METADATA_RELEASE_END,phase1PriorityCities,wave2ControlledCities} from "../lib/seo-policy";
import {rollingDailyDates} from "../lib/seo-sitemap";

afterEach(()=>vi.useRealTimers());

describe("Daily sitemap and cached robots stability",()=>{
  it("never rotates an approved dated page from index to noindex",()=>{
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-18T12:00:00Z"));
    expect(isDailyIndexable("mumbai","2026-12-10")).toBe(false);
    expect(isDailyPageIndexable("mumbai","2026-12-10")).toBe(true);
    vi.setSystemTime(new Date("2026-10-26T12:00:00Z"));
    expect(isDailyIndexable("mumbai","2026-12-10")).toBe(true);
    expect(isDailyPageIndexable("ludhiana","2026-11-09")).toBe(true);
    vi.setSystemTime(new Date("2026-12-31T12:00:00Z"));
    expect(isDailyIndexable("mumbai","2026-10-14")).toBe(false);
    expect(isDailyPageIndexable("mumbai","2026-10-14")).toBe(true);
    expect(isDailyPageIndexable("ludhiana","2026-10-09")).toBe(true);
  });
  it("cannot put a noindex Daily URL into the sitemap at India-date rollovers",()=>{
    vi.useFakeTimers();
    for(const instant of ["2026-10-12T12:00:00Z","2026-10-26T12:00:00Z","2027-02-10T12:00:00Z"]){
      vi.setSystemTime(new Date(instant));
      for(const city of [...phase1PriorityCities,...wave2ControlledCities])
        for(const day of rollingDailyDates(14,45))
          if(isDailyIndexable(city,day))expect(isDailyPageIndexable(city,day),`${instant} ${city} ${day}`).toBe(true);
    }
  });
  it("keeps unapproved cities and unreleased dates out",()=>{
    expect(DAILY_METADATA_RELEASE_END).toBe("2027-03-31");
    expect(isDailyPageIndexable("mumbai","2026-08-31")).toBe(false);
    expect(isDailyPageIndexable("ludhiana","2026-10-08")).toBe(false);
    expect(isDailyPageIndexable("mumbai","2027-04-01")).toBe(false);
    expect(isDailyPageIndexable("mumbai","2026-02-30")).toBe(false);
    expect(isDailyPageIndexable("invalid-city","2026-10-26")).toBe(false);
  });
});
