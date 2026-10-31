/**
 * Documentation-derived decision predicates ONLY, not a public ISKCON selector.
 * Source: GCAL Vaisnava Events Calculation, §§1.3–1.4, tables 1–2.
 *
 * The source-specific tests are deliberately separate from the existing
 * independent fasting decision (which is not overwritten or tuned to an oracle).
 */
export type IndependentRuleDay={
 date:string;sunriseTithi:number;arunodayaTithi:number;
 sunsetTithi:number;swissNakshatra:number;jplNakshatra:number;
};
export type IndependentRuleEvidence={
 candidateDate:string;family:string;matchedPredicate:string|null;
 allTruePredicates:string[];falsePredicates:Record<string,string>;
 sunriseStateIsDocumentedPredicate:boolean;
 nearBoundaryNotARule:boolean;ritualCertified:false
};
const E=(n:number)=>n%15===10,D=(n:number)=>n%15===11,T=(n:number)=>n%15===12;
const same=(a:number,b:number)=>Math.floor(a/15)===Math.floor(b/15);
const isGaurD=(n:number)=>n===11;
const specialNak:Readonly<Record<number,string>>={
 21:"VIJAYA",6:"JAYA",3:"JAYANTI",7:"PAPANASINI"};
const fail=(x:boolean,msg:string)=>{if(!x)throw Error("Non-publishing GCal rule decision proof: "+msg);};
function repeatedFullMoon(days:readonly IndependentRuleDay[],at:number):boolean{
 const moon=days[at].sunriseTithi<15?14:29;
 const future=days.slice(at+1,at+9);
 return future.some((x,i)=>x.sunriseTithi===moon&&future[i+1]?.sunriseTithi===moon);
}
export function documentedMahadvadashiPredicates(
 days:readonly IndependentRuleDay[],date:string,
 nakshatraModel:"swiss-lahiri"|"jpl-lahiri-anchored"
):IndependentRuleEvidence{
 fail(days.length>=4&&new Set(days.map(x=>x.date)).size===days.length,"At least 4 nonduplicate dawn samples");
 for(let i=0;i<days.length;i++){
  const x=days[i];
  fail([x.sunriseTithi,x.arunodayaTithi,x.sunsetTithi].every(v=>Number.isInteger(v)&&v>=0&&v<=29)&&
   [x.swissNakshatra,x.jplNakshatra].every(v=>Number.isInteger(v)&&v>=0&&v<27),
   "Invalid independently calculated astronomical model input "+x.date);
  if(i)fail(Date.parse(x.date+"T00:00:00Z")-Date.parse(days[i-1].date+"T00:00:00Z")===86400000,
   "Missing a source-independent civil day");
 }
 const k=days.findIndex(x=>x.date===date);
 fail(k>=1&&k+2<days.length,"Need preceding, following and second following independent dawn");
 const p=days[k-1],t=days[k],n=days[k+1];
 const nk=nakshatraModel==="swiss-lahiri"?t.swissNakshatra:t.jplNakshatra;
 const doc:Record<string,boolean>={
  "Unmilani: prior and current Ekadashi sunrise, prior clean at Arunodaya":
   E(p.sunriseTithi)&&E(p.arunodayaTithi)&&E(t.sunriseTithi)&&same(p.sunriseTithi,t.sunriseTithi),
  "Trisprsha: clean Ekadashi today sunrise, next sunrise Trayodashi":
   E(t.sunriseTithi)&&E(t.arunodayaTithi)&&T(n.sunriseTithi)&&same(t.sunriseTithi,n.sunriseTithi),
  "Vyanjuli: two consecutive Dvadasi sunrises following clean Ekadashi":
   E(p.sunriseTithi)&&E(p.arunodayaTithi)&&D(t.sunriseTithi)&&D(n.sunriseTithi)&&
    same(p.sunriseTithi,t.sunriseTithi)&&same(t.sunriseTithi,n.sunriseTithi),
  "Paksha-vardhini: repeated full/new Moon at future sunrise after Dvadasi":
   E(p.sunriseTithi)&&D(t.sunriseTithi)&&same(p.sunriseTithi,t.sunriseTithi)&&repeatedFullMoon(days,k),
  "Vijaya: Sravana sunrise with Gaura Dvadasi at sunset":
   nk===21&&t.sunriseTithi===11&&isGaurD(t.sunsetTithi),
  "Jaya: Punarvasu sunrise and Gaura Dvadasi at sunset and next sunrise":
   nk===6&&t.sunriseTithi===11&&isGaurD(t.sunsetTithi)&&isGaurD(n.sunriseTithi),
  "Jayanti: Rohini sunrise and Gaura Dvadasi at sunset and next sunrise":
   nk===3&&t.sunriseTithi===11&&isGaurD(t.sunsetTithi)&&isGaurD(n.sunriseTithi),
  "Papanasini: Pusya sunrise and Gaura Dvadasi at sunset and next sunrise":
   nk===7&&t.sunriseTithi===11&&isGaurD(t.sunsetTithi)&&isGaurD(n.sunriseTithi)
 };
 // The source specification applies Dvadasi preconditions and a priority
 // ordering (nakshatra before Vyanjuli before Paksha-vardhini).
 const order=[
  "Vijaya: Sravana sunrise with Gaura Dvadasi at sunset",
  "Jaya: Punarvasu sunrise and Gaura Dvadasi at sunset and next sunrise",
  "Jayanti: Rohini sunrise and Gaura Dvadasi at sunset and next sunrise",
  "Papanasini: Pusya sunrise and Gaura Dvadasi at sunset and next sunrise",
  "Vyanjuli: two consecutive Dvadasi sunrises following clean Ekadashi",
  "Paksha-vardhini: repeated full/new Moon at future sunrise after Dvadasi",
  "Unmilani: prior and current Ekadashi sunrise, prior clean at Arunodaya",
  "Trisprsha: clean Ekadashi today sunrise, next sunrise Trayodashi"
 ];
 const allTrue=order.filter(x=>doc[x]);
 const first=allTrue[0]??null;
 const family=first?.split(":")[0]??"NO_DOCUMENTED_SUBTYPE";
 const nearBoundaryButWrongTithi=D(t.sunriseTithi)&&E(t.arunodayaTithi)&&
    T(n.sunriseTithi)&&!doc["Trisprsha: clean Ekadashi today sunrise, next sunrise Trayodashi"];
 return {candidateDate:date,family,matchedPredicate:first,
  allTruePredicates:allTrue,
  falsePredicates:Object.fromEntries(Object.entries(doc).filter(([_,v])=>!v).map(([x])=>[x,"independent physical dawn/sunset preconditions not met"])),
  sunriseStateIsDocumentedPredicate:!nearBoundaryButWrongTithi,
  nearBoundaryNotARule:nearBoundaryButWrongTithi,ritualCertified:false};
}
export const MAHADVADASHI_PUBLISH_GUARD={
 sourceGcalLabelsUsedForClassification:false,changingFastingDateApproved:false,
 publicRitualApproval:false,independentAyanamsaApproved:false
} as const;
