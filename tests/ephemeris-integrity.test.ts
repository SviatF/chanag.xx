import {describe,expect,it} from "vitest";
import {cityBySlug} from "../lib/cities";
import {getPanchang} from "../lib/panchang";
import {indiaCivilDayStartJulian} from "../lib/india-time";
import {requireSolarEvent,requireSolarSequence,requireTransition,requirePreviousNewMoon,requireFiniteLongitudes} from "../lib/ephemeris-integrity";

describe("fail-closed Swiss Ephemeris astronomical calculation",()=>{
  const date="2026-10-20",city="hyderabad";
  const base=indiaCivilDayStartJulian(2026,10,20);
  it("rejects negative return values instead of publishing placeholder sunrise",()=>{
    expect(()=>requireSolarEvent({retval:-1,tret:base+0.25},city,date,"sunrise")).toThrow(/failed/);
    expect(()=>requireSolarEvent({retval:0,tret:Number.NaN},city,date,"sunset")).toThrow(/failed/);
    expect(()=>requireSolarEvent({retval:0,tret:0},city,date,"next sunrise")).toThrow(/failed/);
  });
  it("rejects sunrise assigned to wrong India local date",()=>{
    expect(()=>requireSolarEvent({retval:0,tret:base+1.25},city,date,"sunrise")).toThrow(/local-date mismatch/);
    expect(()=>requireSolarEvent({retval:0,tret:base+0.25},city,date,"next sunrise")).toThrow(/local-date mismatch/);
  });
  it("rejects swapped solar events and irrational day/night lengths",()=>{
    expect(()=>requireSolarSequence(base+0.76,base+0.25,base+1.3,city,date)).toThrow(/Invalid solar event sequence/);
    expect(()=>requireSolarSequence(base+0.25,base+0.95,base+1.2,city,date)).toThrow(/Invalid solar event sequence/);
  });
  it("rejects fabricated lunar transitions and previous-new-moon fallback",()=>{
    expect(()=>requireTransition(null,base,city,date,"Tithi")).toThrow(/unavailable/);
    expect(()=>requireTransition(Number.NaN,base,city,date,"Nakshatra")).toThrow(/unavailable/);
    expect(()=>requirePreviousNewMoon(base-40,base,city,date)).toThrow(/unavailable/);
    expect(()=>requireFiniteLongitudes([1,Number.NaN,3],city,date)).toThrow(/Non-finite/);
  });
  it("preserves existing verified Indian city/day observations",async()=>{
    const observation=await getPanchang(new Date(date+"T06:00:00Z"),cityBySlug(city));
    expect(observation.sunrise).toMatch(/^\\d{2}:\\d{2}$/);
    expect(observation.sunset).toMatch(/^\\d{2}:\\d{2}$/);
    expect(observation.tithiEndDate).not.toBeNull();
    expect(observation.nakshatraEndDate).not.toBeNull();
  });
});
