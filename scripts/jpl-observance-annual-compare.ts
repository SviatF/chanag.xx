/**
 * Non-publishing, full-registry independent sunrise + Parana comparison.
 * The native GCal data is an *oracle*, NEVER an input to classify an event.
 * It provides only dates to examine and reference clock values to compare.
 * Fixed source fingerprint; 16 sharded CI jobs cover 454 cities x 2 years.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {getPinnedV6HalfTithiTable,JPL_V6_ROOTS_ASSET_SHA256} from "../lib/jpl-v6-pinned-data";
import {openVerifiedV6SiderealSource} from "../lib/v6-unified-calendar-staging";
import {researchDawn,RESEARCH_OBSERVANCE_RELEASE_GUARD} from "../lib/jpl-observance-research";
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
const input=argv("input"),proofPath=argv("proof"),catalogPath=argv("catalog"),anchorsPath=argv("anchors"),shardSpec=argv("shard")??"0/1";
if(!input||!proofPath||!catalogPath||!anchorsPath)throw Error("Require pinned GCal source, raw clock proof, JPL sidereal catalog and Lahiri anchors");
const match=shardSpec.match(/^(\d+)\/(\d+)$/);
if(!match)throw Error("Bad shard syntax");
const shard=+match[1],shards=+match[2];
if(shard<0||shard>=shards||shards<1||shards>128)throw Error("Bad shard range");
const source=JSON.parse(readFileSync(input,"utf8"));
if(source.researchOnly!==true||source.publicRitualApproved!==false||source.hasIndependentSecondMethod!==false||source.completedCityYears!==908||source.expectedCityYears!==908||source.failures?.length)
 throw Error("Native GCal evidence is incomplete, stale or falsely certified");
if(source.gcalOriginalExeGitBlob!=="1d20f6e0caf29b6293157d258d02287e4edf0481")throw Error("Wrong native GCal binary");
const rawProof=JSON.parse(readFileSync(proofPath,"utf8"));
if(rawProof.status!=="GCAL_ORIGINAL_19_AFTER_ONLY_CLOCKS_CONFIRMED"||
   rawProof.verifiedAfterOnly!==19||rawProof.originalExeGitBlob!==source.gcalOriginalExeGitBlob||rawProof.expected!==19||
   rawProof.replayed!==19||rawProof.independentlyCertified!==false||rawProof.publicRitualApproval!==false||
   !Array.isArray(rawProof.records)||rawProof.records.length!==19)
 throw Error("Missing or unpinned original GCal 11 XML clock proof");
const afterProof=new Map<string,string>();
for(const entry of rawProof.records){
 const match=String(entry.originalParanaXml??"").match(/\bafter="(\d{2}:\d{2})"/);
 if(!match||entry.verifiedOneSidedAfter!==true||entry.originalXmlAfter!==match[1]||
    entry.originalXmlFrom||entry.originalXmlTo)throw Error("Raw GCal XML does not prove after-only Parana");
 const key=entry.city+"/"+entry.year+"/"+isoGcalNativeDate(entry.date);
 if(afterProof.has(key))throw Error("Duplicate original GCal XML one-sided Parana "+key);
 afterProof.set(key,match[1]);
}
if(afterProof.size!==19)throw Error("Unverified original GCal one-sided Parana source count");
const jplTable=getPinnedV6HalfTithiTable();
const siderealSource=openVerifiedV6SiderealSource(readFileSync(catalogPath,"utf8"),readFileSync(anchorsPath,"utf8"));
if(jplTable.halfTithiBoundaryCount!==4512||
 JPL_V6_ROOTS_ASSET_SHA256!=="0cab0c6accaf2e2125fe417bf4a4f14a22453a4013a1609dce6dce84ec44142e")
 throw Error("JPL source changed");
const extraJplRootProbeDays=new Set<string>();
for(const [ms,i] of jplTable.halfTithiTransitions){
 if(![20,22,50,52].includes(i))continue;
 const d=new Date(ms+330*60000);
 if(d.getUTCHours()<2||d.getUTCHours()>10)continue;
 const date=d.toISOString().slice(0,10);
 for(const offset of [-1,0,1])extraJplRootProbeDays.add(addIsoDays(date,offset));
}
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
 const standardSwissProbeDays=new Set(sampleDays);
 for(const d of extraJplRootProbeDays)if(d.startsWith(record.year+"-"))sampleDays.add(d);
 const obsCache=new Map<string,ReturnType<typeof compareEkadashiArunodaya>>();
 const observe=(date:string)=>{
  let observation=obsCache.get(date);
  if(!observation){observation=compareEkadashiArunodaya(city,date);obsCache.set(date,observation);}
  return observation;
 };
 const dawnTithiOnly=new Map<string,ReturnType<typeof researchDawn>>();
 const dawnJplNak=new Map<string,ReturnType<typeof researchDawn>>();
 const jplDawn=(d:string,mode:"jpl-tithi-swiss-nakshatra"|"jpl-tithi-jpl-nakshatra")=>{
  const cache=mode==="jpl-tithi-swiss-nakshatra"?dawnTithiOnly:dawnJplNak;
  let value=cache.get(d);
  if(!value){value=researchDawn(observe(d),jplTable,siderealSource,mode);cache.set(d,value);}
  return value;
 };
 const oracleParana=new Map<string,{date:string;from:string;to:string;after:string;sunriseTithi:string}>();
 for(const p of record.parana){
  const date=isoGcalNativeDate(p.date),sourceAfter=afterProof.get(record.city+"/"+record.year+"/"+date);
  if((!p.from||!p.to)&&!sourceAfter)throw Error("GCal one-sided reference not independently replayed: "+record.city+"/"+date);
  if(p.after&&sourceAfter&&p.after!==sourceAfter)throw Error("Raw XML after bound differs from parsed source");
  oracleParana.set(date,{...p,date,after:p.after||sourceAfter||""});
 }
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
      independentSunriseUtcMs:o.sunriseUtcMs,independentArunodayaUtcMs:o.arunodayaUtcMs,
      nearBoundary:o.nearFiveMinuteAstronomicalBoundary,
      tithiSunriseSensitivity:o.fiveMinuteTithiSensitivity.sunrise,
      tithiArunodayaSensitivity:o.fiveMinuteTithiSensitivity.arunodaya,
      closestSunriseBoundarySeconds:o.closestSunriseBoundarySeconds,
      closestArunodayaBoundarySeconds:o.closestArunodayaBoundarySeconds,
      nakshatraIndex:o.sunriseNakshatraIndex,
      nearNakshatraBoundary:o.sunriseNakshatraBoundaryMinutes<=5});
   }
   const classifier=classifyMahadvadashiSequence(days,date);
   const jt=classifyMahadvadashiSequence(days.map(d=>jplDawn(d.date,"jpl-tithi-swiss-nakshatra")),date);
   const jn=classifyMahadvadashiSequence(days.map(d=>jplDawn(d.date,"jpl-tithi-jpl-nakshatra")),date);
   const boundarySensitive=classifier.researchAmbiguities.length>0;
   const expected=fastDays.has(date);
   const sourceType=sourceTypes.get(date)??null;
   const sourceKind=sourceType?identifySourceMahadvadashi(sourceType):null;
   const sameSourceKind=sourceKind===null?classifier.kind===null:
    sourceKind==="NAKSHATRA_REVIEW"?classifier.kind===sourceKind&&classifier.nakshatraSubtype===identifySourceNakshatra(sourceType??""):
    sourceKind===classifier.kind;
   const matches=(a:typeof classifier)=>{
    if(sourceKind===null)return a.kind===null;
    if(sourceKind==="NAKSHATRA_REVIEW")
     return a.kind===sourceKind&&a.nakshatraSubtype===identifySourceNakshatra(sourceType??"");
    return a.kind===sourceKind;
   };
   const standardProbe=standardSwissProbeDays.has(date);
   let referenceParana=null,computedParana=null;
   if(expected){
    const paraDate=addIsoDays(date,1);
    const p=oracleParana.get(paraDate);
    if(p){
     referenceParana=p;
     const inputs=independentParanaAstronomy(city,date,paraDate,classifier.nakshatraSubtype);
     // Oracle subtypes are comparison labels ONLY, never inputs to independently select a method.
     const method=researchParanaMethodFromIndependentKind(classifier.kind,obs.sunriseTithiIndex,obs.followingSunriseTithiIndex);
     computedParana=inputs?calculateIndependentParana({...inputs,method,nakshatraSubtype:classifier.nakshatraSubtype}):null;
    }
   }
   // Compare ordinary numerical windows only when BOTH independent prediction and
   // source identify an ordinary case. Keep special mismatches in the gap ledger.
   const normalMethodPair=sameSourceKind&&
    computedParana?.status==="calculated-research-only";
   const residualStart=normalMethodPair&&computedParana?.from&&referenceParana?.from?minutesBetween(computedParana.from,referenceParana.from):null;
   const residualEnd=normalMethodPair&&computedParana?.to&&referenceParana?.to?minutesBetween(computedParana.to,referenceParana.to):null;
   // A genuine GCal <parana after="HH:MM"/> has an OPEN upper end.
   // Verify its lower bound separately; NEVER invent a GCal 'to' time.
   const afterOnlyResidual=normalMethodPair&&computedParana?.from&&referenceParana?.after&&
     !referenceParana.from&&!referenceParana.to?
      minutesBetween(computedParana.from,referenceParana.after):null;
   rows.push({date,standardProbe,additionalJplRootProbe:!standardProbe,
    gcalEkadashiFast:expected,independentFastCandidate:classifier.fastCandidates.iskcon,
    jplTithiOnlyCandidate:jt.fastCandidates.iskcon,
    jplTithiOnlyMismatch:expected!==(jt.fastCandidates.iskcon===date),
    jplTithiOnlyKind:jt.kind,jplTithiOnlyNakshatraSubtype:jt.nakshatraSubtype,
    jplTithiOnlySubtypeMatch:matches(jt),jplTithiOnlyReason:jt.reason,
    jplWithNakshatraCandidate:jn.fastCandidates.iskcon,
    jplWithNakshatraMismatch:expected!==(jn.fastCandidates.iskcon===date),
    jplWithNakshatraKind:jn.kind,jplWithNakshatraNakshatraSubtype:jn.nakshatraSubtype,
    jplWithNakshatraSubtypeMatch:matches(jn),jplWithNakshatraReason:jn.reason,
    swissVsJplTithiAtSunrise:obs.sunriseTithiIndex!==jplDawn(date,"jpl-tithi-swiss-nakshatra").sunriseIndex,
    swissVsJplTithiAtArunodaya:obs.arunodayaTithiIndex!==jplDawn(date,"jpl-tithi-swiss-nakshatra").arunodayaIndex,
    swissVsJplNakshatraAtSunrise:obs.sunriseNakshatraIndex!==jplDawn(date,"jpl-tithi-jpl-nakshatra").nakshatraIndex,
    independentResearchReason:classifier.reason,independentSunriseTithiIndex:obs.sunriseTithiIndex,
    independentArunodayaTithiIndex:obs.arunodayaTithiIndex,
    independentSunriseUtcMs:obs.sunriseUtcMs,independentArunodayaUtcMs:obs.arunodayaUtcMs,
    independentSunriseNakshatraIndex:obs.sunriseNakshatraIndex,
    sunriseNakshatraBoundaryMinutes:obs.sunriseNakshatraBoundaryMinutes,
    independentFiveMinuteSensitivity:obs.fiveMinuteTithiSensitivity,
    boundarySensitiveResearchCase:boundarySensitive,
    independentResearchAmbiguities:classifier.researchAmbiguities,
    independentlyScreenedFast:screen.tentativeFastEligibility,
    mismatch:expected!==Boolean(classifier.fastCandidates.iskcon===date),
    subtype:classifier.kind,nakshatraSubtype:classifier.nakshatraSubtype,sourceSubtype:sourceType,subtypeMatch:sameSourceKind,
    normalParanaMethodComparable:normalMethodPair,paranaMethodProvenance:"independent-classifier",
    researchDawnSequence:(expected!==Boolean(classifier.fastCandidates.iskcon===date)||!!sourceType&&!sameSourceKind||!!classifier.kind&&!sourceType)?days:null,
    gcalParana:referenceParana,calculatedParana:computedParana,
    startResidualMinutes:residualStart,endResidualMinutes:residualEnd,
    oneSidedAfterResidualMinutes:afterOnlyResidual,
    certified:false});
  }catch(e){failures.push(record.city+"/"+record.year+"/"+date+": "+String(e));}
 }
 results.push({city:record.city,year:record.year,sourceEkadashiFasts:fastDays.size,
   unrelatedSourceFastsExcluded:unrelated,sourceParanaEvents:record.parana.length,
   sourceMahadvadashiEvents:record.mahadvadasi.length,observations:rows.length,
   mismatchedCandidates:rows.filter(x=>x.mismatch&&x.standardProbe).length,
   newProbeSwissMismatches:rows.filter(x=>x.mismatch&&!x.standardProbe).length,
   jplTithiOnlyMismatches:rows.filter(x=>x.jplTithiOnlyMismatch).length,
   jplWithNakshatraMismatches:rows.filter(x=>x.jplWithNakshatraMismatch).length,
   jplTithiOnlySourceSubtypeMismatches:rows.filter(x=>x.sourceSubtype&&!x.jplTithiOnlySubtypeMatch).length,
   jplTithiOnlyExtraSubtypes:rows.filter(x=>x.jplTithiOnlyKind&&!x.sourceSubtype).length,
   jplWithNakshatraSourceSubtypeMismatches:rows.filter(x=>x.sourceSubtype&&!x.jplWithNakshatraSubtypeMatch).length,
   jplWithNakshatraExtraSubtypes:rows.filter(x=>x.jplWithNakshatraKind&&!x.sourceSubtype).length,
   boundarySensitiveMismatches:rows.filter(x=>x.mismatch&&x.boundarySensitiveResearchCase).length,
   unconfirmedSubtypes:rows.filter(x=>x.sourceSubtype&&x.subtypeMatch!==true).length,
   independentOnlySubtypeCandidates:rows.filter(x=>x.subtype&&!x.sourceSubtype).length,
   pairedParana:rows.filter(x=>x.gcalParana).length,
   comparedParanaStart:rows.filter(x=>x.startResidualMinutes!==null).length,
   verifiedOneSidedAfter:rows.filter(x=>x.oneSidedAfterResidualMinutes!==null).length,
   oneSidedAfterOverFive:rows.filter(x=>x.oneSidedAfterResidualMinutes!==null&&x.oneSidedAfterResidualMinutes>5).length,
   comparedParanaEnd:rows.filter(x=>x.endResidualMinutes!==null).length,
   residualStartOverFive:rows.filter(x=>x.startResidualMinutes!==null&&x.startResidualMinutes>5).length,
   residualEndOverFive:rows.filter(x=>x.endResidualMinutes!==null&&x.endResidualMinutes>5).length,
   rows:rows.filter(x=>x.gcalEkadashiFast||x.mismatch||x.sourceSubtype||
    x.jplTithiOnlyMismatch||x.jplWithNakshatraMismatch||x.jplTithiOnlyKind||x.jplWithNakshatraKind)});
}
const report={status:failures.length?"INCOMPLETE":"FULL_SHARD_JPL_OBSERVANCE_RESEARCH_ONLY",
 ...RESEARCH_OBSERVANCE_RELEASE_GUARD,
 lunarSourceSha256:JPL_V6_ROOTS_ASSET_SHA256,
 siderealCatalogSha256:siderealSource.sourceDigest,
 lahiriAnchorSha256:siderealSource.lahiriAnchorDigest,
 generatedAt:new Date().toISOString(),shard,shards,expectedCityYears:908,
 completedCityYears:results.length,expectedShardCityYears:source.records.filter((r:{city:string;year:number})=>shardFor(r.city,r.year,shards)===shard).length,
 independentlyCertified:false,publicRitualApproval:false,
 methods:{jplVariantTithiOnly:"JPL phase sunrise/Arunodaya and Swiss Lahiri Nakshatra, same structural rules",
  jplVariantWithNakshatra:"JPL Tithi with pinned JPL Moon Nakshatra and Swiss Lahiri anchors; unapproved frame",
  jplParanaRecalculated:false,fast:"Swiss sunrise/Arunodaya provisional structural rules",parana:"Swiss solar rise/set and Dvadashi numerical bounds, first quarter and first third daylight",
    gcal:"pinned original GCal 11 Windows execution, comparison oracle only",
    exclusions:"GCal non-Ekadashi Purnima/Navami/Astami fast records are NOT Ekadashi"},
 totals:{sourceEkadashiFasts:results.reduce((n,x)=>n+x.sourceEkadashiFasts,0),
 unrelatedSourceFastsExcluded:results.reduce((n,x)=>n+x.unrelatedSourceFastsExcluded,0),
 candidateMismatches:results.reduce((n,x)=>n+x.mismatchedCandidates,0),
 newProbeSwissMismatches:results.reduce((n,x)=>n+x.newProbeSwissMismatches,0),
 jplTithiOnlyMismatches:results.reduce((n,x)=>n+x.jplTithiOnlyMismatches,0),
 jplWithNakshatraMismatches:results.reduce((n,x)=>n+x.jplWithNakshatraMismatches,0),
 jplTithiOnlySourceSubtypeMismatches:results.reduce((n,x)=>n+x.jplTithiOnlySourceSubtypeMismatches,0),
 jplTithiOnlyExtraSubtypes:results.reduce((n,x)=>n+x.jplTithiOnlyExtraSubtypes,0),
 jplWithNakshatraSourceSubtypeMismatches:results.reduce((n,x)=>n+x.jplWithNakshatraSourceSubtypeMismatches,0),
 jplWithNakshatraExtraSubtypes:results.reduce((n,x)=>n+x.jplWithNakshatraExtraSubtypes,0),
 boundarySensitiveCandidateMismatches:results.reduce((n,x)=>n+x.boundarySensitiveMismatches,0),
 subtypeMismatches:results.reduce((n,x)=>n+x.unconfirmedSubtypes,0),
 independentOnlySubtypeCandidates:results.reduce((n,x)=>n+x.independentOnlySubtypeCandidates,0),
 paranaStartComparisons:results.reduce((n,x)=>n+x.comparedParanaStart,0),
 verifiedOneSidedAfterComparisons:results.reduce((n,x)=>n+x.verifiedOneSidedAfter,0),
 oneSidedAfterOverFiveMinutes:results.reduce((n,x)=>n+x.oneSidedAfterOverFive,0),
 paranaEndComparisons:results.reduce((n,x)=>n+x.comparedParanaEnd,0),
 paranaStartOverFiveMinutes:results.reduce((n,x)=>n+x.residualStartOverFive,0),
 paranaEndOverFiveMinutes:results.reduce((n,x)=>n+x.residualEndOverFive,0)},
 failures,results
};
mkdirSync("artifacts/jpl-observance-454",{recursive:true});
const path="artifacts/jpl-observance-454/shard-"+String(shard).padStart(2,"0")+".json";
writeFileSync(path,JSON.stringify(report,null,2));
console.log("[454-rules] shard "+shard+"/"+shards+" city-years="+results.length+"/"+report.expectedShardCityYears+
 " gcal-ekadashi="+report.totals.sourceEkadashiFasts+" non-ekadashi-filtered="+report.totals.unrelatedSourceFastsExcluded+
 " candidate-gaps="+report.totals.candidateMismatches+" subtype-gaps="+report.totals.subtypeMismatches+
 " parana-start="+report.totals.paranaStartComparisons+" parana-end="+report.totals.paranaEndComparisons+
 " failures="+failures.length);
if(failures.length||results.length!==report.expectedShardCityYears)process.exitCode=1;
