import type {RecommendedMuhuratWindow} from "./muhurat";

/**
 * Sunrise Tithi/Nakshatra are necessary, but NOT sufficient, for a Muhurat.
 * These end instants only bound the same sunrise-active combination.
 * Neither this helper nor its score certifies Lagna or complete Panchang Shuddhi.
 *
 * V2 precomputed rows lack end instants: keep their existing clock references
 * explicitly classified as sunrise-only until V3 shards are generated.
 */
export type MuhuratLunarEvidence={
  date:string;
  tithiEnd?:string;
  tithiEndDate?:string|null;
  nakshatraEnd?:string;
  nakshatraEndDate?:string|null;
};
export type MuhuratLunarWindowResult={
  status:"sunrise-only"|"lunar-bounded"|"invalid-evidence";
  windows:RecommendedMuhuratWindow[];
  limitMinutes:number|null;
};

const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
const CLOCK_RE=/^([01]\d|2[0-3]):([0-5]\d)$/;
function civilDay(iso:string):number|null{
  if(!DATE_RE.test(iso))return null;
  const time=Date.parse(iso+"T00:00:00Z");
  return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===iso?time/86400000:null;
}
function clockMinutes(clock:string):number|null{
  const match=CLOCK_RE.exec(clock);
  return match?Number(match[1])*60+Number(match[2]):null;
}
function endingMinutes(baseDate:string,endDate:unknown,endTime:unknown):number|null{
  if(typeof endDate!=="string"||typeof endTime!=="string")return null;
  const base=civilDay(baseDate),end=civilDay(endDate),minutes=clockMinutes(endTime);
  if(base===null||end===null||minutes===null)return null;
  const offset=end-base;
  // A sunrise-active Tithi/Nakshatra should not have a past or distant end.
  if(!Number.isInteger(offset)||offset<0||offset>2)return null;
  return offset*1440+minutes;
}

export function boundMuhuratWindowsByLunarTransitions(
  evidence:MuhuratLunarEvidence,
  references:ReadonlyArray<RecommendedMuhuratWindow>
):MuhuratLunarWindowResult{
  const fields=[evidence.tithiEnd,evidence.tithiEndDate,evidence.nakshatraEnd,evidence.nakshatraEndDate];
  if(fields.every(field=>field===undefined)){
    return {status:"sunrise-only",windows:references.map(w=>({...w,sources:[...w.sources]})),limitMinutes:null};
  }
  const tithiEnd=endingMinutes(evidence.date,evidence.tithiEndDate,evidence.tithiEnd);
  const nakshatraEnd=endingMinutes(evidence.date,evidence.nakshatraEndDate,evidence.nakshatraEnd);
  if(tithiEnd===null||nakshatraEnd===null){
    return {status:"invalid-evidence",windows:[],limitMinutes:null};
  }
  const limitMinutes=Math.min(tithiEnd,nakshatraEnd);
  const windows:RecommendedMuhuratWindow[]=[];
  for(const window of references){
    const start=clockMinutes(window.start),end=clockMinutes(window.end);
    // The existing references are daytime and same-date, never overnight.
    if(start===null||end===null||end<=start)continue;
    const clippedEnd=Math.min(end,limitMinutes);
    if(clippedEnd-start<15)continue;
    const hours=String(Math.floor(clippedEnd/60)).padStart(2,"0");
    const minutes=String(clippedEnd%60).padStart(2,"0");
    windows.push({...window,end:hours+":"+minutes,sources:[...window.sources]});
  }
  return {status:"lunar-bounded",windows,limitMinutes};
}
