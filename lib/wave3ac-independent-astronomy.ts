/**
 * Wave 3AC — separate, executable astronomical model for diagnostic use ONLY.
 *
 * Astronomy Engine 2.1.19:
 * - lunar ecliptic coordinates from Brown / Improved Lunar Ephemeris (1954),
 * - solar VSOP-based series and independent apparent-top-limb rise search,
 * - standalone UTC→TT handling inside Astronomy Engine.
 *
 * This is NOT Swiss Ephemeris, a DrikPanchang oracle or a certified priestly
 * calendar. Different definitions of apparent geocentric ecliptic longitude,
 * atmospheric pressure, elevation, and ΔT may cause real discrepancies.
 * Never import this module into the production calendar engine.
 */
import * as Astronomy from "astronomy-engine";
import type {City} from "./cities";

const IST_MS=330*60_000;
const DAY_MS=86_400_000;
const civil=/^\d{4}-\d{2}-\d{2}$/;
const tithiIndex=(phase:number)=>{
  if(!Number.isFinite(phase))throw Error("Nonfinite independent geocentric phase angle");
  const index=Math.floor(((phase%360)+360)%360/12);
  if(index<0||index>29)throw Error("Independent lunar Tithi index outside 0–29");
  return index;
};
const istDay=(ms:number)=>new Date(ms+IST_MS).toISOString().slice(0,10);
export const independentTithiIndexAt=(date:Date)=>tithiIndex(Astronomy.MoonPhase(date));
function verifiedDay(date:string){
  if(!civil.test(date)||!Number.isFinite(Date.parse(date+"T00:00:00Z"))||
     new Date(date+"T00:00:00Z").toISOString().slice(0,10)!==date)
    throw Error("Invalid ISO date");
}
const stamp=(date:Date)=>({
  utc:date.toISOString(),
  ist:new Date(date.getTime()+IST_MS).toISOString().replace("Z","+05:30"),
  unixMs:date.getTime()
});
const formatTithi=(index:number)=>{
  const names=["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima"];
  return (index<15?"Shukla":"Krishna")+" "+(index===29?"Amavasya":names[index%15]);
};
export type IndependentOracleResult={
  city:string;date:string;lat:number;lng:number;
  library:"astronomy-engine";pinnedVersion:"2.1.19";
  lunarTheory:"Brown/Improved Lunar Ephemeris 1954";
  solarMethod:"independent top-limb rise with atmospheric refraction";
  comparisonUsesSwissEphemeris:false;
  independentRise:ReturnType<typeof stamp>;
  independentPhase288Boundary:ReturnType<typeof stamp>|null;
  independentlyCalculatedTithiAtRise:string;
  independentTithiAtRiseIndex:number;
  phaseDegreesAtRise:number;
  phaseDegreesAtBoundary:number|null;
  independentBoundaryChronologyValid:boolean|null;
  exactSecondEventResolutionRequested:true;
  sourceIndependentOfSwissEphemeris:true;
  certifiedPujaFastOrParana:false;
  calibratedAbsoluteAstrometricAccuracy:false;
  safeToChangeProduction:false;
};
export function independentAstronomicalCheck(
  city:Pick<City,"slug"|"lat"|"lng">,date:string,phaseBoundaryDegrees:number|null=288
):IndependentOracleResult{
  verifiedDay(date);
  const dateMidnightUtc=Date.parse(date+"T00:00:00Z");
  const startUtc=new Date(dateMidnightUtc-IST_MS);
  const observer=new Astronomy.Observer(city.lat,city.lng,0);
  // SearchRiseSet models visible upper limb and common atmospheric refraction.
  // Swiss default uses 1013.25 hPa, 25C; do NOT presume identical refraction.
  const sunrise=Astronomy.SearchRiseSet(Astronomy.Body.Sun,observer,+1,startUtc,1);
  if(!sunrise||!Number.isFinite(sunrise.date.getTime())||
    istDay(sunrise.date.getTime())!==date)
    throw Error("Independent astronomy rise failed/incorrect local day "+city.slug+" "+date);
  const index=independentTithiIndexAt(sunrise.date);
  const phaseAtRise=Astronomy.MoonPhase(sunrise.date);
  let phaseBoundary:Date|null=null;
  let chronology:boolean|null=null;
  let phaseAtBoundary:number|null=null;
  if(phaseBoundaryDegrees!==null){
    if(!Number.isFinite(phaseBoundaryDegrees)||phaseBoundaryDegrees<0||phaseBoundaryDegrees>=360)
      throw Error("Invalid requested independent lunar phase target");
    const root=Astronomy.SearchMoonPhase(phaseBoundaryDegrees,
      new Date(sunrise.date.getTime()-36*3_600_000),3);
    if(!root||!Number.isFinite(root.date.getTime()))
      throw Error("Independent lunar phase root not found "+city.slug+" "+date);
    phaseBoundary=root.date;
    phaseAtBoundary=Astronomy.MoonPhase(phaseBoundary);
    // Checks root phase and which side of root the independent sunrise falls.
    const phaseDelta=((phaseAtBoundary-phaseBoundaryDegrees+540)%360)-180;
    const before=independentTithiIndexAt(new Date(root.date.getTime()-30_000));
    const after=independentTithiIndexAt(new Date(root.date.getTime()+30_000));
    const targetIndex=Math.floor(phaseBoundaryDegrees/12)%30;
    const previousIndex=(targetIndex+29)%30;
    chronology=Math.abs(phaseDelta)<0.01&&before===previousIndex&&after===targetIndex;
    if(!chronology)throw Error("Independent lunar phase root failed bracket "+city.slug+" "+date+
      " before="+before+" after="+after+" phase="+phaseAtBoundary);
  }
  return{
    city:city.slug,date,lat:city.lat,lng:city.lng,
    library:"astronomy-engine",pinnedVersion:"2.1.19",
    lunarTheory:"Brown/Improved Lunar Ephemeris 1954",
    solarMethod:"independent top-limb rise with atmospheric refraction",
    comparisonUsesSwissEphemeris:false,
    independentRise:stamp(sunrise.date),
    independentPhase288Boundary:phaseBoundary?stamp(phaseBoundary):null,
    independentlyCalculatedTithiAtRise:formatTithi(index),
    independentTithiAtRiseIndex:index,
    phaseDegreesAtRise:phaseAtRise,
    phaseDegreesAtBoundary:phaseAtBoundary,
    independentBoundaryChronologyValid:chronology,
    exactSecondEventResolutionRequested:true,
    sourceIndependentOfSwissEphemeris:true,
    certifiedPujaFastOrParana:false,
    calibratedAbsoluteAstrometricAccuracy:false,
    safeToChangeProduction:false
  };
}
