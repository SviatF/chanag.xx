export const MINUTES_PER_DAY=24*60;

export function normalizeDayMinutes(minutes:number){
  return ((minutes%MINUTES_PER_DAY)+MINUTES_PER_DAY)%MINUTES_PER_DAY;
}

export function parseClockMinutes(value:string){
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
 * Panchvani's approved clock runs counter-clockwise:
 * 24:00 at the top, 06:00 left, 12:00 bottom, 18:00 right.
 */
export function minutesToDialAngle(minutes:number){
  return (360-(normalizeDayMinutes(minutes)/MINUTES_PER_DAY)*360)%360;
}

/** Forward elapsed minutes from start to end, wrapping through midnight. */
export function forwardSpanMinutes(start:number,end:number){
  const normalizedStart=normalizeDayMinutes(start);
  const normalizedEnd=normalizeDayMinutes(end);
  const span=normalizedEnd-normalizedStart;
  return span>0?span:span+MINUTES_PER_DAY;
}

export function midpointMinutes(start:number,end:number){
  return normalizeDayMinutes(start+forwardSpanMinutes(start,end)/2);
}

/**
 * Returns progress through a forward time window. A value in [0,1] is inside
 * the window; values above 1 are beyond the window in the same forward cycle.
 */
export function progressThroughWindow(minutes:number,start:number,end:number){
  const span=forwardSpanMinutes(start,end);
  const normalizedStart=normalizeDayMinutes(start);
  let elapsed=normalizeDayMinutes(minutes)-normalizedStart;
  if(elapsed<0)elapsed+=MINUTES_PER_DAY;
  return elapsed/span;
}
