/**
 * Fail-closed, non-publishing adjudication ledger for the original GCal 454-city
 * research artifacts. A mismatch is never "fixed" by marking it uncertain.
 * Only the original GCal source supplies reference labels/times; the independent
 * classifier runs upstream and is not influenced by this ledger.
 */
import {readdirSync,readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {join,dirname} from "node:path";
const assert=(ok,message)=>{if(!ok)throw Error("GCal adjudication: "+message)};
const count=(obj,k)=>{obj[k]=(obj[k]??0)+1};
const dateRows=(shardsDir)=>{
 const files=readdirSync(shardsDir).filter(n=>/^shard-\d{2}\.json$/.test(n)).sort();
 assert(files.length===16,"expected 16 shard JSON files");
 const seenShards=new Set(),seenYears=new Set(),seenCities=new Map(),rows=[];
 for(const file of files){
  const shard=JSON.parse(readFileSync(join(shardsDir,file),"utf8"));
  assert(shard.status==="FULL_SHARD_RESEARCH_COMPARISON_ONLY"&&
   shard.independentlyCertified===false&&shard.publicRitualApproval===false&&
   shard.failures?.length===0,"incomplete or certified shard "+file);
  assert(Number.isInteger(shard.shard)&&!seenShards.has(shard.shard)&&
   shard.shard>=0&&shard.shard<16&&shard.shards===16,"bad shard index "+file);
  seenShards.add(shard.shard);
  for(const item of shard.results){
   const key=item.city+"/"+item.year;
   assert([2026,2027].includes(item.year)&&!seenYears.has(key),"duplicate or bad city-year "+key);
   seenYears.add(key);seenCities.set(item.city,(seenCities.get(item.city)??0)+1);
   const dates=new Set();
   for(const r of item.rows){
    assert(!dates.has(r.date),"duplicate date "+key+" "+r.date);
    dates.add(r.date);
    assert(r.certified===false,"unapproved public date "+key+"/"+r.date);
    rows.push({city:item.city,year:item.year,...r});
   }
  }
 }
 assert(seenShards.size===16&&seenYears.size===908&&seenCities.size===454,
  "missing original 454-city × 2-year evidence");
 for(const [city,n] of seenCities)assert(n===2&&seenYears.has(city+"/2026")&&seenYears.has(city+"/2027"),"missing city year "+city);
 return rows;
};
const tallyKey=(row)=>row.city+"/"+row.year+"/"+row.date;
export function adjudicate(rows,summary){
 const mismatches=[],sourceOnly=[],independentOnly=[],unpaired=[],unexplained=[];
 const reasons={},dateClusters={},boundaryEvidence={};
 const add=(arr,r,category,extra={})=>{
  const d=r.researchDawnSequence??[];
  const nearby=Array.isArray(d)?d.filter(x=>x.nearBoundary===true||x.nearNakshatraBoundary===true)
   .map(x=>({
    date:x.date,sunriseTithiIndex:x.sunriseIndex,arunodayaTithiIndex:x.arunodayaIndex,
    nearBoundary:!!x.nearBoundary,nearNakshatraBoundary:!!x.nearNakshatraBoundary,
    sunriseTithiMinusFive:x.tithiSunriseSensitivity?.minusFive??null,
    sunriseTithiPlusFive:x.tithiSunriseSensitivity?.plusFive??null,
    arunodayaTithiMinusFive:x.tithiArunodayaSensitivity?.minusFive??null,
    arunodayaTithiPlusFive:x.tithiArunodayaSensitivity?.plusFive??null,
    closestSunriseBoundarySeconds:x.closestSunriseBoundarySeconds??null,
    closestArunodayaBoundarySeconds:x.closestArunodayaBoundarySeconds??null
   })):[];
  const record={city:r.city,year:r.year,date:r.date,category,
   gcalFast:r.gcalEkadashiFast,independentFast:r.independentFastCandidate??null,
   gcalSubtype:r.sourceSubtype??null,independentSubtype:r.subtype??null,
   independentReason:r.independentResearchReason??null,
   independentAmbiguities:r.independentResearchAmbiguities??[],
   boundaryEvidenceOnly:nearby,
   sensitivityWithinFiveMinutes:nearby.some(x=>x.sunriseTithiMinusFive!==null&&
    x.sunriseTithiPlusFive!==null&&x.sunriseTithiMinusFive!==x.sunriseTithiPlusFive||
    x.arunodayaTithiMinusFive!==null&&x.arunodayaTithiPlusFive!==null&&
    x.arunodayaTithiMinusFive!==x.arunodayaTithiPlusFive),
   ...extra};
  arr.push(record);count(reasons,category);count(dateClusters,r.date);
  if(nearby.length)count(boundaryEvidence,category);
 };
 for(const row of rows){
  const expectedMismatch=row.gcalEkadashiFast!==(row.independentFastCandidate===row.date);
  assert(row.mismatch===expectedMismatch,"wrong fast mismatch flag "+tallyKey(row));
  if(row.mismatch)add(mismatches,row,row.gcalEkadashiFast?"GCAL_FAST_MISSED":"INDEPENDENT_FAST_EXTRA");
  if(row.sourceSubtype&&row.subtypeMatch!==true)
   add(sourceOnly,row,"GCAL_SUBTYPE_NOT_REPRODUCED");
  if(row.subtype&&!row.sourceSubtype)
   add(independentOnly,row,"INDEPENDENT_SUBTYPE_NOT_IN_GCAL");
  const p=row.gcalParana;
  if(p&&(row.startResidualMinutes===null||row.endResidualMinutes===null)){
   let category;
   if(!p.from&&!p.to&&/^\d{2}:\d{2}$/.test(p.after??""))
    category="GCAL_VERIFIED_ONE_SIDED_AFTER";
   else if(!/^\d{2}:\d{2}$/.test(p.from??"")||!/^\d{2}:\d{2}$/.test(p.to??""))
    category="GCAL_REFERENCE_CLOCK_MISSING";
   else if((row.sourceSubtype&&row.subtypeMatch!==true)||(row.subtype&&!row.sourceSubtype))
    category="SUBTYPE_DISAGREEMENT_BLOCKS_PARANA_COMPARISON";
   else category="UNEXPLAINED_NUMERIC_PARANA_GAP";
   add(unpaired,row,category,{gcalClock:{from:p.from??null,to:p.to??null,after:p.after??null},
    independentlyVerifiedAfterResidualMinutes:row.oneSidedAfterResidualMinutes??null,
    independentlyComputedStatus:row.calculatedParana?.status??null});
   if(category==="UNEXPLAINED_NUMERIC_PARANA_GAP")unexplained.push(tallyKey(row));
  }
 }
 const t=summary.totals;
 const b=summary.mahadvadashi,p=summary.parana;
 assert(summary.status==="RESEARCH_COMPLETE_WITH_OPEN_GAPS"&&
  summary.independentlyCertified===false&&summary.publicRitualApproval===false&&
  summary.coverage?.cities===454&&summary.coverage?.cityYears===908,
  "summary missing or tries to certify research");
 assert(mismatches.length===t.candidateMismatches,"candidate mismatch not reconciled");
 assert(sourceOnly.length===t.subtypeMismatches,"source-only subtype mismatch not reconciled");
 assert(independentOnly.length===t.independentOnlySubtypeCandidates,
  "independent-only subtype mismatch not reconciled");
 assert(unpaired.length===p.missingNumericBounds,"unpaired Parana count not reconciled");
 assert(independentOnly.length+sourceOnly.length===b.totalBidirectionalDisagreements,
  "bidirectional subtype mismatch not reconciled");
 const unavailable=unpaired.filter(x=>x.category==="GCAL_REFERENCE_CLOCK_MISSING").length;
 const afterOnly=unpaired.filter(x=>x.category==="GCAL_VERIFIED_ONE_SIDED_AFTER").length;
 assert(unavailable===0,"A missing GCal Parana clock has not been checked against original XML");
 assert(afterOnly===19&&afterOnly===p.originalGcalAfterOnlyEvents&&
  afterOnly===p.verifiedAfterOnlyLowerBounds,"original GCal open-ended after-only clock evidence not reconciled");
 assert(unpaired.filter(x=>x.category==="GCAL_VERIFIED_ONE_SIDED_AFTER").every(x=>
  x.independentlyVerifiedAfterResidualMinutes!==null&&
  x.independentlyVerifiedAfterResidualMinutes<=5),
  "GCal after-only lower bound does not independently match within five minutes");
 assert(unexplained.length===0,
  "unexplained Parana gaps "+unexplained.slice(0,8).join(", "));
 const sort=(a,b)=>a.date.localeCompare(b.date)||a.city.localeCompare(b.city);
 const ledger={
  status:"RESEARCH_GAPS_FULLY_ACCOUNTED_FOR_NOT_CERTIFIED",
  independentCertification:false,publicRitualApproval:false,
  coverage:{cities:454,cityYears:908,shards:16},
  totals:{fastDateDisagreements:mismatches.length,sourceOnlySubtypeDisagreements:sourceOnly.length,
   independentOnlySubtypeDisagreements:independentOnly.length,
   bidirectionalSubtypeDisagreements:sourceOnly.length+independentOnly.length,
   paranaNotNumericallyComparable:unpaired.length,
   sourceClockTrulyMissing:unavailable,
   originalGcalAfterOnlyParana:afterOnly,
   afterOnlyLowerBoundsVerified:afterOnly,
   subtypeDisagreementBlocksParana:unpaired.length-afterOnly-unavailable},
  reasons,dateClusters,boundaryEvidence,
  fastDateCases:mismatches.sort(sort),sourceOnlySubtypeCases:sourceOnly.sort(sort),
  independentOnlySubtypeCases:independentOnly.sort(sort),paranaCases:unpaired.sort(sort),
  nextSteps:[
   "Compare independent solar rise, Arunodaya and exact tithi boundary with original GCal astronomical conventions",
   "Independently review Nakshatra and Paksha-Vardhini classifications, not by hard-coded source dates",
   "Recover genuine original GCal clock provenance for blank Parana values; never interpolate missing reference",
   "Keep all unresolved case-specific festival and ritual publication disabled"
  ],
  warning:"Zero unexplained bookkeeping cases is NOT zero astronomical or religious disagreements."
 };
 return ledger;
}
if(process.argv[1]?.endsWith("adjudicate-independent-454.mjs")){
 const [shardDir,summaryPath,out]=process.argv.slice(2);
 assert(shardDir&&summaryPath&&out,"usage: node adjudicate-independent-454.mjs SHARDS SUMMARY OUTPUT");
 const summary=JSON.parse(readFileSync(summaryPath,"utf8"));
 const ledger=adjudicate(dateRows(shardDir),summary);
 mkdirSync(dirname(out),{recursive:true});
 writeFileSync(out,JSON.stringify(ledger,null,2)+"\n");
 console.log("[454-city forensic adjudication]",JSON.stringify(ledger.totals));
}
