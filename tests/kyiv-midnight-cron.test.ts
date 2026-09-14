import {describe,expect,it} from "vitest";
import {GSC_DAILY_CRONS,isGscDailyCron,isKyivMidnight,shouldRunGscDailyAtKyivMidnight} from "../lib/kyiv-midnight-cron";

describe("Kyiv-midnight GSC cron",()=>{
  it("uses the two UTC candidate hours required for Europe/Kyiv DST",()=>{
    expect(GSC_DAILY_CRONS).toEqual(["0 21 * * *","0 22 * * *"]);
    expect(isGscDailyCron("0 21 * * *")).toBe(true);
    expect(isGscDailyCron("0 22 * * *")).toBe(true);
    expect(isGscDailyCron("5 0 * * *")).toBe(false);
  });

  it("runs at 00:00 Kyiv during summer time and skips the other UTC candidate",()=>{
    const atMidnight=Date.parse("2026-09-14T21:00:00Z");
    const oneHourLate=Date.parse("2026-09-14T22:00:00Z");
    expect(isKyivMidnight(atMidnight)).toBe(true);
    expect(shouldRunGscDailyAtKyivMidnight("0 21 * * *",atMidnight)).toBe(true);
    expect(shouldRunGscDailyAtKyivMidnight("0 22 * * *",oneHourLate)).toBe(false);
  });

  it("runs at 00:00 Kyiv during winter time and skips the other UTC candidate",()=>{
    const oneHourEarly=Date.parse("2026-01-14T21:00:00Z");
    const atMidnight=Date.parse("2026-01-14T22:00:00Z");
    expect(shouldRunGscDailyAtKyivMidnight("0 21 * * *",oneHourEarly)).toBe(false);
    expect(isKyivMidnight(atMidnight)).toBe(true);
    expect(shouldRunGscDailyAtKyivMidnight("0 22 * * *",atMidnight)).toBe(true);
  });
});
