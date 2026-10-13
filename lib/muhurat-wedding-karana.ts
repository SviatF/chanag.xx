import type {RecommendedMuhuratWindow} from "./muhurat";
import {muhuratRelativeEndMinutes} from "./muhurat-lunar-transitions";

/**
 * Ceremony-specific, independently documented prohibition: Vishti/Bhadra
 * is unsuitable for wedding Muhurat in the reviewed traditional frameworks.
 *
 * References: Drik Panchang (Marriage Panchang Shuddhi),
 * AstroSage (marriage dates / prohibited Karana).
 *
 * Keep all times in the civil-day 0..1440 local clock. The lunar engine has
 * ALREADY clipped each source window to the sunrise-active Tithi/Nakshatra.
 * Here we only remove overlapping Vishti periods; we do not claim to have
 * implemented all Yoga, Asta, Lagna or regional marriage eligibility rules.
 */
export type WeddingKaranaEvidence={
  date:string;
  karana?:string;
  karanaEnd?:string;
  karanaEndDate?:string|null;
  tithiEnd?:string;
  tithiEndDate?:string|null;
};
type LocalRange={start:number;end:number};
export type WeddingKaranaScreen={
  status:"vishti-screened"|"invalid-evidence";
  windows:RecommendedMuhuratWindow[];
  blocked:ReadonlyArray<{start:string;end:string}>;
};
const CLOCK=/^([01]\d|2[0-3]):([0-5]\d)$/;
function mins(time:string){
  const m=CLOCK.exec(time);
  return m?Number(m[1])*60+Number(m[2]):null;
}
function clock(value:number){
  if(value<0||value>=1440)throw new Error("Invalid local clock bound");
  return String(Math.floor(value/60)).padStart(2,"0")+":"+String(value%60).padStart(2,"0");
}
function removeBlocked(window:RecommendedMuhuratWindow,blocked:ReadonlyArray<LocalRange>){
  const start=mins(window.start),end=mins(window.end);
  if(start===null||end===null||end<=start)return [];
  let chunks:LocalRange[]=[{start,end}];
  for(const b of blocked){
    const next:LocalRange[]=[];
    for(const item of chunks){
      if(b.end<=item.start||b.start>=item.end){next.push(item);continue;}
      if(item.start<b.start)next.push({start:item.start,end:Math.min(item.end,b.start)});
      if(item.end>b.end)next.push({start:Math.max(item.start,b.end),end:item.end});
    }
    chunks=next;
  }
  return chunks.filter(w=>w.end-w.start>=15).map(w=>({...window,start:clock(w.start),end:clock(w.end),sources:[...window.sources]}));
}

/**
 * Only the first TWO karanas of the sunrise-active tithi are relevant before
 * that tithi ends. Sunrise-active Vanija may be followed by Vishti, but
 * only if its boundary is earlier than the current Tithi boundary.
 * A sunrise-active Vishti is blocked until its own transition. All other
 * Karana names leave the existing candidate clocks intact; we NEVER infer
 * suitability from a non-Vishti Karana.
 */
const KNOWN_KARANAS=new Set(["Kimstughna","Bava","Balava","Kaulava","Taitila","Garaja","Vanija","Vishti","Shakuni","Chatushpada","Naga"]);
export function hasCompleteWeddingKaranaEvidence(evidence:WeddingKaranaEvidence):boolean{
  const k=muhuratRelativeEndMinutes(evidence.date,evidence.karanaEndDate,evidence.karanaEnd);
  const t=muhuratRelativeEndMinutes(evidence.date,evidence.tithiEndDate,evidence.tithiEnd);
  return typeof evidence.karana==="string"&&KNOWN_KARANAS.has(evidence.karana)&&
    k!==null&&t!==null&&k>0&&t>0&&k<=t+1;
}
export function screenWeddingVishtiKarana(
  evidence:WeddingKaranaEvidence,
  windows:ReadonlyArray<RecommendedMuhuratWindow>
):WeddingKaranaScreen{
  const k=evidence.karanaEnd===undefined?null:
    muhuratRelativeEndMinutes(evidence.date,evidence.karanaEndDate,evidence.karanaEnd);
  const t=evidence.tithiEnd===undefined?null:
    muhuratRelativeEndMinutes(evidence.date,evidence.tithiEndDate,evidence.tithiEnd);
  if(!hasCompleteWeddingKaranaEvidence(evidence)||k===null||t===null)
    return {status:"invalid-evidence",windows:[],blocked:[]};

  const ranges:LocalRange[]=[];
  const prohibited=new Set(["Vishti","Shakuni","Chatushpada","Naga"]);
  if(evidence.karana&&prohibited.has(evidence.karana)){
    ranges.push({start:0,end:Math.min(1440,k)});
  }else if(evidence.karana==="Vanija"&&k<t-1){
    // The moveable Karana sequence is ... Garaja -> Vanija -> Vishti.
    // Distinguish first-half Vanija from second-half Vanija via actual
    // tithi-ending evidence, not a fixed noon or 6-hour estimate.
    if(k<1440)ranges.push({start:k,end:Math.min(1440,t)});
  }
  const normalized=ranges.filter(x=>x.end>x.start);
  const screened=windows.flatMap(w=>removeBlocked(w,normalized));
  return {
    status:"vishti-screened",
    windows:screened,
    blocked:normalized.map(r=>({start:clock(r.start),end:clock(r.end===1440?1439:r.end)}))
  };
}
