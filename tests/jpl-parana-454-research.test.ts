import {describe,it,expect} from "vitest";
import {getPinnedV6HalfTithiTable} from "../lib/jpl-v6-pinned-data";
import {jplParanaTithiBounds,getJplResearchParanaAstronomy,JPL_PARANA_RESEARCH_GUARD}
 from "../lib/jpl-parana-astronomy";
import {findCityBySlug} from "../lib/cities";
import {calculateIndependentParana} from "../lib/independent-parana";
describe("independent JPL DE440s Parana physical-clock science, never original GCal minutes",()=>{
 it("uses actual JPL Dvadasi and Trayodasi transitions rather than Swiss Tithi",()=>{
  const t=getPinnedV6HalfTithiTable();
  const b=jplParanaTithiBounds(t,"2027-03-04","2027-03-05");
  expect(b.dwadashiStart).not.toBeNull();
  expect(b.dwadashiEnd).not.toBeNull();
  expect(b.dwadashiEnd!).toBeGreaterThan(b.dwadashiStart!);
  // Tithi is 12°, exactly two consecutive pinned JPL 6° roots.
  const index=t.halfTithiTransitions.findIndex(x=>x[0]===b.dwadashiStart);
  expect(index).toBeGreaterThanOrEqual(0);
  expect([22,52]).toContain(t.halfTithiTransitions[index][1]);
  expect(t.halfTithiTransitions[index+2][0]).toBe(b.dwadashiEnd);
 });
 it("computes Swiss upper-limb solar rise/set without reference GCal clock",()=>{
  const city=findCityBySlug("delhi")!;
  const data=getJplResearchParanaAstronomy(city,"2027-03-04","2027-03-05",
   getPinnedV6HalfTithiTable(),null);
  expect(data).not.toBeNull();
  expect(data!.sunset).toBeGreaterThan(data!.sunrise);
  expect(data!.dwadashiStart).not.toBeNull();
  const p=calculateIndependentParana({...data!,method:"GCal-unmilani-research"});
  expect(p.certified).toBe(false);
  expect(p.status).toBe("calculated-research-only");
  expect(JPL_PARANA_RESEARCH_GUARD.publicRitualApproval).toBe(false);
  expect(JPL_PARANA_RESEARCH_GUARD.sourceGcalOracleNotUsedForAstronomy).toBe(true);
 });
 it("rejects non-adjacent Parana dates before performing physical astronomy",()=>{
  expect(()=>jplParanaTithiBounds(getPinnedV6HalfTithiTable(),"2027-03-04","2027-03-15"))
   .toThrow(/follow fasting date/);
 });
});
