import {describe,it,expect} from "vitest";
import {readFileSync,existsSync} from "node:fs";
import {getPinnedV6HalfTithiTable} from "../lib/jpl-v6-pinned-data";
import {openVerifiedV6SiderealSource,type VerifiedV6SiderealSource} from "../lib/v6-unified-calendar-staging";
import {classifyMahadvadashiSequence} from "../lib/independent-mahadvadashi";
import {researchDawn,nearestJplTithiBoundaryMs,RESEARCH_OBSERVANCE_RELEASE_GUARD}
 from "../lib/jpl-observance-research";
const source=()=>openVerifiedV6SiderealSource(
 readFileSync("artifacts/pinned-sidereal/wave3ao-jpl-global-sidereal-transitions.json","utf8"),
 readFileSync("artifacts/pinned-sidereal/wave3ao-lahiri-6h-anchors.json","utf8"));
const hasPinnedExternalCatalog=existsSync("artifacts/pinned-sidereal/wave3ao-jpl-global-sidereal-transitions.json")&&
 existsSync("artifacts/pinned-sidereal/wave3ao-lahiri-6h-anchors.json");
const itWithCatalog=hasPinnedExternalCatalog?it:it.skip;
const sample=(date:string,at:number)=>({
 date,sunriseUtcMs:at,arunodayaUtcMs:at-96*60_000,
 sunriseTithiIndex:13,arunodayaTithiIndex:13,
 sunriseNakshatraIndex:21,sunriseNakshatraBoundaryMinutes:600,
 nearFiveMinuteAstronomicalBoundary:false
});
describe("JPL independent observance input, no GCal leakage",()=>{
 it("reads JPL Tithi at exactly the same sunrise and 96m Arunodaya",()=>{
  const table=getPinnedV6HalfTithiTable();
  const root=table.halfTithiTransitions.find(([ms,idx])=>
   idx===20&&ms>Date.UTC(2027,0,1)&&ms<Date.UTC(2027,11,1))!;
  const at=root[0]+1000;
  const iso=new Date(at+330*60000).toISOString().slice(0,10);
  const s=sample(iso,at);
  const result=researchDawn(s,table,undefined as unknown as VerifiedV6SiderealSource,"jpl-tithi-swiss-nakshatra");
  expect(result.sunriseIndex).toBe(10);
  expect(result.nearBoundary).toBe(true);
  expect(result.nakshatraIndex).toBe(21);
  expect(nearestJplTithiBoundaryMs(table,root[0])).toBe(0);
  expect(result.arunodayaIndex).not.toBe(result.sunriseIndex);
 });
 itWithCatalog("replaces only Nakshatra in separate pinned JPL sidereal mode",()=>{
  const table=getPinnedV6HalfTithiTable(),src=source();
  const at=Date.UTC(2027,8,11,1);
  const s=sample("2027-09-11",at);
  const a=researchDawn(s,table,src,"jpl-tithi-swiss-nakshatra");
  const b=researchDawn(s,table,src,"jpl-tithi-jpl-nakshatra");
  expect(a.sunriseIndex).toEqual(b.sunriseIndex);
  expect(a.arunodayaIndex).toEqual(b.arunodayaIndex);
  expect(a.nakshatraIndex).toBe(21);
  expect(b.nakshatraIndex).toBeGreaterThanOrEqual(0);
  expect(b.nakshatraIndex).toBeLessThan(27);
  expect(RESEARCH_OBSERVANCE_RELEASE_GUARD.publicRitualApproval).toBe(false);
  expect(RESEARCH_OBSERVANCE_RELEASE_GUARD.jplSiderealAyanamsaFullyIndependent).toBe(false);
 });
 itWithCatalog("runs exactly the existing classifier without injecting original GCal label",()=>{
  const table=getPinnedV6HalfTithiTable(),src=source();
  const d=Date.UTC(2027,2,4,1);
  const days=Array.from({length:10},(_,i)=>{
   const at=d+(i-1)*86400000;
   const date=new Date(at+330*60000).toISOString().slice(0,10);
   return researchDawn(sample(date,at),table,src,"jpl-tithi-jpl-nakshatra");
  });
  const output=classifyMahadvadashiSequence(days,days[1].date);
  expect(output.certified).toBe(false);
  expect(output.sourceOfDecision).toBe("independent-astronomical-rules");
 });
});
