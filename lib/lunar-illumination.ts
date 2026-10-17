/**
 * Physically model lunar disc illumination, as seen from the geocentre.
 *
 * sweCalcUt returns geocentric ecliptic longitude and latitude in DEGREES,
 * distance in AU. The geometric Sun-Moon-Earth phase angle differs from the
 * geocentric longitude separation because the Moon has ecliptic latitude and
 * is not at the same distance as the Sun.
 *
 * k = (1 + cos(i)) / 2, with i = angle(Sun-Moon-Earth).
 * Meeus Astronomical Algorithms, illuminated fraction / phase angle.
 *
 * This is an astronomical illumination percentage, NOT a ritual day verdict,
 * and is not a topocentric visible-brightness or weather prediction.
 */
export type GeocentricEclipticPosition=readonly [longitudeDeg:number,latitudeDeg:number,distanceAu:number];
const radians=(degrees:number)=>degrees*Math.PI/180;
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

export function lunarIlluminatedFraction(
  sun:GeocentricEclipticPosition,
  moon:GeocentricEclipticPosition
):number{
  const coordinates=[...sun,...moon];
  if(coordinates.some(n=>!Number.isFinite(n))||
     sun[2]<=0||moon[2]<=0||sun[2]<=moon[2]||
     Math.abs(sun[1])>90||Math.abs(moon[1])>90){
    throw Error("Invalid geocentric Sun/Moon coordinates for physical illumination");
  }
  const longitudeDifference=radians(moon[0]-sun[0]);
  const sunLat=radians(sun[1]),moonLat=radians(moon[1]);
  // Spherical cosine for geocentric separation, not longitude-only elongation.
  const cosElongation=clamp(
    Math.sin(sunLat)*Math.sin(moonLat)+
      Math.cos(sunLat)*Math.cos(moonLat)*Math.cos(longitudeDifference),
    -1,1
  );
  const earthSun=sun[2],earthMoon=moon[2];
  // Distance Sun-Moon from triangle Earth-Sun-Moon in consistent AU.
  const sunMoon=Math.sqrt(earthSun**2+earthMoon**2-2*earthSun*earthMoon*cosElongation);
  if(!(sunMoon>0))throw Error("Degenerate Sun-Moon distance for illumination");
  const cosPhaseAngle=clamp((earthMoon-earthSun*cosElongation)/sunMoon,-1,1);
  return clamp((1+cosPhaseAngle)/2,0,1);
}
export function lunarIlluminationPercent(
  sun:GeocentricEclipticPosition,moon:GeocentricEclipticPosition
):number{
  return Math.round(100*lunarIlluminatedFraction(sun,moon));
}
