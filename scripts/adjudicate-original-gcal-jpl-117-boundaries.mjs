/**
 * At original GCal's own precise sunrise/Arunodaya clock, independently
 * compare JPL physical Tithi not just on the fasting date but on the
 * consequential later day(s) for Vyanjuli and Paksha-vardhini.
 * Attribution is *astronomical comparison*, never a ritual verdict.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {dirname} from "node:path";
const q=Object.fromEntries(process.argv.slice(2).map(x=>{
 const m=x.match(/^--([a-z-]+)=(.+)$/);if(!m)throw Error("Invalid boundary arg");return [m[1],m[2]];
}));
for(const k of ["residual","gcal","jpl","output"])if(!q[k])throw Error("Missing --"+k);
const read=k=>JSON.parse(readFileSync(q[k],"utf8"));
const d=read("residual"),g=read("gcal"),t=read("jpl");
const check=(x,m)=>{if(!x)throw Error("Exact original GCal/JPL future-boundary proof: "+m);};
check(d.status==="JPL_TITHI_RESIDUAL_AND_PARANA_FULL_454_RESEARCH_COMPLETE"&&
 d.coverage.uniqueDisputedEventKeys===117&&d.coverage.cityYears===908&&
 d.coverage.remainingDateDisagreements===84&&d.coverage.remainingSubtypeDisagreements===73,
 "Wrong original 117 residual scientific input");
check(g.status==="RAW_GCAL_DAWN_TRACE_COMPLETE_RESEARCH_ONLY"&&
 g.originalExeGitBlob==="1d20f6e0caf29b6293157d258d02287e4edf0481"&&g.observedDayXmlRows===1360,
 "Wrong original GCal 11 source executable or XML");
check(t.wave==="3AF"&&t.kernelSha256==="c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2"&&
 t.halfTithiBoundaryCount===4512&&t.canaryOnly===true&&t.ritualSelectionCertified===false,
 "Non-pinned original JPL DE440s physical 6-degree roots");
const dayMap=new Map(g.dailySourceEvidence.map(x=>[x.city+"/"+x.date,x]));
const rows=t.halfTithiTransitions,times=rows.map(x=>x[0]);
const last=(at)=>{
 let lo=0,hi=times.length;
 while(lo<hi){const m=(lo+hi)>>>1;if(times[m]<=at)lo=m+1;else hi=m;}
 return lo-1;
};
const independentAt=ms=>{
 const k=last(ms);check(k>=0&&k<rows.length-2,"JPL physical source outside pinned coverage");
 return Math.floor(rows[k][1]/2);
};
const nearest=ms=>{
 const k=last(ms);
 return Math.min(k>=0?Math.abs(times[k]-ms):Infinity,k+1<times.length?Math.abs(times[k+1]-ms):Infinity);
};
const clock=(date,xml,tag)=>{
 const m=xml?.match(new RegExp("^<"+tag+"\\b[^>]*\\btime=\"(\\d{2}):(\\d{2}):(\\d{2})\""));
 if(!m)throw Error("GCal original "+tag+" clock not present "+date);
 return Date.parse(date+"T00:00:00Z")+((+m[1]*60+ +m[2])*60+ +m[3])*1000-330*60000;
};
const originalIndex=xml=>{
 const m=xml.match(/<tithi\b[^>]*\bindex="(\d+)"/);
 if(!m)throw Error("GCal source sunrise lacks numbered Tithi");
 const n=+m[1];check(n>=1&&n<=30,"Out-of-range original GCal tithi");return (n+14)%30;
};
const names={dasami:9,ekadasi:10,dvadasi:11,trayodasi:12,purnima:14,amavasya:14};
const arunodayaName=xml=>{
 const n=xml?.match(/<tithi\b[^>]*\bname="([^"]+)"/)?.[1]??"";
 return names[n.toLowerCase().replace(/[^a-z]/g,"")]??null;
};
const key=(city,date)=>city+"/"+date;
const cases=[],family={DATE_ONLY:[],PAKSHA_VARDHINI:[],TRISPRSHA:[],VYANJULI:[],UNMILANI:[],VIJAYA:[]};
const allSignals={fullMoonFutureModelDisagree:0,followingSunriseModelDisagree:0,
 targetSunriseModelDisagree:0,previousArunodayaModelDisagree:0,
 targetNoPhysicalTithiDifferenceWithinObservedWindow:0,
 casesWithAnyModelDiffWithinTwoMinutesOfJplPhysicalRoot:0};
for(const c of d.allCasePhysicalDawnEvidence){
 const details=[];
 for(const day of c.exactJplTithiWindow){
  const source=dayMap.get(key(c.city,day.date));
  if(!source)continue;
  const at=clock(day.date,source.sunriseXml,"sunrise"),src=originalIndex(source.sunriseXml),jpl=independentAt(at);
  const delta=nearest(at)/1000;
  const dte={date:day.date,originalGcalTithiAtOriginalSunrise:src,
   pinnedJplTithiAtSameOriginalSunrise:jpl,
   mismatch:src!==jpl,nearestPhysicalJplSixDegreeBoundarySeconds:delta,
   within120SecondsOfJplSixDegreeRoot:delta<=120,
   sunriseOriginalGcalUtc:new Date(at).toISOString()};
  const arut=clock(day.date,source.arunodayaXml,"arunodaya");
  const aruGcal=arunodayaName(source.arunodayaXml),aruJpl=independentAt(arut);
  dte.originalArunodayaNamedTithiMod15=aruGcal;
  dte.pinnedJplTithiMod15AtOriginalArunodaya=aruJpl%15;
  dte.originalArunodayaTithiDisagreement=aruGcal!==null&&aruGcal!==aruJpl%15;
  dte.arunodayaNearestPhysicalJplSixDegreeRootSeconds=nearest(arut)/1000;
  details.push(dte);
 }
 const current=details.find(x=>x.date===c.date);
 check(!!current,"Missing GCal original source at target "+key(c.city,c.date));
 const next=new Date(Date.parse(c.date+"T00:00:00Z")+86400000).toISOString().slice(0,10);
 const prior=new Date(Date.parse(c.date+"T00:00:00Z")-86400000).toISOString().slice(0,10);
 const following=details.find(x=>x.date===next),previous=details.find(x=>x.date===prior);
 const futureMoon=details.filter(x=>x.date>c.date&&
  (x.originalGcalTithiAtOriginalSunrise%15===14||
   x.pinnedJplTithiAtSameOriginalSunrise%15===14));
 const futureDiff=futureMoon.filter(x=>x.mismatch);
 const hasAny=details.some(x=>x.mismatch||x.originalArunodayaTithiDisagreement);
 const close=details.some(x=>(x.mismatch&&x.within120SecondsOfJplSixDegreeRoot)||
  (x.originalArunodayaTithiDisagreement&&x.arunodayaNearestPhysicalJplSixDegreeRootSeconds<=120));
 const grouping=c.sourceSubtype?.includes("Paksa")?"PAKSHA_VARDHINI":
  c.sourceSubtype?.includes("Trisprsa")?"TRISPRSHA":
  c.sourceSubtype?.includes("Vyanjuli")?"VYANJULI":
  c.unmilani20270304?"UNMILANI":
  c.vijaya20270912?"VIJAYA":"DATE_ONLY";
 const record={city:c.city,year:c.year,date:c.date,grouping,
  sourceSubtype:c.sourceSubtype,
  originalFastingDateMismatch:c.dateMismatch,originalSubtypeMismatch:c.subtypeMismatch,
  currentSunriseTithiGcalJplDiff:current.mismatch,
  followingSunriseTithiGcalJplDiff:following?.mismatch??null,
  previousArunodayaTithiGcalJplDiff:previous?.originalArunodayaTithiDisagreement??null,
  futureMoonSunriseMismatchObserved:futureDiff.length>0,
  allDirectSameClockDawnDifferences:details,
  observablyNearPhysicalJplRoot:close,
  originalGcalAndJplTithiAgreeAtAllObservedDawns:!hasAny,
  sourceRuleCorrectnessNotEstablished:true,certified:false};
 cases.push(record);family[grouping].push(record);
 allSignals.fullMoonFutureModelDisagree+=Number(futureDiff.length>0);
 allSignals.followingSunriseModelDisagree+=Number(following?.mismatch===true);
 allSignals.targetSunriseModelDisagree+=Number(current.mismatch);
 allSignals.previousArunodayaModelDisagree+=Number(previous?.originalArunodayaTithiDisagreement===true);
 allSignals.targetNoPhysicalTithiDifferenceWithinObservedWindow+=Number(!hasAny);
 allSignals.casesWithAnyModelDiffWithinTwoMinutesOfJplPhysicalRoot+=Number(close);
}
check(cases.length===117&&family.PAKSHA_VARDHINI.length===27&&family.TRISPRSHA.length===22&&
 family.VYANJULI.length===10&&family.UNMILANI.length===11&&family.VIJAYA.length===3&&
 family.DATE_ONLY.length===44,"Physical evidence source 117-case classification changed");
const summary=Object.fromEntries(Object.entries(family).map(([name,data])=>[name,{
 events:data.length,nearPhysicalJplRoot:data.filter(x=>x.observablyNearPhysicalJplRoot).length,
 currentSunriseSourceTithiDisagree:data.filter(x=>x.currentSunriseTithiGcalJplDiff).length,
 nextSunriseSourceTithiDisagree:data.filter(x=>x.followingSunriseTithiGcalJplDiff).length,
 previousArunodayaSourceTithiDisagree:data.filter(x=>x.previousArunodayaTithiGcalJplDiff).length,
 futureFullMoonSourceTithiDisagree:data.filter(x=>x.futureMoonSunriseMismatchObserved).length,
 noObservedTithiMismatch:data.filter(x=>x.originalGcalAndJplTithiAgreeAtAllObservedDawns).length}]));
const report={status:"117_GCAL_SOURCE_SUNRISE_ARUNODAYA_JPL_ROOT_CAUSE_EVIDENCE_ONLY",
 sourceGcalOriginalExeBlob:g.originalExeGitBlob,independentJplKernelSha256:t.kernelSha256,
 method:"Original 1360 source GCal XML day rows: UTC conversion of precise original sunrise and Arunodaya; independently queried pinned JPL physical Sun-Moon Tithi at these exact instants, plus source-logged future Moon sunrise checks, not an oracle-driven date selector.",
 coverage:{cityYearsInherited:908,citiesInherited:454,caseRows:cases.length,
  originalDateMismatches:84,originalSubtypeMismatches:73},
 classification:summary,allIndependentObservations:cases,
 signals:allSignals,
 originalGcalDoesNotExposeExactTransitionRoots:true,
 religionTraditionRulesAreNotYetIndependentlyCertified:true,
 independentlyCertified:false,publicRitualApproval:false,
 permissionToPublish:false};
mkdirSync(dirname(q.output),{recursive:true});writeFileSync(q.output,JSON.stringify(report,null,2)+"\n");
console.log("[GCal original sunrise/Arunodaya vs JPL across 117 residual cases]",JSON.stringify({
 coverage:report.coverage,summary:report.classification,signals:report.signals}));
