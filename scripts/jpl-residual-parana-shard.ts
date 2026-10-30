/**
 * Research-only independent source audit of PR #157 JPL-Tithi/Swiss-Nakshatra.
 * Per-shard run: strict repeat of source event data, exact JPL 12-degree
 * boundary diagnostics, real JPL Dvadasi / Trayodasi Parana numerical clocks.
 * This is NOT a publication or religious-certification step.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {dirname} from "node:path";
import {findCityBySlug} from "../lib/cities";
import {getPinnedV6HalfTithiTable,JPL_V6_ROOTS_ASSET_SHA256} from "../lib/jpl-v6-pinned-data";
import {jplHalfTithiAtMs} from "../lib/jpl-v6-tithi-karana-canary";
import {nearestJplTithiBoundaryMs} from "../lib/jpl-observance-research";
import {getJplResearchParanaAstronomy,JPL_PARANA_RESEARCH_GUARD} from "../lib/jpl-parana-astronomy";
import {calculateIndependentParana,researchParanaMethodFromIndependentKind,minutesBetween} from "../lib/independent-parana";
import {identifySourceMahadvadashi,identifySourceNakshatra} from "../lib/independent-mahadvadashi";
import {addIsoDays} from "../lib/india-time";
const check=(v:boolean,msg:string)=>{if(!v)throw Error("JPL residual Parana science: "+msg)};
const argv=(key:string)=>process.argv.find(x=>x.startsWith("--"+key+"="))?.slice(key.length+3);
const path=argv("input"),output=argv("output");
check(Boolean(path&&output),"Provide exact original JPL research --input and independent --output");
const source=JSON.parse(readFileSync(path!,"utf8"));
check(source.status==="FULL_SHARD_JPL_OBSERVANCE_RESEARCH_ONLY"&&
 source.independentlyCertified===false&&source.publicRitualApproval===false&&
 source.lunarSourceSha256==="0cab0c6accaf2e2125fe417bf4a4f14a22453a4013a1609dce6dce84ec44142e"&&
 source.shards===16&&source.completedCityYears===source.expectedShardCityYears&&
 !source.failures?.length,"invalid 908-city-year original JPL observance baseline shard");
const table=getPinnedV6HalfTithiTable();
check(JPL_V6_ROOTS_ASSET_SHA256===source.lunarSourceSha256&&
 table.halfTithiBoundaryCount===4512&&table.ritualSelectionCertified===false,
 "JPL source changed");
const tithiAt=(at:number)=>jplHalfTithiAtMs(table,Math.round(at)).tithiIndex;
const safeMin=(n:number)=>Math.round(n/1000)/60;
const localKey=(city:string,year:number,date:string)=>city+"/"+year+"/"+date;
const records=[],residuals=[],clusters=new Map<string,{date:string;fast:number;subtypes:number;cities:Set<string>}>(),
 counters={sourceParana:0,jplCandidatesOnGcalFast:0,sourceMethodComparable:0,
  startPairs:0,endPairs:0,afterOnlyPairs:0,sourceAfterOnly:0,
  jplStartOverFive:0,jplEndOverFive:0,jplAfterOverFive:0,
  sourceSubtypeIncomparable:0,jplFastDisagreement:0,missingJplPhysicalBounds:0,
  specialRulePending:0,missingSourceClock:0,previouslyCorrectParanaWorseThanFive:0,
  sourceDateMismatches:0,sourceSubtypeDisagreements:0};
for(const cy of source.results){
 const city=findCityBySlug(cy.city);
 check(!!city&&[2026,2027].includes(cy.year),"Unverifiable independent source city-year");
 for(const r of cy.rows){
  const dateMismatch=r.jplTithiOnlyMismatch===true;
  const subtypeMismatch=Boolean((r.sourceSubtype&&!r.jplTithiOnlySubtypeMatch)||
   (r.jplTithiOnlyKind&&!r.sourceSubtype));
  if(dateMismatch||subtypeMismatch){
   counters.sourceDateMismatches+=Number(dateMismatch);
   counters.sourceSubtypeDisagreements+=Number(subtypeMismatch);
   const cluster=clusters.get(r.date)??{date:r.date,fast:0,subtypes:0,cities:new Set<string>()};
   cluster.fast+=Number(dateMismatch);cluster.subtypes+=Number(subtypeMismatch);
   cluster.cities.add(cy.city);clusters.set(r.date,cluster);
   const dawn=r.researchDawnSequence;
   check(Array.isArray(dawn)&&dawn.length===10,"No independent 10-day sequence for unresolved case "+localKey(cy.city,cy.year,r.date));
   const previous=dawn.find((x:{date:string})=>x.date===addIsoDays(r.date,-1));
   const current=dawn.find((x:{date:string})=>x.date===r.date);
   const next=dawn.find((x:{date:string})=>x.date===addIsoDays(r.date,1));
   check(Boolean(previous&&current&&next),"Incomplete research sunrise sequence "+cy.city+"/"+r.date);
   const sample=(x:{date:string;independentSunriseUtcMs:number;independentArunodayaUtcMs:number;nakshatraIndex?:number})=>{
    const rise=x.independentSunriseUtcMs,aru=x.independentArunodayaUtcMs;
    check(Number.isFinite(rise)&&Number.isFinite(aru),"Nonphysical independent dawn timestamp");
    const atRise=jplHalfTithiAtMs(table,Math.round(rise));
    const atDawn=jplHalfTithiAtMs(table,Math.round(aru));
    return {date:x.date,jplSunriseTithi:atRise.tithiIndex,jplArunodayaTithi:atDawn.tithiIndex,
     swissNakshatraIndex:x.nakshatraIndex??null,
     nextJplTithiRootUtc:atRise.nextTithiBoundaryUtc,
     sunriseDistanceToNearestJplTithiRootMinutes:safeMin(nearestJplTithiBoundaryMs(table,rise)),
     arunodayaDistanceToNearestJplTithiRootMinutes:safeMin(nearestJplTithiBoundaryMs(table,aru))};
   };
   const p=sample(previous),c=sample(current),n=sample(next);
   const unmilani=r.date==="2027-03-04"&&r.jplTithiOnlyKind==="UNMILANI"&&!r.sourceSubtype;
   const vijaya=r.date==="2027-09-12"&&
    r.jplTithiOnlyNakshatraSubtype==="VIJAYA"&&!r.sourceSubtype;
   residuals.push({city:cy.city,year:cy.year,date:r.date,
    sourceFast:r.gcalEkadashiFast,sourceSubtype:r.sourceSubtype,
    jplIndependentFast:r.jplTithiOnlyCandidate,jplKind:r.jplTithiOnlyKind,
    jplNakshatraSubtype:r.jplTithiOnlyNakshatraSubtype,
    independentRuleReason:r.jplTithiOnlyReason,
    dateMismatch,subtypeMismatch,
    jplSunriseTithiChangedRelativeToSwiss:r.swissVsJplTithiAtSunrise,
    jplArunodayaTithiChangedRelativeToSwiss:r.swissVsJplTithiAtArunodaya,
    preceding:p,current:c,following:n,
    exactJplTithiWindow:dawn.map(sample),
    needsIndependentTraditionRules:true,
    unmilani20270304:unmilani,vijaya20270912:vijaya,
    unmilaniCheck:unmilani?{
     previousSunriseEkadashi:p.jplSunriseTithi%15===10,
     previousArunodayaEkadashi:p.jplArunodayaTithi%15===10,
     currentSunriseEkadashi:c.jplSunriseTithi%15===10,
     independentlyObservedRepeatedCleanEkadashi:
      p.jplSunriseTithi%15===10&&p.jplArunodayaTithi%15===10&&c.jplSunriseTithi%15===10}:null,
    vijayaCheck:vijaya?{
     currentSwissNakshatra:c.swissNakshatraIndex,
     followingSwissNakshatra:n.swissNakshatraIndex,
     sameSwissNakshatraOnTwoSunrises:c.swissNakshatraIndex===n.swissNakshatraIndex,
     requiresIndependentLahiriNakshatraTransitionProof:true}:null,
    researchOnly:true});
  }
  if(!r.gcalEkadashiFast)continue;
  counters.sourceParana++;
  const p=r.gcalParana;
  if(!p){counters.missingSourceClock++;continue;}
  if(p.after&&!p.from&&!p.to)counters.sourceAfterOnly++;
  if(r.jplTithiOnlyCandidate!==r.date){counters.jplFastDisagreement++;continue;}
  counters.jplCandidatesOnGcalFast++;
  const sourceKind=r.sourceSubtype?identifySourceMahadvadashi(r.sourceSubtype):null;
  const sourceComparable=sourceKind===null?r.jplTithiOnlyKind===null:
   sourceKind==="NAKSHATRA_REVIEW"?r.jplTithiOnlyKind===sourceKind&&
    r.jplTithiOnlyNakshatraSubtype===identifySourceNakshatra(r.sourceSubtype):
   r.jplTithiOnlyKind===sourceKind;
  if(!sourceComparable){counters.sourceSubtypeIncomparable++;continue;}
  counters.sourceMethodComparable++;
  const paraDate=addIsoDays(r.date,1);
  const inputs=getJplResearchParanaAstronomy(city!,r.date,paraDate,table,r.jplTithiOnlyNakshatraSubtype);
  if(!inputs){counters.missingJplPhysicalBounds++;continue;}
  const fastTithi=tithiAt(r.independentSunriseUtcMs);
  const paraTithi=tithiAt(inputs.sunrise);
  const method=researchParanaMethodFromIndependentKind(r.jplTithiOnlyKind,fastTithi,paraTithi);
  const computed=calculateIndependentParana({...inputs,method,nakshatraSubtype:r.jplTithiOnlyNakshatraSubtype});
  if(computed.status!=="calculated-research-only"){counters.specialRulePending++;continue;}
  const a=computed.from&&p.from?minutesBetween(computed.from,p.from):null;
  const b=computed.to&&p.to?minutesBetween(computed.to,p.to):null;
  const open=computed.from&&p.after&&!p.from&&!p.to?
   minutesBetween(computed.from,p.after):null;
  if(a!==null){counters.startPairs++;if(a>5)counters.jplStartOverFive++;}
  if(b!==null){counters.endPairs++;if(b>5)counters.jplEndOverFive++;}
  if(open!==null){counters.afterOnlyPairs++;if(open>5)counters.jplAfterOverFive++;}
  const oldGood=r.startResidualMinutes!==null&&r.endResidualMinutes!==null&&
   r.startResidualMinutes<=5&&r.endResidualMinutes<=5;
  if(oldGood&&(a===null||b===null||a>5||b>5))
   counters.previouslyCorrectParanaWorseThanFive++;
  records.push({city:cy.city,date:r.date,paranaDate:paraDate,
   sourceMethod:r.sourceSubtype??"ordinary",
   independentJplKind:r.jplTithiOnlyKind,
   jplPhysicalDwadashiStartUtc:new Date(inputs.dwadashiStart!).toISOString(),
   jplPhysicalDwadashiEndUtc:new Date(inputs.dwadashiEnd!).toISOString(),
   swissSolarRiseUtc:new Date(inputs.sunrise).toISOString(),
   proposedFromUtc:computed.from?new Date(computed.from).toISOString():null,
   proposedToUtc:computed.to?new Date(computed.to).toISOString():null,
   originalReferenceFrom:p.from||null,originalReferenceTo:p.to||null,
   originalReferenceAfter:p.after||null,
   fromAbsResidualMinutes:a,toAbsResidualMinutes:b,
   afterOnlyAbsResidualMinutes:open,
   previouslyComparableSwissFromMinutes:r.startResidualMinutes,
   previouslyComparableSwissToMinutes:r.endResidualMinutes,
   independentRuleMethod:method,sourceIsComparisonOnly:true,certified:false});
 }
}
const result={status:"JPL_REMAINING_GAPS_AND_PARANA_RESEARCH_ONLY",
 shard:source.shard,shards:16,completedCityYears:source.completedCityYears,
 sourceJplRootSHA256:source.lunarSourceSha256,
 sourceGcalExecutableGitBlob:"1d20f6e0caf29b6293157d258d02287e4edf0481",
 ...JPL_PARANA_RESEARCH_GUARD,
 totals:counters,
 residuals,clusters:[...clusters.values()].map(x=>({...x,cities:[...x.cities].sort()})),
 pairedNumericParana:records,
 note:"JPL Tithi plus Swiss sunrise / Swiss Lahiri Nakshatra. GCal is an oracle only; no independent ritual validation, no authority to publish."};
mkdirSync(dirname(output!),{recursive:true});writeFileSync(output!,JSON.stringify(result)+"\n");
console.log("[JPL residual physical + Parana]",JSON.stringify({shard:source.shard,totals:counters,
 residuals:residuals.length}));
