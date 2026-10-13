/**
 * Wave 3O — pure numerical helpers for RESEARCH-ONLY Asta model comparisons.
 * No return value here represents a religious eligibility decision.
 */
export type AstaModelId=
  "geocentric-spherical"|"geocentric-ecliptic-longitude"|"topocentric-spherical";
export type AstaSample={marginDegrees:number;retrograde:boolean};
export type AstaModelCrossing={
  kind:"enter"|"exit";
  julian:number;
  /** A Venus threshold step at a retrograde station can create a false edge. */
  quality:"continuous-threshold"|"station-switch-unresolved";
};
export const ASTA_MODEL_IDS:readonly AstaModelId[]=[
  "geocentric-spherical","geocentric-ecliptic-longitude","topocentric-spherical"
];

export function greatCircleSeparationDegrees(
  ra1:number,decl1:number,ra2:number,decl2:number
){
  if(![ra1,decl1,ra2,decl2].every(Number.isFinite))throw Error("Non-finite equatorial coordinates");
  const d=Math.PI/180;
  const cos=Math.sin(decl1*d)*Math.sin(decl2*d)+
    Math.cos(decl1*d)*Math.cos(decl2*d)*Math.cos((ra1-ra2)*d);
  return Math.acos(Math.max(-1,Math.min(1,cos)))/d;
}
export function eclipticLongitudeSeparationDegrees(sun:number,body:number){
  if(!Number.isFinite(sun)||!Number.isFinite(body))throw Error("Non-finite ecliptic longitude");
  const delta=((body-sun+540)%360+360)%360-180;
  return Math.abs(delta);
}
export function astaThresholdDegrees(planet:"Jupiter"|"Venus",retrograde:boolean){
  return planet==="Jupiter"?11:retrograde?8:10;
}

/**
 * Sample every six hours and refine only continuous margin sign changes.
 * Retrograde classification changes are retained as UNRESOLVED brackets:
 * the 10→8 degree rule is discontinuous at stations, so bisection cannot
 * produce a physically meaningful exact Asta instant there.
 */
export function scanAstaModelCrossings(
  sample:(jd:number)=>AstaSample,startJulian:number,endJulian:number,
  stepDays=0.25
):AstaModelCrossing[]{
  if(![startJulian,endJulian,stepDays].every(Number.isFinite)||
    endJulian<=startJulian||stepDays<=0||stepDays>1)throw Error("Invalid Asta benchmark range");
  const events:AstaModelCrossing[]=[];
  let prevJd=startJulian,prev=sample(prevJd);
  if(!Number.isFinite(prev.marginDegrees))throw Error("Non-finite Asta margin");
  for(let jd=Math.min(endJulian,startJulian+stepDays);jd<=endJulian+1e-10;jd=Math.min(endJulian,jd+stepDays)){
    const current=sample(jd);
    if(!Number.isFinite(current.marginDegrees))throw Error("Non-finite Asta margin");
    const previousInside=prev.marginDegrees<=0,nowInside=current.marginDegrees<=0;
    if(previousInside!==nowInside){
      let crossingJd=(prevJd+jd)/2;
      let quality:AstaModelCrossing["quality"]="continuous-threshold";
      if(prev.retrograde!==current.retrograde){
        quality="station-switch-unresolved";
      }else{
        let lo=prevJd,hi=jd,loInside=previousInside;
        for(let i=0;i<35;i++){
          const mid=(lo+hi)/2;
          const v=sample(mid);
          if(v.retrograde!==prev.retrograde){
            quality="station-switch-unresolved";
            break;
          }
          if((v.marginDegrees<=0)===loInside)lo=mid;else hi=mid;
        }
        crossingJd=(lo+hi)/2;
      }
      events.push({kind:nowInside?"enter":"exit",julian:crossingJd,quality});
    }
    if(jd===endJulian)break;
    prevJd=jd;
    prev=current;
  }
  return events;
}
export function nearestAstaResidualMinutes(
  referenceJulian:number,kind:"enter"|"exit",events:readonly AstaModelCrossing[]
){
  if(!Number.isFinite(referenceJulian))return null;
  const ranked=events.filter(x=>x.kind===kind&&x.quality==="continuous-threshold")
    .sort((a,b)=>Math.abs(a.julian-referenceJulian)-Math.abs(b.julian-referenceJulian));
  return ranked.length?Math.round((ranked[0].julian-referenceJulian)*1440):null;
}
export function localIstDateTimeToJulian(value:string):number|null{
  if(!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(value))return null;
  const datePart=value.slice(0,10);
  const millis=Date.parse(value+":00+05:30");
  if(!Number.isFinite(millis))return null;
  // Prevent native Date's rollover of nonexistent dates.
  const d=new Date(Date.parse(datePart+"T00:00:00Z"));
  if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==datePart)return null;
  return millis/86400000+2440587.5;
}
