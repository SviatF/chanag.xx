/**
 * Independent sunrises-only ISKCON-family structural event candidates.
 *
 * Unlike a GCal TXT/XML parser, every label is inferred from consecutive
 * observed Swiss Tithis. Status is research only, NEVER publish these as
 * approved religious observance dates. Source GCal Vaisnava Calculation PDF.
 */
export type DawnTithi={date:string;sunriseIndex:number;arunodayaIndex:number;nearBoundary?:boolean;nearNakshatraBoundary?:boolean;nakshatra?:string;nakshatraIndex?:number};
export type MahadvadashiKind="UNMILANI"|"TRISPRSHA"|"VYANJULI"|"PAKSHA_VARDHINI"|"NAKSHATRA_REVIEW"|null;
export type Tradition="smarta"|"vaishnava"|"iskcon";
export type MahadvadashiCandidate={
 date:string;kind:MahadvadashiKind;reason:string;nakshatraSubtype:NakshatraMahadvadashi|null;
 researchAmbiguities:string[];
 sourceOfDecision:"independent-astronomical-rules";
 fastCandidates:Record<Tradition,string|null>;
 needsManualReview:boolean;certified:false;
};
export type NakshatraMahadvadashi="JAYA"|"JAYANTI"|"VIJAYA"|"PAPANASINI";
const mod15=(i:number)=>i%15;
const E=(i:number)=>mod15(i)===10;
const D=(i:number)=>mod15(i)===11;
const T=(i:number)=>mod15(i)===12;
const sameFortnight=(a:number,b:number)=>Math.floor(a/15)===Math.floor(b/15);
const nakshatraKinds:Record<number,NakshatraMahadvadashi>={3:"JAYANTI",6:"JAYA",7:"PAPANASINI",21:"VIJAYA"};
export function identifySourceNakshatra(raw:string):NakshatraMahadvadashi|null{
 const s=raw.toUpperCase().replace(/[^A-Z]/g,"");
 if(s.includes("JAYANTI"))return "JAYANTI";
 if(s.includes("VIJAYA"))return "VIJAYA";
 if(s.includes("PAPANASINI"))return "PAPANASINI";
 if(s.includes("JAYA"))return "JAYA";
 return null;
}
function iso(day:string){return /^\d{4}-\d{2}-\d{2}$/.test(day)&&!isNaN(Date.parse(day+"T00:00:00Z"))&&new Date(day+"T00:00:00Z").toISOString().slice(0,10)===day;}
function dayDelta(a:string,b:string){return Math.round((Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/86400000);}
export function classifyMahadvadashiSequence(days:readonly DawnTithi[],targetDate:string):MahadvadashiCandidate{
 const ordered=[...days].sort((a,b)=>a.date.localeCompare(b.date));
 if(ordered.length<3||new Set(ordered.map(x=>x.date)).size!==ordered.length)throw Error("Missing or duplicate dawn observations");
 for(let i=0;i<ordered.length;i++){
  const d=ordered[i];
  if(!iso(d.date)||![d.sunriseIndex,d.arunodayaIndex].every(x=>Number.isInteger(x)&&x>=0&&x<30)||
   (d.nakshatraIndex!==undefined&&(!Number.isInteger(d.nakshatraIndex)||d.nakshatraIndex<0||d.nakshatraIndex>=27)))throw Error("Invalid independent dawn");
  if(i&&dayDelta(ordered[i-1].date,d.date)!==1)throw Error("Non-consecutive sunrise observations");
 }
 const k=ordered.findIndex(x=>x.date===targetDate);
 if(k<1||k>=ordered.length-1)throw Error("Need preceding and following sunrise");
 const day=ordered[k],prev=ordered[k-1],next=ordered[k+1];
 // No GCal information may be passed here. All decisions use independent
 // Lahiri Moon Nakshatra and Swiss sunrise/Arunodaya Tithi observations.
 const hasRepeatAtFollowingPurnima=(index:number)=>{
  const paksha=ordered[index].sunriseIndex<15?14:29;
  const future=ordered.slice(index+1,index+9);
  for(let j=0;j+1<future.length;j++){
   if(future[j].sunriseIndex===paksha&&future[j+1].sunriseIndex===paksha)return true;
  }
  return false;
 };
 const nakshatraSubtypeAt=(index:number):NakshatraMahadvadashi|null=>{
  const d=ordered[index],following=ordered[index+1];
  if(!following||d.sunriseIndex!==11||d.nakshatraIndex===undefined||
     following.nakshatraIndex===undefined||d.nakshatraIndex!==following.nakshatraIndex)return null;
  return nakshatraKinds[d.nakshatraIndex]??null;
 };
 const nakshatraSubtype=nakshatraSubtypeAt(k);
 const prevEkadashiViddha=E(prev.sunriseIndex)&&mod15(prev.arunodayaIndex)===9&&
   sameFortnight(prev.sunriseIndex,prev.arunodayaIndex);
 // Ekadashi can be kshaya even at Arunodaya: yesterday sunrise was Dasami,
 // today sunrise is Dvadasi. A sunrise-only screen must not discard this fast.
 // Requiring today's Arunodaya to still be Ekadashi misses the full-kshaya case.
 const skippedEkadashiAtSunrise=D(day.sunriseIndex)&&mod15(prev.sunriseIndex)===9&&
   sameFortnight(day.sunriseIndex,prev.sunriseIndex)&&
   (E(day.arunodayaIndex)||D(day.arunodayaIndex));
 const kshayaOrVedhaTransfer=D(day.sunriseIndex)&&(prevEkadashiViddha||skippedEkadashiAtSunrise);
 let kind:MahadvadashiKind=null,reason="No structural Mahadvadashi identified";
 if(E(prev.sunriseIndex)&&E(day.sunriseIndex)){
  kind="UNMILANI";reason="Second sunrise under Ekadashi; fast shifts to second occurrence";
 }else if(E(day.sunriseIndex)&&T(next.sunriseIndex)){
  kind="TRISPRSHA";reason="Dvadasi skipped at sunrise after Ekadashi";
 }else if(E(prev.sunriseIndex)&&D(day.sunriseIndex)&&D(next.sunriseIndex)){
  kind="VYANJULI";reason="Dvadasi spans two consecutive sunrises";
 }else if(E(prev.sunriseIndex)&&D(day.sunriseIndex)&&hasRepeatAtFollowingPurnima(k)){
  kind="PAKSHA_VARDHINI";reason="Later full/new Moon Tithi spans two sunrises";
 }else if(nakshatraSubtype){
  kind="NAKSHATRA_REVIEW";reason="Independently observed bright Dvadasi plus repeated "+nakshatraSubtype+" Nakshatra";
 }else if(kshayaOrVedhaTransfer){
  reason=skippedEkadashiAtSunrise?"Ekadashi absent at both consecutive sunrises; Dvadasi research transfer (Kshaya)":
   "Prior Ekadashi had Dashami at Arunodaya; Viddha research transfer to Dvadasi";
 }
 // Only the immediate observance window and the relevant later Paksha
 // boundary can invalidate this classification; a random boundary a week
 // later must NOT turn an unrelated fast into a boundary-sensitive case.
 const researchAmbiguities:string[]=[];
 const vicinity=ordered.slice(Math.max(0,k-1),Math.min(ordered.length,k+2));
 const boundaryRisk=vicinity.some(x=>x.nearBoundary===true||x.nearNakshatraBoundary===true);
 if(boundaryRisk)researchAmbiguities.push("observance-window-tithi-or-nakshatra-boundary");
 if(D(day.sunriseIndex)&&E(prev.sunriseIndex)&&T(next.sunriseIndex)&&next.nearBoundary)
  researchAmbiguities.push("possible-vyanjuli-at-next-sunrise");
 if(D(day.sunriseIndex)&&E(day.arunodayaIndex)&&T(next.sunriseIndex)&&day.nearBoundary)
  researchAmbiguities.push("possible-trisprsha-kshaya-at-current-sunrise");
 if(D(day.sunriseIndex)&&E(prev.sunriseIndex)&&!hasRepeatAtFollowingPurnima(k)){
  const full=day.sunriseIndex<15?14:29;
  const newMoonSuccessor=day.sunriseIndex<15?15:0;
  const future=ordered.slice(k+1,k+9);
  if(future.some((x,j)=>x.sunriseIndex===full&&future[j+1]?.sunriseIndex===newMoonSuccessor&&future[j+1].nearBoundary))
   researchAmbiguities.push("possible-paksha-vardhini-at-purnima-amavasya-boundary");
 }
 const arunodayaVedha=E(day.sunriseIndex)&&mod15(day.arunodayaIndex)===9&&sameFortnight(day.sunriseIndex,day.arunodayaIndex);
 // Never count the first of two Ekadashi sunrises, nor a day superseded
 // by next-day Dvadasi special observance.
 const followingDvadashiSpecial=E(day.sunriseIndex)&&D(next.sunriseIndex)&&(
  (ordered[k+2]!==undefined&&D(ordered[k+2].sunriseIndex))||
  hasRepeatAtFollowingPurnima(k+1)||
  nakshatraSubtypeAt(k+1)!==null
 );
 const firstOfRepeatedEkadashi=E(day.sunriseIndex)&&E(next.sunriseIndex);
 const validEkadashiToday=E(day.sunriseIndex)&&!arunodayaVedha&&!firstOfRepeatedEkadashi&&!followingDvadashiSpecial;
 const specialDvadashi=kind==="VYANJULI"||kind==="PAKSHA_VARDHINI"||kind==="NAKSHATRA_REVIEW";
 const fastHere=validEkadashiToday||(D(day.sunriseIndex)&&(specialDvadashi||kshayaOrVedhaTransfer));
 const smarta=(kind==="UNMILANI"||kind==="VYANJULI"||kind==="PAKSHA_VARDHINI")&&E(prev.sunriseIndex)?prev.date:
  E(day.sunriseIndex)?day.date:E(prev.sunriseIndex)?prev.date:null;
 return {date:day.date,kind,nakshatraSubtype,reason,researchAmbiguities,sourceOfDecision:"independent-astronomical-rules",
  fastCandidates:{smarta,vaishnava:fastHere?day.date:null,iskcon:fastHere?day.date:null},
  needsManualReview:researchAmbiguities.length>0||kind!==null||kshayaOrVedhaTransfer||!fastHere,
  certified:false};
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
