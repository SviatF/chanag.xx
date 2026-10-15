/**
 * Wave 3AR: continuous angular residual between two source-frame boundaries.
 * No rounded clock labels: solve the actual UT instant on the Swiss side.
 */
export const signedAngleDegrees=(value:number,boundary:number)=>{
  if(!Number.isFinite(value)||!Number.isFinite(boundary))
    throw Error("Nonfinite model angular coordinate");
  return ((value-boundary+540)%360)-180;
};
export const eventDegrees=(index:number,modulus:number)=>{
  if(!Number.isInteger(index)||!Number.isInteger(modulus)||
     modulus<2||index<0||index>=modulus)
    throw Error("Invalid event segment target");
  return index*360/modulus;
};
export type RootSolveResult={swissRootUtcMs:number;deltaSeconds:number;iterations:number};
export function bisectSwissRoot(
  targetDegrees:number,jplRootMs:number,
  swissAngleAtMs:(at:number)=>number,
  windowMs=30*60_000
):RootSolveResult{
  if(!Number.isFinite(jplRootMs)||!Number.isFinite(targetDegrees)||
     !Number.isFinite(windowMs)||windowMs<=0)
    throw Error("Invalid ephemeris/root solving inputs");
  let lo=jplRootMs-windowMs,hi=jplRootMs+windowMs;
  let a=signedAngleDegrees(swissAngleAtMs(lo),targetDegrees);
  let b=signedAngleDegrees(swissAngleAtMs(hi),targetDegrees);
  if(!(a<0&&b>=0))
    throw Error("Swiss transition does not bracket JPL root within checked 30-minute interval: "+JSON.stringify({a,b,targetDegrees,jplRootMs}));
  let n=0;
  // Sub-second precision; no calendar-event interpolation or rounding to
  // a minute before deciding what side of sunrise owns the segment.
  while(hi-lo>100&&n<22){
    const mid=Math.round((lo+hi)/2);
    const fm=signedAngleDegrees(swissAngleAtMs(mid),targetDegrees);
    if(fm<0){lo=mid;a=fm;}else{hi=mid;b=fm;}
    n++;
  }
  if(!(a<=0&&b>=0&&hi-lo<=100))
    throw Error("Bisection failed UT root monotonicity");
  const swissRootUtcMs=Math.round((lo+hi)/2);
  return {swissRootUtcMs,deltaSeconds:(swissRootUtcMs-jplRootMs)/1000,iterations:n};
}
export const rootDisagreementTier=(seconds:number)=>{
  if(!Number.isFinite(seconds)||seconds<0)throw Error("Invalid signed ephemeris root distance");
  if(seconds<=30)return "0-30s" as const;
  if(seconds<=120)return "31-120s" as const;
  if(seconds<=300)return "121-300s" as const;
  if(seconds<=600)return "301-600s" as const;
  return ">600s" as const;
};
