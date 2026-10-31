/**
 * Astronomy-only cross-model comparison: directly solve Swiss/Moshier Lahiri
 * sidereal Moon ingress with numerical bisection; JPL/Swiss-anchored catalog
 * remains an independent EPHEMERIS, NOT an independent ayanamsa definition.
 */
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose,sweSetSidMode} from "@typescriptify/sweph/dist/sweph.js";
import {SE_MOON,SEFLG_MOSEPH,SEFLG_SIDEREAL,SE_SIDM_LAHIRI} from "@typescriptify/sweph/dist/constants.js";
import {bisectSwissRoot} from "./v6-root-clock-reconciliation";
const JD0=2440587.5,DAYMS=86400000;
const norm=(n:number)=>(n%360+360)%360;
export type IndependentSwissLahiriRoot={
  jplUtcMs:number;swissUtcMs:number;swissMinusJplSeconds:number;
  indexAfter:number;
  swissMoonIndexAtJplRoot:number;
  swissMoonIndexAfterSolvedRoot:number;
  originalGcalClockUtcMs:number|null;sourceClockMinusJplSeconds:number|null;
  sourceClockMinusSwissSeconds:number|null;
  modelAyanamsaDefinition:"Swiss Ephemeris standard Lahiri IAE 1985";
  jplAyanamsaInput:"JPL DE440s apparent Moon plus Swiss Lahiri six-hour anchors";
  independentlyCertifiedAyanamsa:false
};
export function directlySolveSwissLahiriNakshatraIngress(
 jplIngressMs:number,indexAfter:number,originalClockMs:number|null=null
):IndependentSwissLahiriRoot{
 if(!Number.isSafeInteger(jplIngressMs)||!Number.isInteger(indexAfter)||indexAfter<0||indexAfter>26||
  (originalClockMs!==null&&!Number.isSafeInteger(originalClockMs)))
  throw Error("Invalid original JPL/Lahiri ingress measurement");
 const swe=createDefaultSweData();
 try{
  sweSetSidMode(swe,SE_SIDM_LAHIRI,0,0);
  const longitude=(at:number)=>{
   const v=sweCalcUt(swe,JD0+at/DAYMS,SE_MOON,SEFLG_MOSEPH|SEFLG_SIDEREAL).xx[0];
   if(!Number.isFinite(v))throw Error("Nonfinite Swiss Lahiri Moon longitude");
   return norm(v);
  };
  const target=indexAfter*(360/27);
  const root=bisectSwissRoot(target,jplIngressMs,longitude,30*60_000);
  const before=(at:number)=>Math.floor(longitude(at)/(360/27));
  const stateAfter=before(root.swissRootUtcMs+2000);
  if(stateAfter!==indexAfter||before(root.swissRootUtcMs-2000)!==(indexAfter+26)%27)
   throw Error("Swiss direct root does not change to expected Nakshatra");
  return {jplUtcMs:jplIngressMs,swissUtcMs:root.swissRootUtcMs,
   swissMinusJplSeconds:root.deltaSeconds,indexAfter,
   swissMoonIndexAtJplRoot:before(jplIngressMs),
   swissMoonIndexAfterSolvedRoot:stateAfter,
   originalGcalClockUtcMs:originalClockMs,
   sourceClockMinusJplSeconds:originalClockMs===null?null:(originalClockMs-jplIngressMs)/1000,
   sourceClockMinusSwissSeconds:originalClockMs===null?null:(originalClockMs-root.swissRootUtcMs)/1000,
   modelAyanamsaDefinition:"Swiss Ephemeris standard Lahiri IAE 1985",
   jplAyanamsaInput:"JPL DE440s apparent Moon plus Swiss Lahiri six-hour anchors",
   independentlyCertifiedAyanamsa:false};
 }finally{sweClose(swe);}
}
export const DIRECT_LAHIRI_RELEASE_GUARD={
 numericalMoonIngressValidated:false,
 ayanamsaIndependentlyCertified:false,
 ritualObservanceCertified:false,
 publicationAuthorized:false
} as const;
