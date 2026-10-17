/**
 * Content Trust CT3: descriptive intersections of locally calculated windows.
 *
 * This is date/city-specific arithmetic, NOT independent ritual approval.
 * A green label or Abhijit on its own does not certify a ceremony date.
 */
import type {Panchang,TimeWindow} from "./panchang";

export type ObservedTimingOverlap={
  source:string;
  sourceWindow:string;
  excludedBy:string;
  excludedWindow:string;
  overlapMinutes:number;
  overlapStart:string;
  overlapEnd:string;
};
function minutes(value:string){
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))throw Error("Unusable Panchang local clock: "+value);
  const [hours,mins]=value.split(":").map(Number);
  return hours*60+mins;
}
function clock(value:number){return `${String(Math.floor(value/60)).padStart(2,"0")}:${String(value%60).padStart(2,"0")}`;}
function checkWindow(window:TimeWindow){
  const start=minutes(window.start),end=minutes(window.end);
  if(end<=start)throw Error(`Unusable daytime interval ${window.start}–${window.end}`);
  return {start,end};
}
export function computeObservedDailyTimingOverlaps(data:Pick<Panchang,"abhijit"|"dayChoghadiya"|"rahu"|"yamaganda"|"gulika">){
  const inputs:{label:string;window:TimeWindow}[]=[];
  if(data.abhijit)inputs.push({label:"Abhijit Muhurat",window:data.abhijit});
  for(const period of data.dayChoghadiya)if(period.effect==="good")inputs.push({label:`${period.name} Choghadiya`,window:period});
  const exclusions=[
    {label:"Rahu Kalam",window:data.rahu},
    {label:"Yamaganda",window:data.yamaganda},
    {label:"Gulika Kalam",window:data.gulika},
  ];
  const conflicts:ObservedTimingOverlap[]=[];
  for(const candidate of inputs){
    const candidateMinutes=checkWindow(candidate.window);
    for(const excluded of exclusions){
      const exclusionMinutes=checkWindow(excluded.window);
      const start=Math.max(candidateMinutes.start,exclusionMinutes.start);
      const end=Math.min(candidateMinutes.end,exclusionMinutes.end);
      if(end>start)conflicts.push({
        source:candidate.label,
        sourceWindow:`${candidate.window.start}–${candidate.window.end}`,
        excludedBy:excluded.label,
        excludedWindow:`${excluded.window.start}–${excluded.window.end}`,
        overlapMinutes:end-start,
        overlapStart:clock(start),overlapEnd:clock(end)
      });
    }
  }
  return conflicts;
}
