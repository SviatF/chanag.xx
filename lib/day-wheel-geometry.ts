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
 * Approved DayWheel orientation:
 * 24:00 top, 06:00 left, 12:00 bottom, 18:00 right.
 * Time therefore advances counter-clockwise around the dial.
 */
export function minutesToDialAngle(minutes:number){
  return (360-(normalizeDayMinutes(minutes)/MINUTES_PER_DAY)*360)%360;
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
 * sectorPath() draws clockwise, while time advances counter-clockwise.
 * So an exact time interval is rendered clockwise from the end-time angle
 * back to the start-time angle.
 */
export function clockwiseWedgeForTimeInterval(startMinutes:number,endMinutes:number):DialWedge{
  const start=minutesToDialAngle(endMinutes);
  let end=minutesToDialAngle(startMinutes);
  while(end<=start)end+=360;
  return {start,end};
}

/** Keep the approved decorative wedge width but center it on an exact instant. */
export function centeredClockwiseWedge(minutes:number,widthDegrees:number):DialWedge{
  const center=minutesToDialAngle(minutes);
  let start=center-widthDegrees/2;
  let end=center+widthDegrees/2;
  while(start<0){start+=360;end+=360;}
  return {start,end};
}
