/**
 * Non-publishing, full-registry independent sunrise + Parana comparison.
 * The native GCal data is an *oracle*, NEVER an input to classify an event.
 * It provides only dates to examine and reference clock values to compare.
 * Fixed source fingerprint; 16 sharded CI jobs cover 454 cities x 2 years.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {findCityBySlug} from "../lib/cities";
import {compareEkadashiArunodaya} from "../lib/ekadashi-observance-research";
import {calculateVratCalendar} from "../lib/vrat";
import {addIsoDays} from "../lib/india-time";
import {independentlyScreenVaishnavaDay} from "../lib/independent-vaishnava-rule-screen";
import {classifyMahadvadashiSequence,identifySourceMahadvadashi,identifySourceNakshatra} from "../lib/independent-mahadvadashi";
import {independentParanaAstronomy} from "../lib/independent-parana-astronomy";
import {calculateIndependentParana,minutesBetween,researchParanaMethodFromIndependentKind} from "../lib/independent-parana";
import {isGcalEkadashiFast,isoGcalNativeDate,shardFor} from "../lib/native-gcal-comparison";
const argv=(key:string)=>process.argv.find(x=>x.startsWith("--"+key+"="))?.slice(key.length+3);
const input=argv("input"),shardSpec=argv("shard")??"0/1";
if(!input)throw Error("Supply genuine original GCal artifact via --input");
const match=shardSpec.match(/^(\d+)\/(\d+)$/);
if(!match)throw Error("Bad shard syntax");
const shard=+match[1],shards=+match[2];
if(shard<0||shard>=shards||shards<1||shards>128)throw Error("Bad shard range");
const source=JSON.parse(readFileSync(input,"utf8"));
if(source.researchOnly!==true||source.publicRitualApproved!==false||source.hasIndependentSecondMethod!==false||source.completedCityYears!==908||source.expectedCityYears!==908||source.failures?.length)
 throw Error("Native GCal evidence is incomplete, stale or falsely certified");
if(source.gcalOriginalExeGitBlob!=="1d20f6e0caf29b6293157d258d02287e4edf0481")throw Error("Wrong native GCal binary");
const distinct=new Set<string>(),results=[],failures=[];
for(const r of source.records){
 const unique=r.city+"/"+r.year;
 if(distinct.has(unique))throw Error("Duplicate native city-year "+unique);
 distinct.add(unique);
}
if(distinct.size!==908)throw Error("Missing native city-years");
for(const record of source.records){
 if(shardFor(record.city,record.year,shards)!==shard)continue;
 const city=findCityBySlug(record.city);
 if(!city){failures.push("Unknown city "+record.city);continue;}
 if(Math.abs(city.lat-record.lat)>0.01||Math.abs(city.lng-record.lng)>0.01||Math.abs(record.timezone-5.5)>1e-4){failures.push("City coordinate/timezone mismatch "+record.city+"/"+record.year);continue;}
 const fasting=record.fasts.filter(isGcalEkadashiFast);
 const unrelated=record.fasts.length-fasting.length;
 const fastDays=new Set<string>(fasting.map((x:{date:string})=>isoGcalNativeDate(x.date)));
 const sunriseDays=calculateVratCalendar("ekadashi",record.year,city).map(x=>x.date);
 const sampleDays=new Set([...sunriseDays,...sunriseDays.map(x=>addIsoDays(x,1)),...fastDays]);
 const obsCache=new Map<string,ReturnType<typeof compareEkadashiArunodaya>>();
 const observe=(date:string)=>{
  let observation=obsCache.get(date);
  if(!observation){observation=compareEkadashiArunodaya(city,date);obsCache.set(date,observation);}
  return observation;
 };
 const oracleParana=new Map<string,{date:string;from:string;to:string;sunriseTithi:string}>();
 for(const p of record.parana){const date=isoGcalNativeDate(p.date);oracleParana.set(date,{...p,date});}
 const sourceTypes=new Map<string,string>();
 for(const v of record.mahadvadasi)sourceTypes.set(isoGcalNativeDate(v.date),v.subtype);
 const rows=[];
 for(const date of [...sampleDays].sort()){
  if(!date.startsWith(record.year+"-"))continue;
  try{
   const obs=observe(date),screen=independentlyScreenVaishnavaDay(obs);
   const days=[];
   for(let n=-1;n<=8;n++){
    const d=addIsoDays(date,n),o=observe(d);
    days.push({date:d,sunriseIndex:o.sunriseTithiIndex,arunodayaIndex:o.arunodayaTithiIndex,
      nearBoundary:o.nearFiveMinuteAstronomicalBoundary,nakshatraIndex:o.sunriseNakshatraIndex});
   }
   const classifier=classifyMahadvadashiSequence(days,date);
   const expected=fastDays.has(date);
   const sourceType=sourceTypes.get(date)??null;
   const sourceKind=sourceType?identifySourceMahadvadashi(sourceType):null;
   const sameSourceKind=sourceKind===null?classifier.kind===null:
    sourceKind==="NAKSHATRA_REVIEW"?classifier.kind===sourceKind&&classifier.nakshatraSubtype===identifySourceNakshatra(sourceType??""):
    sourceKind===classifier.kind;
   let referenceParana=null,computedParana=null;
   if(expected){
    const paraDate=addIsoDays(date,1);
    const p=oracleParana.get(paraDate);
    if(p){
     referenceParana=p;
     const inputs=independentParanaAstronomy(city,date,paraDate);
     // Oracle subtypes are comparison labels ONLY, never inputs to independently select a method.
     const method=researchParanaMethodFromIndependentKind(classifier.kind,obs.sunriseTithiIndex,obs.followingSunriseTithiIndex);
     computedParana=inputs?calculateIndependentParana({...inputs,method}):null;
    }
   }
   // Compare ordinary numerical windows only when BOTH independent prediction and
   // source identify an ordinary case. Keep special mismatches in the gap ledger.
   const normalMethodPair=sourceKind===null&&classifier.kind===null;
   const residualStart=normalMethodPair&&computedParana?.from&&referenceParana?.from?minutesBetween(computedParana.from,referenceParana.from):null;
   const residualEnd=normalMethodPair&&computedParana?.to&&referenceParana?.to?minutesBetween(computedParana.to,referenceParana.to):null;
   rows.push({date,gcalEkadashiFast:expected,independentFastCandidate:classifier.fastCandidates.iskcon,
    independentResearchReason:classifier.reason,independentSunriseTithiIndex:obs.sunriseTithiIndex,
    independentArunodayaTithiIndex:obs.arunodayaTithiIndex,
    independentSunriseNakshatraIndex:obs.sunriseNakshatraIndex,
    independentlyScreenedFast:screen.tentativeFastEligibility,
    mismatch:expected!==Boolean(classifier.fastCandidates.iskcon===date),
    subtype:classifier.kind,nakshatraSubtype:classifier.nakshatraSubtype,sourceSubtype:sourceType,subtypeMatch:sameSourceKind,
    normalParanaMethodComparable:normalMethodPair,paranaMethodProvenance:"independent-classifier",
    gcalParana:referenceParana,calculatedParana:computedParana,
    startResidualMinutes:residualStart,endResidualMinutes:residualEnd,
    certified:false});
  }catch(e){failures.push(record.city+"/"+record.year+"/"+date+": "+String(e));}
 }
 results.push({city:record.city,year:record.year,sourceEkadashiFasts:fastDays.size,
   unrelatedSourceFastsExcluded:unrelated,sourceParanaEvents:record.parana.length,
   sourceMahadvadashiEvents:record.mahadvadasi.length,observations:rows.length,
   mismatchedCandidates:rows.filter(x=>x.mismatch).length,
   unconfirmedSubtypes:rows.filter(x=>x.sourceSubtype&&x.subtypeMatch!==true).length,
   pairedParana:rows.filter(x=>x.gcalParana).length,
   comparedParanaStart:rows.filter(x=>x.startResidualMinutes!==null).length,
   comparedParanaEnd:rows.filter(x=>x.endResidualMinutes!==null).length,
   residualStartOverFive:rows.filter(x=>x.startResidualMinutes!==null&&x.startResidualMinutes>5).length,
   residualEndOverFive:rows.filter(x=>x.endResidualMinutes!==null&&x.endResidualMinutes>5).length,
   rows:rows.filter(x=>x.gcalEkadashiFast||x.mismatch||x.sourceSubtype)});
}
const report={status:failures.length?"INCOMPLETE":"FULL_SHARD_RESEARCH_COMPARISON_ONLY",
 generatedAt:new Date().toISOString(),shard,shards,expectedCityYears:908,
 completedCityYears:results.length,expectedShardCityYears:source.records.filter((r:{city:string;year:number})=>shardFor(r.city,r.year,shards)===shard).length,
 independentlyCertified:false,publicRitualApproval:false,
 methods:{fast:"Swiss sunrise/Arunodaya provisional structural rules",parana:"Swiss solar rise/set and Dvadashi numerical bounds, first quarter and first third daylight",
    gcal:"pinned original GCal 11 Windows execution, comparison oracle only",
    exclusions:"GCal non-Ekadashi Purnima/Navami/Astami fast records are NOT Ekadashi"},
 totals:{sourceEkadashiFasts:results.reduce((n,x)=>n+x.sourceEkadashiFasts,0),
 unrelatedSourceFastsExcluded:results.reduce((n,x)=>n+x.unrelatedSourceFastsExcluded,0),
 candidateMismatches:results.reduce((n,x)=>n+x.mismatchedCandidates,0),
 subtypeMismatches:results.reduce((n,x)=>n+x.unconfirmedSubtypes,0),
 paranaStartComparisons:results.reduce((n,x)=>n+x.comparedParanaStart,0),
 paranaEndComparisons:results.reduce((n,x)=>n+x.comparedParanaEnd,0),
 paranaStartOverFiveMinutes:results.reduce((n,x)=>n+x.residualStartOverFive,0),
 paranaEndOverFiveMinutes:results.reduce((n,x)=>n+x.residualEndOverFive,0)},
 failures,results
};
mkdirSync("artifacts/independent-454",{recursive:true});
const path="artifacts/independent-454/shard-"+String(shard).padStart(2,"0")+".json";
writeFileSync(path,JSON.stringify(report,null,2));
console.log("[454-rules] shard "+shard+"/"+shards+" city-years="+results.length+"/"+report.expectedShardCityYears+
 " gcal-ekadashi="+report.totals.sourceEkadashiFasts+" non-ekadashi-filtered="+report.totals.unrelatedSourceFastsExcluded+
 " candidate-gaps="+report.totals.candidateMismatches+" subtype-gaps="+report.totals.subtypeMismatches+
 " parana-start="+report.totals.paranaStartComparisons+" parana-end="+report.totals.paranaEndComparisons+
 " failures="+failures.length);
if(failures.length||results.length!==report.expectedShardCityYears)process.exitCode=1;
