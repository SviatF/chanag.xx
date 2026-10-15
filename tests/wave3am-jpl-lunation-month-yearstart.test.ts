import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {cityBySlug} from "../lib/cities";
import {getPinnedV6HalfTithiTable,JPL_V6_ROOTS_ASSET_SHA256} from "../lib/jpl-v6-pinned-data";
import {getJplV6SunriseLunarCanary} from "../lib/jpl-v6-crossfamily-canary";
import {
 jplNewMoonBoundaries,jplLunationAtMs,jplLunarMonthCandidate,jplNewYearCandidate
} from "../lib/jpl-v6-lunation-candidate";
import {getStagedV6Daily} from "../lib/v6-calendar-staging";

describe("Wave 3AM: exact-source lunations, unapproved sidereal convention candidates",()=>{
 it("derives ordered 29-day-ish new moon roots from JPL half-phase zero events",()=>{
   const table=getPinnedV6HalfTithiTable();
   const moons=jplNewMoonBoundaries(table);
   expect(moons.length).toBeGreaterThan(70);
   const rows=new Set(table.halfTithiTransitions.filter(row=>row[1]===0).map(row=>row[0]));
   expect(moons.every(ms=>rows.has(ms))).toBe(true);
   for(let i=1;i<moons.length;i++){
     expect((moons[i]-moons[i-1])/86400000).toBeGreaterThan(28.5);
     expect((moons[i]-moons[i-1])/86400000).toBeLessThan(30.9);
   }
 });
 it("uses the identical JPL previous-new-moon instant for all known model flips",()=>{
   const table=getPinnedV6HalfTithiTable();
   for(const [slug,date,tithi] of [
     ["delhi","2026-06-30","Purnima"],
     ["kanpur","2026-11-21","Ekadashi"],
     ["patna","2027-01-31","Navami"]
   ] as const){
     const lunar=getJplV6SunriseLunarCanary(date,cityBySlug(slug),table);
     expect(lunar.tithi).toBe(tithi);
     const candidate=jplLunarMonthCandidate(lunar,table);
     const instant=Date.parse(lunar.sunriseUtc);
     const roots=jplLunationAtMs(table,instant);
     expect(candidate.previousNewMoonUtc).toBe(lunar.previousNewMoonUtc);
     expect(roots.previous).toBe(Date.parse(candidate.previousNewMoonUtc));
     expect(roots.previous).toBeLessThanOrEqual(instant);
     expect(instant).toBeLessThan(roots.next);
     expect(candidate.monthLabels.amanta).toMatch(/^[A-Za-z]+(?: \(Adhika\))?$/);
     expect(candidate.monthLabels.purnimanta).toMatch(/^[A-Za-z]+(?: \(Adhika\))?$/);
     expect(candidate.sourceSha256).toBe(JPL_V6_ROOTS_ASSET_SHA256);
     expect(candidate.siderealEphemerisUnified).toBe(false);
     expect(candidate.ritualOrPublicationApproved).toBe(false);
   }
 },45_000);
 it("rejects JPL candidate where full next-next lunation root is unavailable",()=>{
   const table=getPinnedV6HalfTithiTable();
   const moons=jplNewMoonBoundaries(table);
   expect(()=>jplLunationAtMs(table,moons.at(-2)!+1000)).toThrow(/coverage/);
 });
 it("derives candidate Chaitra and Gujarati Samvat boundaries for 2026/27",()=>{
   for(const [kind,city,year] of [
     ["chaitra","patna",2027],["gujarati","mumbai",2027],
     ["chaitra","mumbai",2026],["gujarati","patna",2026]
   ] as const){
     const start=jplNewYearCandidate(year,cityBySlug(city),kind);
     expect(start.effectiveStart).toMatch(/^20\d\d-\d\d-\d\d$/);
     expect(start.effectiveStart.startsWith(String(year))).toBe(true);
     expect(start.newMoonUtc).toBeTruthy();
     expect(Date.parse(start.pratipadaEndUtc)).toBeGreaterThan(Date.parse(start.newMoonUtc));
     expect(start.independentSiderealApproval).toBe(false);
     expect(start.productionReleaseAllowed).toBe(false);
   }
   expect(()=>jplNewYearCandidate(2031,cityBySlug("patna"),"chaitra")).toThrow(/margin/);
 },45_000);
 it("attaches lunar-month evidence to the same V6 Daily staging record without promoting it",async()=>{
   const day=await getStagedV6Daily("2027-01-31",cityBySlug("patna"));
   expect(day.lunarMonthResearch.previousNewMoonUtc).toBe(day.lunar.previousNewMoonUtc);
   expect(day.lunarMonthResearch.ritualOrPublicationApproved).toBe(false);
   expect(day.publicReleaseAllowed).toBe(false);
   expect(day.simulatedPanchang.engine).toBe("Swiss Ephemeris · Moshier");
 },30_000);
 it("ensures no unapproved Sidereal/Month/Samvat candidate is wired to production",()=>{
   for(const path of [
     "lib/panchang.ts","lib/calendar-conventions.ts","lib/vrat.ts",
     "lib/muhurat.ts","app/panchang/[city]/[[...date]]/page.tsx"
   ]){
     expect(readFileSync(path,"utf8")).not.toContain("jpl-v6-lunation-candidate");
   }
 });
});
