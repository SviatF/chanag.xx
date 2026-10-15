/**
 * Wave 3AF — small, offline-tested V6 Tithi/Karana half-phase lookup.
 * Does NOT import a JPL binary, external Python, Swiss or production calendar.
 * Parsed JPL 6° transition table is supplied as a plain data object.
 *
 * Critically, both Tithi (12°) and Karana (6°) must derive from one exact
 * ephemeris model. Do NOT approximate a Karana boundary as half the duration
 * of a Tithi or add a fabricated fixed number of seconds to Swiss events.
 *
 * This module is canary-only until verified end-to-end production migration.
 */
export type JplHalfTithiTable={
  wave:"3AF";
  ephemeris:"JPL DE440s";
  kernelSha256:string;
  skyfieldVersion:"1.55";
  coverageStartUtc:string;
  coverageEndUtc:string;
  halfTithiBoundaryCount:number;
  halfTithiTransitions:ReadonlyArray<readonly [number,number]>;
  canaryOnly:true;
  ritualSelectionCertified:false;
};
export type LunarCanarySnapshot={
  atUtc:string;
  source:"JPL DE440s · 6° half-phase transitions · V6 research";
  halfPhaseIndex:number;
  tithiIndex:number;
  karanaIndex:number;
  nextKaranaBoundaryUtc:string;
  nextTithiBoundaryUtc:string;
  approvedRitualFast:false;
  approvedCeremony:false;
};
const KERNEL_SHA="c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2";
const TIME_MIN=8*3600_000, TIME_MAX=18*3600_000;
const range=(n:number)=>Number.isInteger(n)&&n>=0&&n<=59;
/** Strict structural and chronological proof before any canary lookup. */
export function validateJplHalfTithiTable(input:unknown):JplHalfTithiTable{
  if(typeof input!=="object"||input===null)throw Error("JPL Tithi table missing");
  const table=input as JplHalfTithiTable;
  if(table.wave!=="3AF"||table.ephemeris!=="JPL DE440s"||
    table.skyfieldVersion!=="1.55"||table.kernelSha256!==KERNEL_SHA||
    table.canaryOnly!==true||table.ritualSelectionCertified!==false||
    !Array.isArray(table.halfTithiTransitions)||table.halfTithiBoundaryCount!==table.halfTithiTransitions.length)
    throw Error("Unverifiable JPL DE440s transition-table provenance");
  const start=Date.parse(table.coverageStartUtc),end=Date.parse(table.coverageEndUtc);
  if(!Number.isFinite(start)||!Number.isFinite(end)||start>=end||
     start>Date.parse("2025-01-01T00:00:00Z")||
     end<Date.parse("2031-01-01T00:00:00Z"))
    throw Error("Global JPL table does not cover V6 canary 2025–2030");
  if(table.halfTithiTransitions.length<4200||table.halfTithiTransitions.length>5000)
    throw Error("JPL half-Tithi table is incomplete");
  let prevMs=-Infinity,prevIndex=-1;
  for(const row of table.halfTithiTransitions){
    if(!Array.isArray(row)||row.length!==2||!Number.isSafeInteger(row[0])||
       !range(row[1]))throw Error("Invalid JPL half-Tithi root");
    if(prevMs!==-Infinity){
      const delta=row[0]-prevMs;
      if(delta<=TIME_MIN||delta>=TIME_MAX||row[1]!==((prevIndex+1)%60))
        throw Error("JPL half-Tithi roots missing, duplicated or out of order");
    }
    prevMs=row[0];prevIndex=row[1];
  }
  if(table.halfTithiTransitions[0][0]>start+2*86400000||
     table.halfTithiTransitions.at(-1)![0]<end-2*86400000)
    throw Error("JPL half-phase root data lacks boundary margins");
  return table;
}
/** Binary search: index of last root <= instant, or -1. */
function lastRootAtOrBefore(rows:ReadonlyArray<readonly [number,number]>,atMs:number){
  let low=0,high=rows.length;
  while(low<high){
    const mid=(low+high)>>>1;
    if(rows[mid][0]<=atMs)low=mid+1;
    else high=mid;
  }
  return low-1;
}
export function jplHalfTithiAtMs(table:JplHalfTithiTable,atMs:number):LunarCanarySnapshot{
  if(!Number.isFinite(atMs)||!Number.isSafeInteger(Math.trunc(atMs)))
    throw Error("Nonfinite lunar canary instant");
  const rows=table.halfTithiTransitions;
  const k=lastRootAtOrBefore(rows,atMs);
  if(k<0||k>=rows.length-2)
    throw Error("JPL transition table coverage exhausted; never infer future calendar days");
  const currentHalfPhase=rows[k][1];
  const nextKarana=rows[k+1][0];
  const nextTithi=currentHalfPhase%2===0?rows[k+2][0]:nextKarana;
  if(nextKarana<=atMs||nextTithi<=atMs)
    throw Error("JPL future transition unavailable");
  const tithiIndex=Math.floor(currentHalfPhase/2);
  return {
    atUtc:new Date(atMs).toISOString(),
    source:"JPL DE440s · 6° half-phase transitions · V6 research",
    halfPhaseIndex:currentHalfPhase,
    tithiIndex,
    karanaIndex:currentHalfPhase,
    nextKaranaBoundaryUtc:new Date(nextKarana).toISOString(),
    nextTithiBoundaryUtc:new Date(nextTithi).toISOString(),
    approvedRitualFast:false,approvedCeremony:false
  };
}
export function jplHalfTithiForDate(table:JplHalfTithiTable,atDate:Date){
  if(!(atDate instanceof Date)||!Number.isFinite(atDate.getTime()))
    throw Error("Invalid UTC Date for JPL canary");
  return jplHalfTithiAtMs(table,atDate.getTime());
}
