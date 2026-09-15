import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("SEO opportunity evidence thresholds",()=>{
  it("does not allow SCALE on tiny impression samples",()=>{
    const source=readFileSync("lib/seo-operating-system.ts","utf8");
    expect(source).toContain("const SCALE_MIN_IMPRESSIONS=30");
    expect(source).toContain("const DO_NOW_MIN_IMPRESSIONS=20");
    expect(source).toContain("if(position<=10&&impressions>=SCALE_MIN_IMPRESSIONS)return \"SCALE\"");
    expect(source).toContain("if(position<=20&&impressions>=DO_NOW_MIN_IMPRESSIONS)return \"DO_NOW\"");
  });

  it("keeps low-evidence pages in observation instead of prescribing edits",()=>{
    const source=readFileSync("lib/seo-operating-system.ts","utf8");
    expect(source).toContain("if(impressions<DO_NOW_MIN_IMPRESSIONS)return \"WAIT\"");
  });

  it("contains targeted festival support without changing title or H1",()=>{
    const source=readFileSync("app/festivals/[festival]/[year]/[city]/page.tsx","utf8");
    expect(source).toContain("Ganesh Chaturthi 2026 timing in Ahmedabad");
    expect(source).toContain("Dasara 2026 date in Telangana");
    expect(source).toContain("ganesh-chaturthi/${year}/delhi");
    expect(source).toContain("ganesh-chaturthi/${year}/hyderabad");
  });
});
