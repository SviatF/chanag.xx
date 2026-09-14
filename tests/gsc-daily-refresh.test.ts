import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {GSC_DAILY_REFRESH_QUERY_BUDGET,resolveGscSnapshotRanges} from "../lib/gsc-daily-refresh";

describe("GSC daily snapshot date boundary",()=>{
  it("requests through the previous Kyiv calendar day during DST",()=>{
    // 2026-09-14 21:00 UTC is 2026-09-15 00:00 in Europe/Kyiv.
    const ranges=resolveGscSnapshotRanges(new Date("2026-09-14T21:00:00.000Z"));
    expect(ranges.current28Dates).toEqual({startDate:"2026-08-18",endDate:"2026-09-14"});
    expect(ranges.current7Dates).toEqual({startDate:"2026-09-08",endDate:"2026-09-14"});
    expect(ranges.previous7Dates).toEqual({startDate:"2026-09-01",endDate:"2026-09-07"});
  });

  it("keeps the same previous-day rule after Kyiv switches off DST",()=>{
    // 2026-12-31 22:00 UTC is 2027-01-01 00:00 in Europe/Kyiv.
    const ranges=resolveGscSnapshotRanges(new Date("2026-12-31T22:00:00.000Z"));
    expect(ranges.current28Dates.endDate).toBe("2026-12-31");
    expect(ranges.current7Dates.endDate).toBe("2026-12-31");
  });

  it("uses fresh GSC data without increasing the Search Analytics budget",()=>{
    const source=readFileSync("lib/gsc-daily-refresh.ts","utf8");
    expect(GSC_DAILY_REFRESH_QUERY_BUDGET).toBe(2);
    expect(source).toContain('dataState:"all"');
    expect(source).toContain('dataState:"final"');
    expect(source).not.toContain("shift(asOf,-2)");
    expect(source).toContain('const KYIV_TIME_ZONE="Europe/Kyiv"');
  });
});
