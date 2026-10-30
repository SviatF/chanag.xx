/**
 * Fail-closed aggregate of 16 JPL physical residual/parana shards.
 * Exact 454 × 2 provenance, each case unique; never approve ritual output.
 */
import {readdirSync,readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {join,dirname} from "node:path";
const ok=(v,m)=>{if(!v)throw Error("JPL 454 science aggregation: "+m)};
const [root,out]=process.argv.slice(2);
ok(root&&out,"usage: node aggregate-jpl-residual-parana.mjs SHARDS OUT");
const fs=readdirSync(root).filter(f=>/^residual-\d{2}\.json$/.test(f)).sort();
ok(fs.length===16,"Expected all 16 JPL physical residual/parana shards");
const shards=new Set();
let years=0,priorDate=0,priorSubtype=0;
const cases=[],parana=[],counter={},byDay=new Map(),risk={UNMILANI:[],VIJAYA:[]};
const seenCases=new Set(),seenParana=new Set();
for(const path of fs){
 const o=JSON.parse(readFileSync(join(root,path),"utf8"));
 ok(o.status==="JPL_REMAINING_GAPS_AND_PARANA_RESEARCH_ONLY"&&
  o.publicRitualApproval===false&&o.independentlyCertified===false&&
  o.jplParanaCertified===false&&o.sourceGcalOracleNotUsedForAstronomy===true&&
  o.sourceJplRootSHA256==="0cab0c6accaf2e2125fe417bf4a4f14a22453a4013a1609dce6dce84ec44142e"&&
  o.shards===16&&!shards.has(o.shard)&&o.completedCityYears>0,
  "Bad scientific shard "+path);
 shards.add(o.shard);years+=o.completedCityYears;
 for(const [k,v] of Object.entries(o.totals)){
  ok(Number.isSafeInteger(v)&&v>=0,"Invalid numerical counter "+k);
  counter[k]=(counter[k]??0)+v;
 }
 for(const c of o.residuals){
  const k=c.city+"/"+c.year+"/"+c.date;
  ok(!seenCases.has(k),"Duplicate residual event "+k);seenCases.add(k);
  if(c.dateMismatch)priorDate++;if(c.subtypeMismatch)priorSubtype++;
  ok(c.researchOnly===true&&Array.isArray(c.exactJplTithiWindow)&&
   c.exactJplTithiWindow.length===10,"No strict physical JPL case window "+k);
  cases.push(c);
  const group=byDay.get(c.date)??{date:c.date,fastDateDisagreements:0,subtypeDisagreements:0,cities:[]};
  group.fastDateDisagreements+=Number(c.dateMismatch);group.subtypeDisagreements+=Number(c.subtypeMismatch);
  group.cities.push(c.city);byDay.set(c.date,group);
  if(c.unmilani20270304){ok(c.unmilaniCheck?.independentlyObservedRepeatedCleanEkadashi===true,"Bad independent Unmilani inputs");risk.UNMILANI.push(c);}
  if(c.vijaya20270912){ok(c.vijayaCheck?.sameSwissNakshatraOnTwoSunrises===true,"Bad independent Vijaya Nakshatra inputs");risk.VIJAYA.push(c);}
 }
 for(const p of o.pairedNumericParana){
  const k=p.city+"/"+p.date;
  ok(!seenParana.has(k),"Duplicate numeric Parana reference "+k);seenParana.add(k);
  ok(p.sourceIsComparisonOnly===true&&p.certified===false,"Numeric Parana falsely approved");
  parana.push(p);
 }
}
ok(shards.size===16&&years===908,"Incomplete original 908 city-years");
ok(counter.sourceDateMismatches===84&&priorDate===84&&
 counter.sourceSubtypeDisagreements===73&&priorSubtype===73,
 "Incorrect pinned 84 date / 73 subtype JPL baseline");
ok(risk.UNMILANI.length===11&&risk.VIJAYA.length===3,
 "Missing remaining 11 independent Unmilani or 3 independent Vijaya source-disagreement cases");
ok(counter.sourceParana===22246&&counter.sourceAfterOnly===19,
 "Original source fast Parana evidence was lost or transformed");
ok(counter.startPairs===parana.filter(x=>x.fromAbsResidualMinutes!==null).length&&
 counter.endPairs===parana.filter(x=>x.toAbsResidualMinutes!==null).length&&
 counter.afterOnlyPairs===parana.filter(x=>x.afterOnlyAbsResidualMinutes!==null).length,
 "Numerical JPL Parana pairs don't match the source provenance ledger");
const start=parana.filter(x=>x.fromAbsResidualMinutes!==null).map(x=>x.fromAbsResidualMinutes);
const end=parana.filter(x=>x.toAbsResidualMinutes!==null).map(x=>x.toAbsResidualMinutes);
const after=parana.filter(x=>x.afterOnlyAbsResidualMinutes!==null).map(x=>x.afterOnlyAbsResidualMinutes);
const stats=x=>{
 const z=[...x].sort((a,b)=>a-b);
 return {pairs:z.length,medianAbsMinutes:z[Math.floor(z.length/2)]??null,
  p95AbsMinutes:z[Math.floor(.95*Math.max(0,z.length-1))]??null,
  maxAbsMinutes:z.at(-1)??null,overFiveMinutes:z.filter(n=>n>5).length};
};
const rowClusters=[...byDay.values()].sort((a,b)=>a.date.localeCompare(b.date));
const report={status:"JPL_TITHI_RESIDUAL_AND_PARANA_FULL_454_RESEARCH_COMPLETE",
 coverage:{cities:454,cityYears:years,shards:16,sourceFastingEvents:counter.sourceParana,
  remainingDateDisagreements:priorDate,remainingSubtypeDisagreements:priorSubtype,
  uniqueDisputedEventKeys:cases.length,
  residualDayClusters:rowClusters.length,originalAfterOnlyGcalEvents:counter.sourceAfterOnly},
 numericalParana:{counters:counter,
  sourceStart:stats(start),sourceEnd:stats(end),sourceAfterOnly:stats(after),
  sourceMethodAndJplDateDisagreementNotComparable:counter.sourceSubtypeIncomparable+counter.jplFastDisagreement,
  previouslySwissCorrectNowOverFiveMinutes:counter.previouslyCorrectParanaWorseThanFive,
  originalGcalAfterOnlyUpperBoundsNeverInvented:true,
  certificationNotInferredFromFewerThanFiveMinuteResiduals:true},
 remainingCasesByDate:rowClusters,
 nakshatraTraditionReview:{
  unmilani20270304:risk.UNMILANI.map(x=>({city:x.city,date:x.date,independentInputs:x.unmilaniCheck,
   physicalWindow:x.exactJplTithiWindow.slice(0,3),
   sourceSubtype:x.sourceSubtype,certified:false})),
  vijaya20270912:risk.VIJAYA.map(x=>({city:x.city,date:x.date,independentInputs:x.vijayaCheck,
   physicalWindow:x.exactJplTithiWindow.slice(0,3),sourceSubtype:x.sourceSubtype,certified:false})),
  unresolvedIndependentAyanamsaAndTraditionRules:true},
 highestParanaResiduals:parana.filter(x=>(x.fromAbsResidualMinutes??0)>5||(x.toAbsResidualMinutes??0)>5||
  (x.afterOnlyAbsResidualMinutes??0)>5).slice(0,200),
 allCasePhysicalDawnEvidence:cases.sort((a,b)=>a.date.localeCompare(b.date)||a.city.localeCompare(b.city)),
 independentlyCertified:false,publicRitualApproval:false,jplParanaCertified:false,
 calendarSEOOrMuhuratChangeAuthorized:false,
 warning:"Original GCal 11 is a comparison oracle; none of these analyses verifies independent ISKCON ritual rule authority or a fully independent Lahiri ayanamsa."};
mkdirSync(dirname(out),{recursive:true});writeFileSync(out,JSON.stringify(report,null,2)+"\n");
console.log("[JPL physical 454-city residual/Parana]",JSON.stringify({
 coverage:report.coverage,numericParana:report.numericalParana.counters,
 start:report.numericalParana.sourceStart,end:report.numericalParana.sourceEnd,
 afterOnly:report.numericalParana.sourceAfterOnly}));
