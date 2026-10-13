/**
 * Wave 3P — geometry-only twilight screening for observational research.
 * This deliberately does not equate a geometric window with naked-eye visibility,
 * astronomical Asta, or a ceremony eligibility judgment.
 */
export type TwilightBand="daylight"|"civil"|"nautical"|"astronomical"|"night";
export type VisibilityProfile={
  id:"clear"|"hazy"|"low-pressure";
  pressureHpa:number;
  temperatureC:number;
  humidityPct:number;
  meteorologicalRangeKm:number;
  horizonObstructionDegrees:number;
};
export const ASTA_ATMOSPHERE_SCENARIOS:readonly VisibilityProfile[]=[
  {id:"clear",pressureHpa:1013.25,temperatureC:20,humidityPct:40,meteorologicalRangeKm:40,horizonObstructionDegrees:0},
  {id:"hazy",pressureHpa:1000,temperatureC:32,humidityPct:75,meteorologicalRangeKm:10,horizonObstructionDegrees:2},
  {id:"low-pressure",pressureHpa:900,temperatureC:12,humidityPct:30,meteorologicalRangeKm:80,horizonObstructionDegrees:0}
] as const;

export type AstaSkySample={
  julianUt:number;
  sunTrueAltitudeDegrees:number;
  sunApparentAltitudeDegrees:number;
  planetTrueAltitudeDegrees:number;
  planetApparentAltitudeDegrees:number;
  planetAzimuthDegrees:number;
  sunAzimuthDegrees:number;
};
export function validateAtmosphere(profile:VisibilityProfile):boolean{
  return [profile.pressureHpa,profile.temperatureC,profile.humidityPct,
    profile.meteorologicalRangeKm,profile.horizonObstructionDegrees].every(Number.isFinite)
    &&profile.pressureHpa>=300&&profile.pressureHpa<=1100
    &&profile.temperatureC>=-50&&profile.temperatureC<=65
    &&profile.humidityPct>=0&&profile.humidityPct<=100
    &&profile.meteorologicalRangeKm>0&&profile.meteorologicalRangeKm<=300
    &&profile.horizonObstructionDegrees>=0&&profile.horizonObstructionDegrees<=45;
}
export function twilightBand(apparentSolarAltitudeDegrees:number):TwilightBand{
  if(!Number.isFinite(apparentSolarAltitudeDegrees))throw Error("Invalid solar altitude");
  if(apparentSolarAltitudeDegrees>=0)return "daylight";
  if(apparentSolarAltitudeDegrees>=-6)return "civil";
  if(apparentSolarAltitudeDegrees>=-12)return "nautical";
  if(apparentSolarAltitudeDegrees>=-18)return "astronomical";
  return "night";
}
export function angularAzimuthGapDegrees(a:number,b:number):number{
  if(!Number.isFinite(a)||!Number.isFinite(b))throw Error("Invalid azimuth");
  return Math.abs(((a-b+540)%360+360)%360-180);
}
export function geometryOnlyCandidate(sample:AstaSkySample,profile:VisibilityProfile){
  if(!validateAtmosphere(profile)||![sample.julianUt,sample.sunTrueAltitudeDegrees,
    sample.sunApparentAltitudeDegrees,sample.planetTrueAltitudeDegrees,
    sample.planetApparentAltitudeDegrees,sample.planetAzimuthDegrees,
    sample.sunAzimuthDegrees].every(Number.isFinite))throw Error("Invalid sky/observer parameters");
  const band=twilightBand(sample.sunApparentAltitudeDegrees);
  const planetAboveObstruction=sample.planetApparentAltitudeDegrees>=
    Math.max(2,profile.horizonObstructionDegrees);
  // Only a geometry/twilight window, not visual detectability: no magnitude,
  // contrast, scattering, local terrain or real-time atmospheric measurements.
  const twilightIsEvenPotentiallyUseful=sample.sunApparentAltitudeDegrees<=-6&&
    sample.sunApparentAltitudeDegrees>=-18;
  return {
    twilightBand:band,
    planetAboveObstruction,
    relativeAzimuthDegrees:angularAzimuthGapDegrees(sample.planetAzimuthDegrees,sample.sunAzimuthDegrees),
    geometryWindowOnly:planetAboveObstruction&&twilightIsEvenPotentiallyUseful,
    nakedEyeVisible:null as null,
    safeForCeremonyFiltering:false as const
  };
}
export type AstaSkyWindow={
  firstJulianUt:number;lastJulianUt:number;sampleCount:number;
};
/** A strictly sampling-grid result: never pretend first sample is true ingress. */
export function groupGeometrySamples(
  samples:readonly {julianUt:number;geometryWindowOnly:boolean}[],
  expectedStepMinutes:number
):AstaSkyWindow[]{
  if(!Number.isFinite(expectedStepMinutes)||expectedStepMinutes<=0)throw Error("Invalid cadence");
  const sorted=[...samples].sort((a,b)=>a.julianUt-b.julianUt);
  const result:AstaSkyWindow[]=[];
  for(const s of sorted){
    if(!Number.isFinite(s.julianUt))throw Error("Invalid Julian day");
    if(!s.geometryWindowOnly)continue;
    const last=result[result.length-1];
    if(last&&s.julianUt>last.lastJulianUt&&
      (s.julianUt-last.lastJulianUt)*1440<=expectedStepMinutes+0.2){
      last.lastJulianUt=s.julianUt;
      last.sampleCount++;
    }else result.push({firstJulianUt:s.julianUt,lastJulianUt:s.julianUt,sampleCount:1});
  }
  return result;
}
