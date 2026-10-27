/** Research-only 454-city GCal comparison aggregation. No publication authority. */
import {readdirSync,readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {join,dirname} from "node:path";
function check(v,m){if(!v)throw Error("454-city research aggregation: "+m)}
const directory=process.argv[2]??"artifacts/independent-454";
const output=process.argv[3]??"artifacts/independent-454-summary.json";
const files=readdirSync(directory).filter(n=>/^shard-\d{2}\.json$/.test(n)).sort();
check(files.length===16,"expected 16 JSON shards; received "+files.length);
const ids=new Set(),cityYears=new Set(),cities=new Map();
const totals={},bySubtype={},missingSubtype={},mismatchDates={},residualStart={},residualEnd={},specialStatuses={};
let sourceFasts=0,sourceMissing=0,falseCandidates=0,unmatchedKinds=0,paranaMissing=0,comparedStart=0,comparedEnd=0;
for(const file of files){
 const v=JSON.parse(readFileSync(join(directory,file),"utf8"));
 check(v.status==="FULL_SHARD_RESEARCH_COMPARISON_ONLY","not a completed research shard: "+file);
 check(v.publicRitualApproval===false&&v.independentlyCertified===false,"certification flag violated");
 check(Number.isInteger(v.shard)&&v.shards===16&&v.shard>=0&&v.shard<16&&!ids.has(v.shard),"duplicate or bad shard "+file);
 ids.add(v.shard);
 check(Array.isArray(v.failures)&&v.failures.length===0&&v.completedCityYears===v.expectedShardCityYears&&v.results.length===v.completedCityYears,"incomplete shard "+file);
 for(const [k,n] of Object.entries(v.totals)){
  check(Number.isSafeInteger(n)&&n>=0,"invalid metric "+k);
  totals[k]=(totals[k]??0)+n;
 }
 for(const cityYear of v.results){
  const {city,year,rows}=cityYear,k=city+"/"+year;
  check(typeof city==="string"&&[2026,2027].includes(year)&&!cityYears.has(k),"duplicate/bad city-year "+k);
  check(Array.isArray(rows),"missing observations "+k);
  cityYears.add(k);
  cities.set(city,(cities.get(city)??0)+1);
  let countedFast=0,countedMismatch=0,countedSubtype=0,start=0,end=0;
  const seenDates=new Set();
  for(const row of rows){
   check(typeof row.date==="string"&&!seenDates.has(row.date),"duplicate date "+k);
   seenDates.add(row.date);
   if(row.gcalEkadashiFast){sourceFasts++;countedFast++}
   if(row.mismatch){
    countedMismatch++;
    mismatchDates[row.date]=(mismatchDates[row.date]??0)+1;
    if(row.gcalEkadashiFast)sourceMissing++;else falseCandidates++;
   }
   if(row.sourceSubtype){
    bySubtype[row.sourceSubtype]=(bySubtype[row.sourceSubtype]??0)+1;
    if(!row.subtypeMatch){
     unmatchedKinds++;countedSubtype++;
     missingSubtype[row.sourceSubtype]=(missingSubtype[row.sourceSubtype]??0)+1;
    }
   }
   if(row.gcalParana&&(row.startResidualMinutes===null||row.endResidualMinutes===null)){
    paranaMissing++;
    const status=row.calculatedParana?.status??"none";
    specialStatuses[status]=(specialStatuses[status]??0)+1;
   }
   if(row.startResidualMinutes!==null){
    check(Number.isFinite(row.startResidualMinutes)&&row.startResidualMinutes>=0,"bad residual start");
    comparedStart++;start++;
    const x=String(row.startResidualMinutes);residualStart[x]=(residualStart[x]??0)+1;
   }
   if(row.endResidualMinutes!==null){
    check(Number.isFinite(row.endResidualMinutes)&&row.endResidualMinutes>=0,"bad residual end");
    comparedEnd++;end++;
    const x=String(row.endResidualMinutes);residualEnd[x]=(residualEnd[x]??0)+1;
   }
  }
  check(countedFast===cityYear.sourceEkadashiFasts&&countedMismatch===cityYear.mismatchedCandidates&&
        countedSubtype===cityYear.unconfirmedSubtypes&&start===cityYear.comparedParanaStart&&
        end===cityYear.comparedParanaEnd,"invalid subtotals "+k);
 }
}
check(ids.size===16&&cities.size===454&&cityYears.size===908,"incomplete 454 city / 908 year coverage");
for(const [city,n] of cities)check(n===2&&cityYears.has(city+"/2026")&&cityYears.has(city+"/2027"),"missing year "+city);
check(sourceFasts===totals.sourceEkadashiFasts&&sourceMissing+falseCandidates===totals.candidateMismatches,"candidate counts inconsistent");
check(unmatchedKinds===totals.subtypeMismatches&&comparedStart===totals.paranaStartComparisons&&comparedEnd===totals.paranaEndComparisons,"subtype/time counts inconsistent");
const summary={status:"RESEARCH_COMPLETE_WITH_OPEN_GAPS",independentlyCertified:false,publicRitualApproval:false,
 coverage:{cities:454,years:[2026,2027],cityYears:908,shards:16},totals,
 candidateMismatches:{gcalFastMissedByIndependent:sourceMissing,independentExtraCandidate:falseCandidates,byDate:mismatchDates},
 mahadvadashi:{bySourceSubtype:bySubtype,notIndependentlyMatched:missingSubtype},
 parana:{numericStartPairs:comparedStart,numericEndPairs:comparedEnd,missingNumericBounds:paranaMissing,
  missingStatus:specialStatuses,startResidualMinutes:residualStart,endResidualMinutes:residualEnd},
 warning:"Coverage PASS is not algorithmic GCal agreement. No ritual recommendations or SEO expansion certified."};
mkdirSync(dirname(output),{recursive:true});
writeFileSync(output,JSON.stringify(summary,null,2)+"\n");
console.log("[454-city aggregate]",JSON.stringify({cityYears:908,sourceFasts,mismatches:totals.candidateMismatches,subtypeGaps:unmatchedKinds,paranaMissing,startPairs:comparedStart,endPairs:comparedEnd,certified:false}));
