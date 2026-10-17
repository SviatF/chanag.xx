import {describe,expect,it} from "vitest";
import {allFestivals,festivalBySlugYear,nextFestival} from "../lib/festivals";

describe("future festival civil-date truth",()=>{
  it("does not interpret previous-day UTC as India date at 00:01 IST",()=>{
    // 2026-11-15 00:01 IST = 2026-11-14 18:31 UTC.
    // Chhath Puja is published for Nov 15, so it is still today's festival.
    const next=nextFestival(new Date("2026-11-14T18:31:00Z"));
    expect(next?.slug).toBe("chhath-puja");
    expect(next?.date).toBe("2026-11-15");
  });
  it("does not show yesterday's observance when India date is already tomorrow",()=>{
    // At 00:01 IST Nov 16 the final 2026 festival is already past.
    expect(nextFestival(new Date("2026-11-15T18:31:00Z"))?.year).toBe(2027);
  });
  it("never cycles back to 2026 after all maintained future festival dates expire",()=>{
    const last=allFestivals.at(-1)!;
    const nextDay=new Date(last.date+"T20:00:00Z");
    expect(nextFestival(nextDay)).toBeNull();
    expect(nextFestival(new Date("2030-01-01T06:00:00Z"))).toBeNull();
  });
  it("keeps today's maintained date (not exclusively future days)",()=>{
    const published=festivalBySlugYear("diwali",2026)!;
    expect(nextFestival(new Date("2026-11-08T05:00:00Z"))?.date).toBe(published.date);
  });
  it("rejects an invalid instant, not a silent fabricated date",()=>{
    expect(()=>nextFestival(new Date("not a date"))).toThrow("Invalid current date");
  });
});
