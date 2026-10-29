/**
 * Strict 908-city-year source-first physical counterfactual comparison.
 * Never equate more GCal agreement with religious certification.
 */
import {readdirSync,readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {join,dirname} from "node:path";
const fail=(cond,msg)=>{if(!cond)throw Error("JPL independent 454-city counterfactual: "+msg)};
const readShards=(root,kind)=>{
 const files=readdirSync(root).filter(f=>/^shard-\d{2}\.json$/.test(f)).sort();
 fail(files.length===16,"Need exactly 16 "+kind+" shards");
 const seen=new Set(),years=new Set(),rows=new Map();
 for(const f of files){
  const x=JSON.parse(readFileSync(join(root,f),"utf8"));
  fail(x.status===(kind==="JPL"?"FULL_SHARD_JPL_OBSERVANCE_RESEARCH_ONLY":"FULL_SHARD_RESEARCH_COMPARISON_ONLY")&&
   x.independentlyCertified===false&&x.publicRitualApproval===false&&x.shards===16&&
   Number.isInteger(x.shard)&&!seen.has(x.shard)&&!x.failures?.length&&
   x.completedCityYears===x.expectedShardCityYears&&x.results.length===x.completedCityYears,
   "Invalid "+kind+" research shard "+f);
  seen.add(x.shard);
  for(const cy of x.results){
   const year=cy.city+"/"+cy.year;
   fail(!years.has(year),"Duplicate "+kind+" year "+year);years.add(year);
   for(const r of cy.rows){
    const key=year+"/"+r.date;
    fail(!rows.has(key),"Duplicate "+kind+" source comparison "+key);
    rows.set(key,r);
   }
  }
 }
 fail(seen.size===16&&years.size===908,"Partial "+kind+" 454-city 908-year coverage");
 return {years,rows};
};
export function countCounterfactual(swiss,jpl){
 const count={
  originalDateMismatches:0,originalSourceSubtypeMismatches:0,originalExtraSubtypes:0,
  baselineMissingJplRows:0,originalMatchedSourceDates:0,
  tithiOnly:{dateMismatches:0,dateResolved:0,dateRegressed:0,subtypeMismatches:0,subtypeResolved:0,subtypeRegressed:0},
  tithiPlusNakshatra:{dateMismatches:0,dateResolved:0,dateRegressed:0,subtypeMismatches:0,subtypeResolved:0,subtypeRegressed:0},
  newJplRootDateProbes:0,newBaselineSwissCandidatesFromProbes:0,
  jplTithiOnlyNewProbeFastDifferences:0,jplWithNakshatraNewProbeFastDifferences:0
 };
 const unmilani=[],vijaya=[],regressions=[],otherTypes=[];
 const variants=[
  {output:count.tithiOnly,mismatch:"jplTithiOnlyMismatch",kind:"jplTithiOnlyKind",subtype:"jplTithiOnlySubtypeMatch",nak:"jplTithiOnlyNakshatraSubtype"},
  {output:count.tithiPlusNakshatra,mismatch:"jplWithNakshatraMismatch",kind:"jplWithNakshatraKind",subtype:"jplWithNakshatraSubtypeMatch",nak:"jplWithNakshatraNakshatraSubtype"}
 ];
 const evaluated=new Set();
 for(const [k,b] of swiss.rows){
  const r=jpl.rows.get(k);
  fail(!!r,"JPL output omitted prior original GCal / Swiss row "+k);
  fail(r.gcalEkadashiFast===b.gcalEkadashiFast&&r.sourceSubtype===b.sourceSubtype&&
   r.mismatch===b.mismatch&&r.subtype===b.subtype&&r.subtypeMatch===b.subtypeMatch&&
   r.independentFastCandidate===b.independentFastCandidate,
   "Swiss baseline or GCal source changed unexpectedly "+k);
  evaluated.add(k);
  if(b.mismatch)count.originalDateMismatches++;
  if(b.sourceSubtype&&!b.subtypeMatch)count.originalSourceSubtypeMismatches++;
  if(b.subtype&&!b.sourceSubtype)count.originalExtraSubtypes++;
  if(b.gcalEkadashiFast&&!b.mismatch)count.originalMatchedSourceDates++;
 }
 fail(count.originalDateMismatches===128&&count.originalSourceSubtypeMismatches===87&&
  count.originalExtraSubtypes===17,"Expected pinned 128 fast/104 subtype Swiss reference");
 for(const [k,r] of jpl.rows){
  const b=swiss.rows.get(k);
  const baselineDateWrong=b?.mismatch??r.mismatch;
  const baselineSubtypeWrong=b?Boolean((b.sourceSubtype&&!b.subtypeMatch)||(b.subtype&&!b.sourceSubtype)):
   Boolean((r.sourceSubtype&&!r.subtypeMatch)||(r.subtype&&!r.sourceSubtype));
  const src=Boolean(r.sourceSubtype);
  const fastWrong=Boolean(r.mismatch);
  if(!b&&r.additionalJplRootProbe){
   count.newJplRootDateProbes++;
   if(fastWrong)count.newBaselineSwissCandidatesFromProbes++;
   if(r.jplTithiOnlyMismatch)count.jplTithiOnlyNewProbeFastDifferences++;
   if(r.jplWithNakshatraMismatch)count.jplWithNakshatraNewProbeFastDifferences++;
  }
  for(const v of variants){
   const m=Boolean(r[v.mismatch]),kind=r[v.kind],match=Boolean(r[v.subtype]);
   const badSubtype=Boolean((src&&!match)||(kind&&!src));
   if(m)v.output.dateMismatches++;
   if(!m&&baselineDateWrong)v.output.dateResolved++;
   if(m&&!baselineDateWrong)v.output.dateRegressed++;
   if(badSubtype)v.output.subtypeMismatches++;
   if(!badSubtype&&baselineSubtypeWrong)v.output.subtypeResolved++;
   if(badSubtype&&!baselineSubtypeWrong)v.output.subtypeRegressed++;
   if((m&&!baselineDateWrong||badSubtype&&!baselineSubtypeWrong)&&regressions.length<250)
    regressions.push({case:k,model:v===variants[0]?"JPL_TITHI_ONLY":"JPL_TITHI_NAKSHATRA",
     newFastMismatch:m&&!baselineDateWrong,newSubtypeMismatch:badSubtype&&!baselineSubtypeWrong,
     sourceSubtype:r.sourceSubtype,independentKind:kind});
  }
  const tag=k.split("/").at(-1);
  if(tag==="2027-03-04"&&(r.subtype==="UNMILANI"||r.jplTithiOnlyKind==="UNMILANI"||r.jplWithNakshatraKind==="UNMILANI")){
   unmilani.push({case:k,source:r.sourceSubtype,swiss:r.subtype,
    jplTithi:r.jplTithiOnlyKind,jplPlusNakshatra:r.jplWithNakshatraKind,
    swissOriginalSubtypeMatched:r.subtypeMatch,
    jplTithiSubtypeMatched:r.jplTithiOnlySubtypeMatch,
    jplPlusNakshatraSubtypeMatched:r.jplWithNakshatraSubtypeMatch,
    tithiAtSunriseChanged:r.swissVsJplTithiAtSunrise,
    tithiAtArunodayaChanged:r.swissVsJplTithiAtArunodaya});
  }
  if(["2027-09-11","2027-09-12"].includes(tag)&&
   (r.nakshatraSubtype==="VIJAYA"||r.jplTithiOnlyNakshatraSubtype==="VIJAYA"||
     r.jplWithNakshatraNakshatraSubtype==="VIJAYA"||/vijaya/i.test(r.sourceSubtype??""))){
   vijaya.push({case:k,source:r.sourceSubtype,
    swiss:{kind:r.subtype,nakshatraSubtype:r.nakshatraSubtype,fast:r.independentFastCandidate},
    jplTithiOnly:{kind:r.jplTithiOnlyKind,nakshatraSubtype:r.jplTithiOnlyNakshatraSubtype,fast:r.jplTithiOnlyCandidate},
    jplWithNakshatra:{kind:r.jplWithNakshatraKind,nakshatraSubtype:r.jplWithNakshatraNakshatraSubtype,fast:r.jplWithNakshatraCandidate},
    jplNakshatraDiffersFromSwiss:r.swissVsJplNakshatraAtSunrise,
    jplTithiDiffersFromSwiss:r.swissVsJplTithiAtSunrise});
  }
  if(r.sourceSubtype&&r.subtype!==r.jplWithNakshatraKind&&otherTypes.length<100)
   otherTypes.push({case:k,source:r.sourceSubtype,swiss:r.subtype,jpl:r.jplWithNakshatraKind});
 }
 fail(unmilani.length>=13,"Missing original 2027-03-04 Unmilani test census");
 fail(vijaya.length>=3,"Missing original 2027-09 Vijaya test census");
 return {status:"JPL_OBSERVANCE_RESEARCH_PARITY_MEASURED_NOT_CERTIFIED",
  coverage:{cities:454,cityYears:908,originalSwissCaseRows:swiss.rows.size,
   fullJplComparisonRows:jpl.rows.size,baselineSwissSourceRowsExactlyPreserved:evaluated.size},
  counts:count,priority:{unmilani20270304:unmilani,
   vijaya20270911And12:vijaya,otherChangedSubtypes:otherTypes},
  sampleNewRegressions:regressions,
  sourceMeaning:"Original GCal 11 is comparison oracle only; JPL+Swiss use identical independent rule code",
  modelCaveat:"JPL Nakshatra uses Swiss Lahiri anchors and is not fully independent ayanamsa",
  paranaNotRecomputedForJpl:true,independentTraditionCertified:false,
  publicRitualApproval:false,independentlyCertified:false,
  publicationOrSEOChangeAuthorized:false};
}
if(process.argv[1]?.endsWith("aggregate-jpl-observance-454.mjs")){
 const [oldDir,newDir,out]=process.argv.slice(2);
 fail(Boolean(oldDir&&newDir&&out),"Usage: aggregate-jpl-observance-454.mjs OLD16 NEW16 OUT");
 const report=countCounterfactual(readShards(oldDir,"Swiss"),readShards(newDir,"JPL"));
 mkdirSync(dirname(out),{recursive:true});
 writeFileSync(out,JSON.stringify(report,null,2)+"\n");
 console.log("[JPL observance 454-city result]",JSON.stringify({coverage:report.coverage,
  counts:report.counts,unmilani:report.priority.unmilani20270304.length,
  vijaya:report.priority.vijaya20270911And12.length}));
}
