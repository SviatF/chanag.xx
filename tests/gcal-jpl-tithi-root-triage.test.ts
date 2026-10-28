import {describe,it,expect} from "vitest";
import {getPinnedV6HalfTithiTable} from "../lib/jpl-v6-pinned-data";
import {ORIGINAL_JPL_KERNEL_SHA,ORIGINAL_GCAL_SHA,
 originalGcalISTSunriseUtcMs,originalGcalTithiAtSunrise,
 jplTithiClockAt,jplTithiEdges,nearestJplTithiEdge,concordance,NO_PUBLISH
} from "../lib/gcal-jpl-tithi-root-triage";

describe("source-pinned JPL DE440s and original GCal Tithi model separation",()=>{
 it("uses exactly JPL 6-degree roots, with real even-indexed 12-degree Tithi boundaries",()=>{
  const t=getPinnedV6HalfTithiTable();
  expect(t.kernelSha256).toBe(ORIGINAL_JPL_KERNEL_SHA);
  const edges=jplTithiEdges(t);
  expect(edges).toHaveLength(2256);
  expect(edges.every(e=>e.index>=0&&e.index<30)).toBe(true);
  const edge=edges.find(x=>x.utcMs>Date.UTC(2026,5,1))!;
  expect(jplTithiClockAt(t,edge.utcMs-1000)).toBe((edge.index+29)%30);
  expect(jplTithiClockAt(t,edge.utcMs+1000)).toBe(edge.index);
  expect(nearestJplTithiEdge(edges,edge.utcMs+12345).utcMs).toBe(edge.utcMs);
  expect(ORIGINAL_GCAL_SHA).toBe("1d20f6e0caf29b6293157d258d02287e4edf0481");
 });
 it("reads original GCal IST source clock at exact seconds, not floating client-local time",()=>{
  const xml='<sunrise time="05:26:36"><tithi name="Purnima" index="30" /></sunrise>';
  const t=originalGcalISTSunriseUtcMs("2026-06-30",xml);
  expect(new Date(t).toISOString()).toBe("2026-06-29T23:56:36.000Z");
  expect(originalGcalTithiAtSunrise(xml)).toBe(14);
 });
 it("maps actual GCal Tithi source indexes and does not confuse Paksha",()=>{
  expect(originalGcalTithiAtSunrise('<sunrise time="06:00:00"><tithi index="1"/></sunrise>')).toBe(15);
  expect(originalGcalTithiAtSunrise('<sunrise time="06:00:00"><tithi index="26"/></sunrise>')).toBe(10);
  expect(originalGcalTithiAtSunrise('<sunrise time="06:00:00"><tithi index="15"/></sunrise>')).toBe(29);
  expect(()=>originalGcalTithiAtSunrise('<sunrise time="06:00:00"><tithi index="31"/></sunrise>')).toThrow();
 });
 it("separates three physical-state concordance outcomes without selecting an approved ritual result",()=>{
  expect(concordance(14,14,14)).toBe("ALL_AGREE");
  expect(concordance(14,15,14)).toBe("GCAL_AND_JPL_AGREE_SWISS_DIFFERS");
  expect(concordance(15,14,14)).toBe("SWISS_AND_JPL_AGREE_GCAL_DIFFERS");
  expect(concordance(14,14,15)).toBe("GCAL_AND_SWISS_AGREE_JPL_DIFFERS");
  expect(NO_PUBLISH).toEqual({independentlyCertified:false,publicRitualApproval:false,
   tithiModelSelectedForPublicCalendar:false,autoPublishRitualDates:false});
 });
 it("refuses to invent source clocks or non-pinned kernels",()=>{
  expect(()=>originalGcalISTSunriseUtcMs("2026-06-30",'<sunrise time="25:00:00"/>')).toThrow();
  expect(()=>originalGcalISTSunriseUtcMs("2026-06-31",'<sunrise time="05:25:00"/>')).toThrow();
  const altered={...getPinnedV6HalfTithiTable(),kernelSha256:"FAKE"};
  expect(()=>jplTithiClockAt(altered as any,Date.UTC(2026,5,30))).toThrow();
 });
});
