import {describe,expect,it} from "vitest";
import {visibleMonthMuhuratRows} from "../lib/muhurat-visibility";

const items=[
  {date:"2026-10-01",score:88},
  {date:"2026-10-12",score:100},
  {date:"2026-10-13",score:47},
  {date:"2026-10-29",score:65},
];
const asOf=new Date("2026-10-13T06:00:00Z");
describe("Muhurat current-month future-date filtering",()=>{
  it("removes dates older than India today from the current month's upcoming shortlist",()=>{
    expect(visibleMonthMuhuratRows(items,2026,10,asOf).map(x=>x.date)).toEqual(["2026-10-13","2026-10-29"]);
    expect(items).toHaveLength(4);
  });
  it("retains historical month data as archive and future planning months intact",()=>{
    expect(visibleMonthMuhuratRows(items,2026,9,asOf)).toEqual(items);
    expect(visibleMonthMuhuratRows(items,2026,11,asOf)).toEqual(items);
    expect(visibleMonthMuhuratRows(items,2025,10,asOf)).toEqual(items);
  });
  it("does not advance the same-day date prematurely",()=>{
    const sameDay=new Date("2026-10-13T23:59:00Z");
    expect(visibleMonthMuhuratRows(items,2026,10,sameDay).map(x=>x.date)).toEqual(["2026-10-13","2026-10-29"]);
  });
  it("never changes source rows or mutates ranking order",()=>{
    const frozen=Object.freeze(items.map(x=>Object.freeze({...x})));
    const filtered=visibleMonthMuhuratRows(frozen,2026,10,asOf);
    expect(filtered[0].score).toBe(47);
    expect(filtered[1].score).toBe(65);
    expect(frozen.map(x=>x.date)).toEqual(items.map(x=>x.date));
  });
});
