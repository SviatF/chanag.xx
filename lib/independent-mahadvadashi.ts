/**
 * Independent sunrises-only ISKCON-family structural event candidates.
 *
 * Unlike a GCal TXT/XML parser, every label is inferred from consecutive
 * observed Swiss Tithis. Status is research only, NEVER publish these as
 * approved religious observance dates. Source GCal Vaisnava Calculation PDF.
 */
export type DawnTithi={date:string;sunriseIndex:number;arunodayaIndex:number;nearBoundary?:boolean;nakshatra?:string};
export type MahadvadashiKind="UNMILANI"|"TRISPRSHA"|"VYANJULI"|"PAKSHA_VARDHINI"|"NAKSHATRA_REVIEW"|null;
export type Tradition="smarta"|"vaishnava"|"iskcon";
export type MahadvadashiCandidate={
 date:string;kind:MahadvadashiKind;reason:string;
 sourceOfDecision:"independent-astronomical-rules";
 fastCandidates:Record<Tradition,string|null>;
 needsManualReview:boolean;certified:false;
};
const mod15=(i:number)=>i%15;
const E=(i:number)=>mod15(i)===10;
const D=(i:number)=>mod15(i)===11;
const T=(i:number)=>mod15(i)===12;
const isFull=(i:number)=>i===14||i===29;
function iso(day:string){return /^\d{4}-\d{2}-\d{2}$/.test(day)&&!isNaN(Date.parse(day+"T00:00:00Z"))&&new Date(day+"T00:00:00Z").toISOString().slice(0,10)===day;}
function dayDelta(a:string,b:string){return Math.round((Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/86400000);}
export function classifyMahadvadashiSequence(days:readonly DawnTithi[],targetDate:string):MahadvadashiCandidate{
 const ordered=[...days].sort((a,b)=>a.date.localeCompare(b.date));
 if(ordered.length<3||new Set(ordered.map(x=>x.date)).size!==ordered.length)throw Error("Missing or duplicate dawn observations");
 for(let i=0;i<ordered.length;i++){
  const d=ordered[i];
  if(!iso(d.date)||![d.sunriseIndex,d.arunodayaIndex].every(x=>Number.isInteger(x)&&x>=0&&x<30))throw Error("Invalid independent dawn");
  if(i&&dayDelta(ordered[i-1].date,d.date)!==1)throw Error("Non-consecutive sunrise observations");
 }
 const k=ordered.findIndex(x=>x.date===targetDate);
 if(k<1||k>=ordered.length-1)throw Error("Need preceding and following sunrise");
 const day=ordered[k],prev=ordered[k-1],next=ordered[k+1];
 let kind:MahadvadashiKind=null,reason="No structural Mahadvadashi identified";
 if(E(prev.sunriseIndex)&&E(day.sunriseIndex)){
  kind="UNMILANI";reason="Ekadashi at two consecutive sunrises: second occurrence";
 } else if(E(day.sunriseIndex)&&T(next.sunriseIndex)){
  kind="TRISPRSHA";reason="Ekadashi at sunrise, Trayodashi at following sunrise (Dvadasi crossed between)";
 } else if(E(prev.sunriseIndex)&&D(day.sunriseIndex)&&D(next.sunriseIndex)){
  kind="VYANJULI";reason="Dvadasi at both current and following sunrise after Ekadashi";
 } else if(E(prev.sunriseIndex)&&D(day.sunriseIndex)){
  const future=ordered.slice(k+1,k+7);
  // Repeated full/new Moon later in the same Paksha. The candidate requires
  // six future sunrise observations for full confidence. An absence within an
  // insufficient window is a research gap, not a negative finding.
  for(let j=0;j<future.length-1;j++){
   if(isFull(future[j].sunriseIndex)&&future[j].sunriseIndex===future[j+1].sunriseIndex){
    kind="PAKSHA_VARDHINI";reason="Following Purnima/Amavasya repeated at two sunrises";break;
   }
  }
 }
 const boundaryRisk=ordered.slice(Math.max(0,k-1),Math.min(ordered.length,k+2)).some(x=>x.nearBoundary===true);
 const arunodayaVedha=E(day.sunriseIndex)&&(mod15(day.arunodayaIndex)===9);
 const smarta=E(day.sunriseIndex)?day.date:null;
 let vaishnava:string|null=null;
 if(!boundaryRisk&&!arunodayaVedha){
  if(kind==="UNMILANI"||kind==="TRISPRSHA"||kind==="VYANJULI"||kind==="PAKSHA_VARDHINI")vaishnava=day.date;
  else if(E(day.sunriseIndex)&&!E(next.sunriseIndex))vaishnava=day.date;
 }
 if(kind==="UNMILANI"||kind==="VYANJULI"||kind==="PAKSHA_VARDHINI"){
  // Smarta first Ekadashi rather than later special fasting day; if previous
  // sunrise is not actually Ekadashi, do not invent Smarta date.
  return {date:day.date,kind,reason,sourceOfDecision:"independent-astronomical-rules",
   fastCandidates:{smarta:E(prev.sunriseIndex)?prev.date:null,vaishnava,iskcon:vaishnava},
   needsManualReview:true,certified:false};
 }
 const uncertain=boundaryRisk||arunodayaVedha||kind===null;
 return {date:day.date,kind,reason,sourceOfDecision:"independent-astronomical-rules",
  fastCandidates:{smarta,vaishnava,iskcon:vaishnava},needsManualReview:uncertain||kind!==null,certified:false};
}
export function identifySourceMahadvadashi(raw:string):Exclude<MahadvadashiKind,null>|"UNRECOGNIZED"{
 const s=raw.toLowerCase().replace(/[\s_-]/g,"");
 if(s.includes("unmil"))return "UNMILANI";
 if(s.includes("trispr")||s.includes("trispar"))return "TRISPRSHA";
 if(s.includes("vyanj"))return "VYANJULI";
 if(s.includes("paksavard")||s.includes("pakshavard"))return "PAKSHA_VARDHINI";
 if(/jaya|jayanti|vijaya|papanasini/.test(s))return "NAKSHATRA_REVIEW";
 return "UNRECOGNIZED";
}
