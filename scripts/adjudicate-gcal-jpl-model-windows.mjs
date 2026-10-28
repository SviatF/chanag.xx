/**
 * Case-level scientific attribution, not a ritual date selector.
 * Which *observed* Tithi model agreement occurs in the -2/+9 day window
 * preceding/following each fasting or Mahadvadashi source disagreement?
 * No GCal output is fed into the independent Swiss/JPL computation.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {dirname} from "node:path";
const same=(a:number,b:number)=>Number.isInteger(a)&&Number.isInteger(b)&&a===b;
const assert=(v:boolean,msg:string)=>{if(!v)throw Error("GCal/JPL case triage: "+msg)};
const dayMs=86400000;
const key=(city:string,year:number,date:string)=>city+"/"+year+"/"+date;
export function adjudicateGcalJplModelWindows(data:any,expected=172){
 assert(data?.status==="GCAL_JPL_DE440S_SWISS_TITHI_RESEARCH_DIAGNOSED"&&
  data.publicRitualApproval===false&&data.independentlyCertified===false&&
  data.coverage?.caseRows===expected,"invalid original three-model science-only source");
 const rows=new Map<string,any>();
 for(const r of data.everyMatchedRawGcalDawnRow){
  const k=key(r.city,r.year,r.date);
  assert(!rows.has(k),"duplicate original-source datum "+k);rows.set(k,r);
 }
 const cases=[],totals:Record<string,number>={},typeCounts:Record<string,Record<string,number>>={fast:{},subtype:{},both:{}};
 let verifiedFast=0,verifiedSubtype=0,partiallyObserved=0;
 for(const target of data.disputedEventRows){
  const base=Date.parse(target.date+"T00:00:00Z");
  assert(Number.isFinite(base),"invalid original discrepancy date");
  const evidence=[];
  const observations=[];
  for(let day=-2;day<=9;day++){
   const civil=new Date(base+day*dayMs).toISOString().slice(0,10);
   const rec=rows.get(key(target.city,target.year,civil));
   if(!rec)continue;
   observations.push(rec);
   if(rec.sunriseThreeWayAgreement!=="ALL_AGREE"){
    evidence.push({dayOffset:day,date:civil,
     category:rec.sunriseThreeWayAgreement,
     sourceGcalTithiIndex:rec.sourceGcalTithiIndex,
     jplTithiIndex:rec.jplAtOriginalGcalSunriseIndex,
     swissTithiIndex:rec.swissAtOriginalGcalSunriseIndex,
     nearestJplPhysicalTithiRootUtc:rec.nearestRealJplTithiBoundaryUtc,
     jplBoundarySecondsFromOriginalGcalSunrise:rec.nearestJplBoundarySignedSecondsFromGcalSunrise,
     swissVsJplExactTithiRoot:rec.swissVsJplExactTithiRoot});
   }
  }
  assert(observations.length>0,"original source window entirely missing "+target.city+"/"+target.date);
  const types=new Set(evidence.map(x=>x.category));
  const category=types.size===0?"NO_OBSERVED_TITHI_MODEL_CONFLICT_CHECK_RITUAL_OR_NAKSHATRA":
   types.size>1?"MULTIPLE_DIFFERENT_TITHI_MODEL_CONFLICTS":
    types.has("GCAL_AND_JPL_AGREE_SWISS_DIFFERS")?"JPL_MATCHES_GCAL_SWISS_DIVERGES":
    types.has("SWISS_AND_JPL_AGREE_GCAL_DIFFERS")?"JPL_MATCHES_SWISS_GCAL_DIVERGES":
    types.has("GCAL_AND_SWISS_AGREE_JPL_DIFFERS")?"JPL_DIFFERS_FROM_GCAL_AND_SWISS":
    "UNCLASSIFIED_PHYSICAL_MODEL_CONFLICT";
  totals[category]=(totals[category]??0)+1;
  const fast=target.fastDateMismatch===true,subtype=target.subtypeDisagreement===true;
  assert(fast||subtype,"case without actual original GCal discrepancy "+target.city+"/"+target.date);
  if(fast){verifiedFast++;typeCounts.fast[category]=(typeCounts.fast[category]??0)+1;}
  if(subtype){verifiedSubtype++;typeCounts.subtype[category]=(typeCounts.subtype[category]??0)+1;}
  if(fast&&subtype)typeCounts.both[category]=(typeCounts.both[category]??0)+1;
  if(observations.length!==12)partiallyObserved++;
  cases.push({city:target.city,year:target.year,date:target.date,fastDateMismatch:fast,
   subtypeDisagreement:subtype,originalSubtype:target.sourceSubtype,
   independentlyPredictedSubtype:target.independentSubtype,
   category,observedDays:observations.length,fullMinus2Plus9WindowCovered:observations.length===12,
   modelDiscordanceDays:evidence.length,modelDiscordanceEvidence:evidence,
   independentApproval:false,traditionRulesValidated:false,
   causalityProven:false});
 }
 assert(cases.length===expected&&
  (expected!==172||(verifiedFast===128&&verifiedSubtype===104)),
  "GCal 128 fasting / 104 bidirectional subtype case census incomplete");
 return {status:"GCAL_JPL_SCIENTIFIC_CASE_CAUSES_TRIAGED_NOT_CERTIFIED",
  sourceOriginalGcalGitBlob:data.originalGcalExecutableGitBlob,
  sourceJplKernelSha256:data.jpl.kernelSha256,
  coverage:{disputedCases:cases.length,fastDateDisagreements:verifiedFast,
   bidirectionalSubtypeDisagreements:verifiedSubtype,
   sourceDaysCompared:data.coverage.sameInstantRows,
   windowsMissingOneOrMoreDays:partiallyObserved},
  causeEvidenceByCategory:totals,byEventType:typeCounts,
  strictInterpretation:{
   jplAgreementIsPhysicalEvidenceNotRitualAuthority:true,
   originalGcalSourceDoesNotProvideFullMoonSunTransitionTrace:true,
   aDisagreementAnywhereInWindowDoesNotProveCausation:true,
   noObservedTithiConflictDoesNotExcludeNakshatraOrTraditionRuleFault:true,
   noPublicFastingOrParanaChangesAuthorized:true},
  independentlyCertified:false,publicRitualApproval:false,
  individualCaseEvidence:cases.sort((a,b)=>a.date.localeCompare(b.date)||a.city.localeCompare(b.city))};
}
if(process.argv[1]?.endsWith("adjudicate-gcal-jpl-model-windows.mjs")){
 const [source,out]=process.argv.slice(2);
 assert(!!source&&!!out,"usage: node adjudicate-gcal-jpl-model-windows.mjs SOURCE OUT");
 const result=adjudicateGcalJplModelWindows(JSON.parse(readFileSync(source,"utf8")));
 mkdirSync(dirname(out),{recursive:true});
 writeFileSync(out,JSON.stringify(result,null,2)+"\n");
 console.log("[GCal JPL 172 original cases]",JSON.stringify({
  coverage:result.coverage,categories:result.causeEvidenceByCategory,byType:result.byEventType}));
}
