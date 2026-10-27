/**
 * Fail-closed research comparison against the last complete, original GCal run.
 * This is a parity regression gate, NOT ritual certification or permission
 * to publish any independently computed date.
 *
 * Usage:
 * node scripts/verify-independent-454-research-gate.mjs \
 *   previous-summary.json current-summary.json previous-shards-dir current-shards-dir report.json
 */
import {readFileSync,readdirSync,writeFileSync,mkdirSync,statSync} from "node:fs";
import {dirname,join} from "node:path";

export function loadShardRows(root){
 const walk=path=>readdirSync(path).flatMap(name=>{
  const p=join(path,name);
  return statSync(p).isDirectory()?walk(p):(/^shard-\d{2}\.json$/.test(name)?[p]:[]);
 });
 const files=walk(root);
 if(files.length!==16)throw Error("Expected exactly 16 research shards at "+root+"; received "+files.length);
 const shards=new Set(),cityYears=new Set(),rows=new Map();
 for(const path of files){
  const shard=JSON.parse(readFileSync(path,"utf8"));
  if(shard.status!=="FULL_SHARD_RESEARCH_COMPARISON_ONLY"||shard.failures?.length||
     shard.independentlyCertified!==false||shard.publicRitualApproval!==false||
     !Number.isInteger(shard.shard)||shard.shard<0||shard.shard>15||shards.has(shard.shard))
    throw Error("Invalid research shard "+path);
  shards.add(shard.shard);
  for(const cy of shard.results){
   const ykey=cy.city+"/"+cy.year;
   if(cityYears.has(ykey))throw Error("Duplicate city-year "+ykey);
   cityYears.add(ykey);
   for(const row of cy.rows){
    const key=ykey+"/"+row.date;
    if(rows.has(key))throw Error("Duplicate event "+key);
    rows.set(key,row);
   }
  }
 }
 if(shards.size!==16||cityYears.size!==908)throw Error("Invalid shard/city-year coverage");
 return rows;
}

export function compareResearchRuns(baseline,current,oldRows,newRows){
 const errors=[],metrics={};
 const requireCheck=(condition,message)=>{if(!condition)errors.push(message)};
 requireCheck(baseline.status==="RESEARCH_COMPLETE_WITH_OPEN_GAPS","Baseline was not a completed comparison");
 requireCheck(current.status==="RESEARCH_COMPLETE_WITH_OPEN_GAPS","New run was not a completed comparison");
 for(const [label,summary] of [["baseline",baseline],["current",current]]){
  requireCheck(summary.independentlyCertified===false&&summary.publicRitualApproval===false,label+": ritual publication flags must remain disabled");
  requireCheck(summary.coverage?.cities===454&&summary.coverage?.cityYears===908&&summary.coverage?.shards===16,label+": incomplete coverage");
  requireCheck(summary.totals?.sourceEkadashiFasts===22246&&summary.totals?.unrelatedSourceFastsExcluded===2724,label+": original-source count changed");
 }
 for(const [field,base] of [
  ["candidateMismatches",160],["subtypeMismatches",87],
  ["paranaStartComparisons",18993],["paranaEndComparisons",18993]
 ]){
  requireCheck(baseline.totals?.[field]===base,"Baseline mismatch / unverified artifact: "+field);
 }
 requireCheck(baseline.parana?.missingNumericBounds===3253,"Baseline missing Parana not pinned");
 for(const field of ["candidateMismatches","subtypeMismatches"]){
  const a=baseline.totals?.[field],b=current.totals?.[field];
  requireCheck(Number.isInteger(b)&&b>=0&&b<=a,"Regression "+field+": "+a+" -> "+b);
  metrics[field]={before:a,after:b};
 }
 const missingA=baseline.parana?.missingNumericBounds,missingB=current.parana?.missingNumericBounds;
 requireCheck(Number.isInteger(missingB)&&missingB>=0&&missingB<=missingA,"Parana numeric coverage regressed: "+missingA+" -> "+missingB);
 metrics.missingParana={before:missingA,after:missingB};
 for(const field of ["paranaStartComparisons","paranaEndComparisons"]){
  const a=baseline.totals?.[field],b=current.totals?.[field];
  requireCheck(Number.isInteger(b)&&b>=a,"Parana endpoint pairs regressed: "+field+" "+a+" -> "+b);
  metrics[field]={before:a,after:b};
 }
 for(const field of ["paranaStartOverFiveMinutes","paranaEndOverFiveMinutes"]){
  const n=current.totals?.[field];
  requireCheck(n===0,"Newly compared Parana endpoint exceeds 5 minutes: "+field+"="+n);
  metrics[field]=n;
 }
 let retainedOldPairs=0,oldMatchedFasts=0,fastRegressions=0,subtypeRegressions=0,missingRows=0,
  oldParanaRegressions=0,newlyResolvedFasts=0,newlyResolvedSubtypes=0;
 const examples={fast:[],subtype:[],parana:[],missing:[]};
 for(const [key,prior] of oldRows){
  const next=newRows.get(key);
  // An old, false extra candidate can legitimately disappear from the output
  // once repaired; those rows are not mandatory.
  if(!next){
   if(prior.gcalEkadashiFast||prior.sourceSubtype||!prior.mismatch){
    missingRows++;
    if(examples.missing.length<12)examples.missing.push(key);
   }else if(prior.mismatch)newlyResolvedFasts++;
   continue;
  }
  if(prior.mismatch&&!next.mismatch)newlyResolvedFasts++;
  if(!prior.mismatch&&next.mismatch){
   fastRegressions++;
   if(examples.fast.length<12)examples.fast.push(key);
  }
  if(prior.sourceSubtype){
   if(!prior.subtypeMatch&&next.subtypeMatch)newlyResolvedSubtypes++;
   if(prior.subtypeMatch&&!next.subtypeMatch){
    subtypeRegressions++;
    if(examples.subtype.length<12)examples.subtype.push(key);
   }
  }
  if(prior.gcalEkadashiFast&&!prior.mismatch)oldMatchedFasts++;
  if(prior.startResidualMinutes!==null&&prior.endResidualMinutes!==null){
   retainedOldPairs++;
   if(next.startResidualMinutes===null||next.endResidualMinutes===null||
      next.startResidualMinutes>3||next.endResidualMinutes>3||
      next.startResidualMinutes>prior.startResidualMinutes||
      next.endResidualMinutes>prior.endResidualMinutes){
    oldParanaRegressions++;
    if(examples.parana.length<12)
     examples.parana.push({key,oldStart:prior.startResidualMinutes,newStart:next.startResidualMinutes,
      oldEnd:prior.endResidualMinutes,newEnd:next.endResidualMinutes});
   }
  }
 }
 requireCheck(missingRows===0,"Missing previously verified source rows: "+missingRows);
 requireCheck(fastRegressions===0,"Previously matched fast dates regressed: "+fastRegressions);
 requireCheck(subtypeRegressions===0,"Previously matched Mahadvadashi subtypes regressed: "+subtypeRegressions);
 requireCheck(oldParanaRegressions===0,"Previously matched Parana numerical endpoints regressed: "+oldParanaRegressions);
 requireCheck(retainedOldPairs===baseline.totals.paranaStartComparisons,
  "Retained baseline Parana comparison count mismatch: "+retainedOldPairs);
 metrics.caseLevel={oldMatchedFasts,retainedOldPairs,fastRegressions,subtypeRegressions,
  missingRows,oldParanaRegressions,newlyResolvedFasts,newlyResolvedSubtypes};
 const isProgress=current.totals.candidateMismatches<baseline.totals.candidateMismatches||
  current.totals.subtypeMismatches<baseline.totals.subtypeMismatches||
  current.parana.missingNumericBounds<baseline.parana.missingNumericBounds;
 requireCheck(isProgress,"No measurable improvement over last complete 908-city-year baseline");
 return {status:errors.length?"REGRESSION_GATE_FAILED":"RESEARCH_PARITY_PROGRESS_VERIFIED",
  independentCertification:false,publicRitualApproval:false,
  baselineRunId:40560045297,metrics,examples,errors,
  warning:"Research-only gate, not religious or scientific certification; no public date promotion."};
}

if(process.argv[1]?.endsWith("verify-independent-454-research-gate.mjs")){
 const [baseSummary,currentSummary,baseShards,currentShards,output]=process.argv.slice(2);
 if(!baseSummary||!currentSummary||!baseShards||!currentShards||!output)
  throw Error("Usage: node verify-independent-454-research-gate.mjs BASE CURRENT BASE_SHARDS CURRENT_SHARDS OUT");
 const baseline=JSON.parse(readFileSync(baseSummary,"utf8"));
 const current=JSON.parse(readFileSync(currentSummary,"utf8"));
 const result=compareResearchRuns(baseline,current,loadShardRows(baseShards),loadShardRows(currentShards));
 mkdirSync(dirname(output),{recursive:true});
 writeFileSync(output,JSON.stringify(result,null,2)+"\n");
 console.log("[454-city strict regression gate]",JSON.stringify(result));
 if(result.errors.length)process.exitCode=1;
}