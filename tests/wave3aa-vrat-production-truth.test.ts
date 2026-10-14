import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {getPanchang} from "../lib/panchang";
import {calculateVratCalendar} from "../lib/vrat";
import {requireSolarEvent,requireTransition,requireFiniteLongitudes} from "../lib/ephemeris-integrity";

describe("Wave 3AA: calendar-day mathematical correctness and fail-closed Vrat",()=>{
  it("shares Panchang's fatal astronomical error contracts, not synthetic 06:00 sunrise",()=>{
    const source=readFileSync("lib/vrat.ts","utf8");
    expect(source).toContain('requireSolarEvent(rise,city.slug,expectedDate,"sunrise")');
    expect(source).toContain('requireTransition(transitionAfter(sunriseJd),sunriseJd,city.slug,expectedDate,"Tithi")');
    expect(source).toContain("requireFiniteLongitudes([sun,moon]");
    expect(source).not.toContain("rise.retval>=0?rise.tret:baseJd+0.25");
    expect(source).not.toContain('tithiEnd:"—"');
    expect(()=>requireSolarEvent({retval:-1,tret:2460000.5},"mumbai","2027-01-01","sunrise"))
      .toThrow("Swiss Ephemeris sunrise failed");
    expect(()=>requireTransition(null,2460000,"mumbai","2027-01-01","Tithi"))
      .toThrow("transition unavailable");
    expect(()=>requireFiniteLongitudes([Number.NaN,42],"mumbai","2027-01-01"))
      .toThrow("Non-finite");
  });
  it("keeps corrected Delhi Purnima and Kanpur sunrise data distinct from fast dates",()=>{
    const delhi=calculateVratCalendar("purnima",2026,cityBySlug("delhi"));
    expect(delhi.some(r=>r.date==="2026-06-29")).toBe(true);
    expect(delhi.some(r=>r.date==="2026-06-30")).toBe(false);
    const kanpur=calculateVratCalendar("ekadashi",2026,cityBySlug("kanpur"));
    expect(kanpur.some(r=>r.date==="2026-11-21")).toBe(false);
  });
  it("reconciles each Vrat family with exact daily Panchang for 2026–2028 across four regions",async()=>{
    let comparisons=0;
    for(const slug of ["delhi","mumbai","kolkata","chennai"]){
      const city=cityBySlug(slug);
      for(const year of [2026,2027,2028]){
        for(const type of ["ekadashi","purnima","amavasya"] as const){
          const rows=calculateVratCalendar(type,year,city);
          expect(rows.length).toBeGreaterThan(type==="ekadashi"?20:9);
          expect(rows.every(r=>r.tithiEnd!=="—")).toBe(true);
          const selected=[rows[0],rows[Math.floor(rows.length/2)],rows[rows.length-1]];
          for(const row of selected){
            const daily=await getPanchang(new Date(row.date+"T06:00:00Z"),city);
            expect({date:daily.date,tithi:daily.tithi,paksha:daily.paksha,
              sunrise:daily.sunrise,tithiEnd:daily.tithiEnd,tithiEndDate:daily.tithiEndDate})
              .toEqual({date:row.date,tithi:row.tithi,paksha:row.paksha,
                sunrise:row.sunrise,tithiEnd:row.tithiEnd,tithiEndDate:row.tithiEndDate});
            comparisons++;
          }
        }
      }
    }
    expect(comparisons).toBe(108);
  },60_000);
});
