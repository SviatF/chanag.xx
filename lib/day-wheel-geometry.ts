export const MINUTES_PER_DAY=24*60;

export type DialWedge={start:number;end:number};

export function normalizeDayMinutes(minutes:number){
  return ((minutes%MINUTES_PER_DAY)+MINUTES_PER_DAY)%MINUTES_PER_DAY;
}

export function parseClockMinutes(value:string|null|undefined){
  if(!value)return null;
  const match=/^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if(!match)return null;

  const hour=Number(match[1]);
  const minute=Number(match[2]);
  if(!Number.isInteger(hour)||!Number.isInteger(minute)||hour<0||hour>23||minute<0||minute>59){
    return null;
  }
  return hour*60+minute;
}

/**
 * DayWheel real-time orientation:
 * 12 AM top, 6 AM right, 12 PM bottom, 6 PM left.
 * Time advances clockwise, matching a familiar clock face.
 */
export function minutesToDialAngle(minutes:number){
  return (normalizeDayMinutes(minutes)/MINUTES_PER_DAY)*360;
}

export function forwardSpanMinutes(start:number,end:number){
  const a=normalizeDayMinutes(start);
  const b=normalizeDayMinutes(end);
  return b>=a?b-a:b+MINUTES_PER_DAY-a;
}

export function forwardMidpointMinutes(start:number,end:number){
  return normalizeDayMinutes(start+forwardSpanMinutes(start,end)/2);
}

/**
 * sectorPath() draws clockwise and time now advances clockwise too.
 * Render an exact time interval directly from its start-time angle to end-time angle.
 */
export function clockwiseWedgeForTimeInterval(startMinutes:number,endMinutes:number):DialWedge{
  const start=minutesToDialAngle(startMinutes);
  let end=minutesToDialAngle(endMinutes);
  while(end<=start)end+=360;
  return {start,end};
}

/** Keep a decorative wedge width while centering it on an exact instant. */
export function centeredClockwiseWedge(minutes:number,widthDegrees:number):DialWedge{
  const center=minutesToDialAngle(minutes);
  let start=center-widthDegrees/2;
  let end=center+widthDegrees/2;
  while(start<0){start+=360;end+=360;}
  return {start,end};
}
