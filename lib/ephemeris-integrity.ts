import {addIsoDays,indiaLocalPartsFromJulian} from "./india-time";

export type RiseSetResult={retval:number;tret:number};

/** Fatal calculation errors must never be represented as a plausible time. */
export function requireSolarEvent(
  event:RiseSetResult,citySlug:string,dateIso:string,kind:"sunrise"|"sunset"|"next sunrise"
):number{
  if(!Number.isFinite(event.retval)||event.retval<0||!Number.isFinite(event.tret)||event.tret<=0)
    throw new Error(`Swiss Ephemeris ${kind} failed for ${citySlug} on ${dateIso} (code ${event.retval})`);
  const expected=kind==="next sunrise"?addIsoDays(dateIso,1):dateIso;
  const local=indiaLocalPartsFromJulian(event.tret);
  if(local.date!==expected)
    throw new Error(`Swiss Ephemeris ${kind} local-date mismatch for ${citySlug} on ${dateIso}: ${local.date} not ${expected}`);
  return event.tret;
}

export function requireSolarSequence(
  sunrise:number,sunset:number,nextSunrise:number,citySlug:string,dateIso:string
){
  const daylightHours=(sunset-sunrise)*24;
  const nightHours=(nextSunrise-sunset)*24;
  // India includes climates from Kerala to the Himalayan foothills.
  // Bounds are a fail-safe guard, not an alternative sunrise calculation.
  if(!(sunrise<sunset&&sunset<nextSunrise&&daylightHours>=8&&daylightHours<=16&&nightHours>=8&&nightHours<=16)){
    throw new Error(`Invalid solar event sequence ${citySlug} ${dateIso}: daylight=${daylightHours.toFixed(2)}h night=${nightHours.toFixed(2)}h`);
  }
}

export function requireTransition(
  jd:number|null,startingJd:number,citySlug:string,dateIso:string,kind:"Tithi"|"Nakshatra"
):number{
  if(jd===null||!Number.isFinite(jd)||jd<=startingJd||jd>startingJd+2)
    throw new Error(`Swiss Ephemeris ${kind} transition unavailable for ${citySlug} on ${dateIso}`);
  return jd;
}

export function requirePreviousNewMoon(jd:number,solarSunriseJd:number,citySlug:string,dateIso:string){
  if(!Number.isFinite(jd)||jd>=solarSunriseJd||jd<solarSunriseJd-36)
    throw new Error(`Previous new moon unavailable for ${citySlug} on ${dateIso}`);
  return jd;
}

export function requireFiniteLongitudes(values:readonly number[],citySlug:string,dateIso:string){
  if(values.some(value=>!Number.isFinite(value)))
    throw new Error(`Non-finite Sun/Moon longitude for ${citySlug} on ${dateIso}`);
}
