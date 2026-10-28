/**
 * 454-city GCal residual research: independently reconcile the exact JPL
 * DE440s Tithi phase at original GCal and Swiss sunrise/Arunodaya instants.
 * Never copy an original GCal verdict into a classifier. No public changes.
 */
import {readFileSync,writeFileSync,readdirSync,mkdirSync} from "node:fs";
import {dirname,join} from "node:path";
import {createDefaultSweData} from "@typescriptify/sweph/dist/types.js";
import {sweCalcUt,sweClose} from "@typescriptify/sweph/dist/sweph.js";
import {SE_SUN,SE_MOON,SEFLG_MOSEPH} from "@typescriptify/sweph/dist/constants.js";
import {getPinnedV6HalfTithiTable,JPL_V6_ROOTS_ASSET_SHA256} from "../lib/jpl-v6-pinned-data";
import {bisectSwissRoot} from "../lib/v6-root-clock-reconciliation";
import {ORIGINAL_GCAL_SHA,ORIGINAL_JPL_KERNEL_SHA,
 originalGcalISTSunriseUtcMs,originalGcalTithiAtSunrise,
 jplTithiClockAt,jplTithiEdges,nearestJplTithiEdge,concordance,NO_PUBLISH
} from "../lib/gcal-jpl-tithi-root-triage";
const want=(yes:boolean,msg:string)=>{if(!yes)throw Error("JPL/GCal/Swiss research evidence: "+msg)};
const files=(dir:string)=>readdirSync(dir).filter(x=>/^shard-\d{2}\.json$/.test(x)).sort();
const key=(city:string,year:number,date:string)=>city+"/"+year+"/"+date;
const input=process.argv.find(x=>x.startsWith("--original="))?.slice(11);
const shardsDir=process.argv.find(x=>x.startsWith("--shards="))?.slice(9);
const output=process.argv.find(x=>x.startsWith("--output="))?.slice(9)??"artifacts/gcal-jpl-original-tithi-triage.json";
want(!!input&&!!shardsDir,"--original=SOURCE_TRACE --shards=16_JSON_DIR required");
const source=JSON.parse(readFileSync(input!,"utf8"));
want(source.status==="RAW_GCAL_DAWN_TRACE_COMPLETE_RESEARCH_ONLY"&&
 source.originalExeGitBlob===ORIGINAL_GCAL_SHA&&source.independentlyCertified===false&&
 source.publicRitualApproval===false&&source.matchedComparisonCases===172&&
 source.uniqueCityYears===100&&source.observedDayXmlRows===1360,"incorrect original 454-city GCal trace");
const paths=files(shardsDir!);
want(paths.length===16,"expected exactly 16 research shards");
const cityYears=new Set<string>(),shardIds=new Set<number>(),days=new Map<string,any>(),cases=new Map<string,any>();
for(const file of paths){
 const x=JSON.parse(readFileSync(join(shardsDir!,file),"utf8"));
 want(x.status==="FULL_SHARD_RESEARCH_COMPARISON_ONLY"&&
  x.independentlyCertified===false&&x.publicRitualApproval===false&&
  !x.failures?.length&&x.shards===16&&!shardIds.has(x.shard),"bad or duplicate research shard "+file);
 shardIds.add(x.shard);
 for(const cy of x.results){
  const cyKey=cy.city+"/"+cy.year;
  want(!cityYears.has(cyKey),"duplicate city-year "+cyKey);
  cityYears.add(cyKey);
  for(const row of cy.rows){
   const k=key(cy.city,cy.year,row.date);
   want(!cases.has(k),"duplicate event "+k);
   cases.set(k,row);
   for(const dawn of row.researchDawnSequence??[]){
    const dkey=key(cy.city,cy.year,dawn.date),prior=days.get(dkey);
    want(Number.isFinite(dawn.independentSunriseUtcMs)&&Number.isFinite(dawn.independentArunodayaUtcMs),
     "missing exact independent UTC dawn "+dkey);
    if(prior){
     want(Math.abs(prior.independentSunriseUtcMs-dawn.independentSunriseUtcMs)<20&&
      prior.sunriseIndex===dawn.sunriseIndex,"conflicting independent dawn sample "+dkey);
    }else days.set(dkey,dawn);
   }
  }
 }
}
want(shardIds.size===16&&cityYears.size===908,"16-shard/908-city-year registry incomplete");
const originalKeys=new Set<string>();
for(const r of source.matchedCases){
 const k=key(r.city,r.year,r.date);
 want(!originalKeys.has(k)&&cases.has(k)&&days.has(k),"missing or duplicate source discrepancy "+k);
 originalKeys.add(k);
}
want(originalKeys.size===172,"original disputed event coverage incomplete");
const table=getPinnedV6HalfTithiTable();
want(JPL_V6_ROOTS_ASSET_SHA256==="0cab0c6accaf2e2125fe417bf4a4f14a22453a4013a1609dce6dce84ec44142e"&&
 table.kernelSha256===ORIGINAL_JPL_KERNEL_SHA&&table.halfTithiBoundaryCount===4512,
 "DE440s root/kernel identity differs from checked-in physical JPL source");
const edges=jplTithiEdges(table);
const st=createDefaultSweData(),rootCache=new Map<number,{jplUtcMs:number;swissUtcMs:number;offsetSeconds:number;index:number}>();
const JD0=2440587.5,DAY_MS=86400000;
const norm=(deg:number)=>((deg%360)+360)%360;
const swissIndex=(ms:number)=>{
 const jd=JD0+ms/DAY_MS;
 const sun=sweCalcUt(st,jd,SE_SUN,SEFLG_MOSEPH).xx[0];
 const moon=sweCalcUt(st,jd,SE_MOON,SEFLG_MOSEPH).xx[0];
 want(Number.isFinite(sun)&&Number.isFinite(moon),"nonfinite Swiss/Moshier Sun or Moon");
 return Math.floor(norm(moon-sun)/12);
};
const angleAt=(ms:number)=>{
 const jd=JD0+ms/DAY_MS;
 const moon=sweCalcUt(st,jd,SE_MOON,SEFLG_MOSEPH).xx[0];
 const sun=sweCalcUt(st,jd,SE_SUN,SEFLG_MOSEPH).xx[0];
 return norm(moon-sun);
};
const caseRows=[],rawRows=[],dateGroups=new Map<string,any>(),countByState:Record<string,number>={},eventsWithoutObservation=[];
let clocks=0,gcalJpl=0,swissJpl=0,gcalSwiss=0,rootSolvedCount=0;
let closeJplRootCount=0;
try{
 for(const orig of source.dailySourceEvidence){
  const k=key(orig.city,orig.year,orig.date),sw=days.get(k);
  if(!sw){eventsWithoutObservation.push(k);continue;}
  const gcalUtcMs=originalGcalISTSunriseUtcMs(orig.date,orig.sunriseXml);
  const swUtcMs=sw.independentSunriseUtcMs;
  const gcalState=originalGcalTithiAtSunrise(orig.sunriseXml);
  const swStateOriginalClock=swissIndex(gcalUtcMs);
  const jplStateOriginalClock=jplTithiClockAt(table,gcalUtcMs);
  const swStateSwissClock=swissIndex(swUtcMs);
  const jplStateSwissClock=jplTithiClockAt(table,swUtcMs);
  want(swStateSwissClock===sw.sunriseIndex,"Swiss day trace drifted "+k);
  const sourceAgreement=concordance(gcalState,swStateOriginalClock,jplStateOriginalClock);
  countByState[sourceAgreement]=(countByState[sourceAgreement]??0)+1;
  if(gcalState===jplStateOriginalClock)gcalJpl++;
  if(swStateOriginalClock===jplStateOriginalClock)swissJpl++;
  if(gcalState===swStateOriginalClock)gcalSwiss++;
  const nearGcal=nearestJplTithiEdge(edges,gcalUtcMs);
  const nearSwiss=nearestJplTithiEdge(edges,swUtcMs);
  // To isolate solar vs lunar effects, compare at both independent Swiss
  // and original GCal clocks. Do not infer anything from 6° Karana edges.
  const preferred=Math.abs(nearGcal.secondsFromEdge)<=Math.abs(nearSwiss.secondsFromEdge)?nearGcal:nearSwiss;
  let exactRoot=null;
  if(Math.abs(preferred.secondsFromEdge)<=30*60){
   closeJplRootCount++;
   if(!rootCache.has(preferred.utcMs)){
    const result=bisectSwissRoot(preferred.index*12,preferred.utcMs,angleAt,30*60_000);
    rootCache.set(preferred.utcMs,{jplUtcMs:preferred.utcMs,swissUtcMs:result.swissRootUtcMs,
     offsetSeconds:result.deltaSeconds,index:preferred.index});
    rootSolvedCount++;
   }
   exactRoot=rootCache.get(preferred.utcMs)!;
  }
  const sameClockRiseDeltaSeconds=+(swUtcMs-gcalUtcMs).toFixed(1)/1000;
  const row={city:orig.city,year:orig.year,date:orig.date,
   sourceGcalTithiIndex:gcalState,swissAtOriginalGcalSunriseIndex:swStateOriginalClock,
   jplAtOriginalGcalSunriseIndex:jplStateOriginalClock,
   swissAtSwissSunriseIndex:swStateSwissClock,jplAtSwissSunriseIndex:jplStateSwissClock,
   originalGcalSunriseUtc:new Date(gcalUtcMs).toISOString(),
   swissSunriseUtc:new Date(swUtcMs).toISOString(),sunriseSwissMinusGcalSeconds:sameClockRiseDeltaSeconds,
   sunriseThreeWayAgreement:sourceAgreement,
   sourceGcalEqualsJplAtOriginalSunrise:gcalState===jplStateOriginalClock,
   sourceGcalEqualsSwissAtOriginalSunrise:gcalState===swStateOriginalClock,
   jplEqualsSwissAtOriginalSunrise:jplStateOriginalClock===swStateOriginalClock,
   sunriseStateSwapsWhenUsingOriginalVsSwissClock:jplStateOriginalClock!==jplStateSwissClock,
   nearestRealJplTithiBoundaryUtc:new Date(nearGcal.utcMs).toISOString(),
   nearestJplBoundarySignedSecondsFromGcalSunrise:+nearGcal.secondsFromEdge.toFixed(3),
   nearestJplBoundarySignedSecondsFromSwissSunrise:+nearSwiss.secondsFromEdge.toFixed(3),
   swissVsJplExactTithiRoot:exactRoot?{
    jplUtc:new Date(exactRoot.jplUtcMs).toISOString(),
    swissUtc:new Date(exactRoot.swissUtcMs).toISOString(),
    swissMinusJplSeconds:+exactRoot.offsetSeconds.toFixed(3),
    targetTithiIndex:exactRoot.index}:null,
   previousSwissNearSunriseBoundarySeconds:sw.closestSunriseBoundarySeconds??null,
   sourceGcalOriginalSunriseXml:orig.sunriseXml,
   sourceGcalOriginalArunodayaXml:orig.arunodayaXml};
  rawRows.push(row);clocks++;
  if(originalKeys.has(k)){
   const ev=cases.get(k);
   caseRows.push({...row,fastDateMismatch:ev.mismatch===true,
    sourceSubtype:ev.sourceSubtype??null,independentSubtype:ev.subtype??null,
    subtypeDisagreement:(!!ev.sourceSubtype&&ev.subtypeMatch!==true)||!!ev.subtype&&!ev.sourceSubtype,
    independentRuleReason:ev.independentResearchReason??null,
    needsAstronomicalOrTraditionReview:true});
  }
  const groupKey=orig.date;
  const g=dateGroups.get(groupKey)??{date:orig.date,compared:0,gcalVsJpl:0,swissVsJpl:0,
   tripleDisagreements:0,sourceDifferentFromBoth:0,examples:[]};
  g.compared++;
  if(gcalState!==jplStateOriginalClock)g.gcalVsJpl++;
  if(swStateOriginalClock!==jplStateOriginalClock)g.swissVsJpl++;
  if(sourceAgreement!=="ALL_AGREE")g.tripleDisagreements++;
  if(sourceAgreement==="SWISS_AND_JPL_AGREE_GCAL_DIFFERS")g.sourceDifferentFromBoth++;
  if(g.examples.length<3&&sourceAgreement!=="ALL_AGREE")g.examples.push(orig.city);
  dateGroups.set(groupKey,g);
 }
}finally{sweClose(st);}
want(clocks>=1100&&clocks<=1360&&caseRows.length===172,"incomplete same-instant JPL triage");
want(rootSolvedCount>0&&closeJplRootCount>0,"no physical JPL Tithi root comparisons performed");
const median=(nums:number[])=>nums.length?nums[Math.floor(nums.length/2)]:null;
const deltas=[...rootCache.values()].map(x=>Math.abs(x.offsetSeconds)).sort((a,b)=>a-b);
const byAgreement=Object.fromEntries(Object.entries(countByState).sort());
const report={status:"GCAL_JPL_DE440S_SWISS_TITHI_RESEARCH_DIAGNOSED",
 originalGcalExecutableGitBlob:ORIGINAL_GCAL_SHA,
 jpl:{kernel:"DE440s",kernelSha256:table.kernelSha256,rootSourceSha256:JPL_V6_ROOTS_ASSET_SHA256,
  coverage:[table.coverageStartUtc,table.coverageEndUtc],transitionCount:table.halfTithiBoundaryCount,
  fullTithiRootCount:edges.length,angleFrame:"geocentric apparent ecliptic of date Moon minus Sun",
  timestamps:"UTC milliseconds; existing pinned JPL Skyfield table, no new interpolation"},
 method:"Original GCal tithi and sunrise XML; JPL DE440s phase at exactly GCal original IST sunrise UTC and Swiss sunrise UTC; Swiss/Moshier sweCalcUt same UTC clocks; exact 12° JPL/Swiss event root bisection within 30m",
 coverage:{sourceAffectedCityYears:100,originalDistinctDisputedEventDates:172,
  independentResearchCityYears:cityYears.size,sourceDays:source.dailySourceEvidence.length,
  sameInstantRows:clocks,caseRows:caseRows.length,
  originalSourceDaysWithoutIndependentTrace:eventsWithoutObservation.length,
  tithiRootsSolvedExact:rootSolvedCount,observationsWithin30mOfJplTithiRoot:closeJplRootCount},
 concordance:{counts:byAgreement,gcalEqualsJplAtGcalSunrise:gcalJpl,
  swissEqualsJplAtGcalSunrise:swissJpl,gcalEqualsSwissAtGcalSunrise:gcalSwiss,
  nonConsensus:clocks-(byAgreement.ALL_AGREE??0)},
 tithiRootOffsets:{count:deltas.length,medianAbsSeconds:median(deltas),
  p95AbsSeconds:deltas[Math.floor(deltas.length*.95)]??null,
  maxAbsSeconds:deltas.at(-1)??null,
  exactRootComparisons:[...rootCache.values()].sort((a,b)=>a.jplUtcMs-b.jplUtcMs)},
 rootCauseLimitations:{originalGcalDoesNotExposeExactTransitionRootTimes:true,
  JplConcordanceDoesNotProveReligiousTraditionRules:true,
  originalGcalAndSwissObserverSunriseAreDistinct:true,
  referenceModelErrorNotAssumed:true,allDisputedDatesCertified:false},
 ...NO_PUBLISH,
 disputedEventRows:caseRows,
 everyMatchedRawGcalDawnRow:rawRows,
 dateClusters:[...dateGroups.values()].sort((a,b)=>b.tripleDisagreements-a.tripleDisagreements||a.date.localeCompare(b.date)),
 evidenceGaps:eventsWithoutObservation};
mkdirSync(dirname(output),{recursive:true});
writeFileSync(output,JSON.stringify(report,null,2)+"\n");
console.log("[JPL/GCal Tithi root triage]",JSON.stringify({coverage:report.coverage,
 concordance:report.concordance,rootOffsets:report.tithiRootOffsets,
 productionCertified:false}));
