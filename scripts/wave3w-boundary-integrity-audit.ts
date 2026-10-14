/**
 * Wave 3W: fail-closed cross-family astronomical consistency and publication
 * evidence audit. A city/date Tithi-at-sunrise is not a Vrat/Parana selector.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {cityBySlug} from "../lib/cities";
import {getPanchang} from "../lib/panchang";
import {getPrecomputedMuhuratPanchangMonth} from "../lib/muhurat-precomputed";
import {calculateVratCalendar} from "../lib/vrat";
import {compareVratTimeScales} from "../lib/vrat-ut-et-diagnostic";
import {criticalBoundaryNotice,criticalBoundaryNotices} from "../lib/critical-boundary-notices";
import {MUHURAT_BUILD_DATA_VERSION} from "../lib/muhurat-build-data-schema";

const CHECKS=[
  {city:"delhi",date:"2026-06-30",expected:"Pratipada",context:"Wave3U verified exact UT sunrise Tithi flip"},
  {city:"thane",date:"2026-08-25",expected:"Trayodashi",context:"V5 corrected Tithi name; BDA published day-label support"},
  {city:"kanpur",date:"2026-11-21",expected:"Dwadashi",context:"Minute-disputed sunrise Ekadashi boundary; fast-day differs from raw sunrise Tithi"},
  {city:"bhopal",date:"2026-12-24",expected:"Pratipada",context:"V5 corrected Tithi name; DevPanchang day-label support"},
  {city:"patna",date:"2027-01-31",expected:"Dashami",context:"DevPanchang published local minute data conflicts; needs independent exact-second reconciliation"},
  {city:"kolkata",date:"2027-08-05",expected:"Chaturthi",context:"V5 corrected Tithi name; Drik/LivePanditji day-label support"},
  {city:"lucknow",date:"2027-09-17",expected:"Dvitiya",context:"BDA/Vaya source times rounded at sunrise, second-level classification not independently certified"}
] as const;
const issues:string[]=[];
const output=process.argv.find(x=>x.startsWith("--report="))?.slice(9)||
  "artifacts/wave3w-boundary-evidence-consistency.json";
const results=[];
for(const c of CHECKS){
  const city=cityBySlug(c.city);
  const year=Number(c.date.slice(0,4)),month=Number(c.date.slice(5,7));
  const calculated=await getPanchang(new Date(c.date+"T06:00:00Z"),city);
  const diagnostic=compareVratTimeScales(city,c.date);
  const cached=await getPrecomputedMuhuratPanchangMonth(year,month,city);
  const fromSnapshot=cached?.find(r=>r.date===c.date)??null;
  const risk=criticalBoundaryNotice(c.city,c.date);
  const rawTarget=calculated.tithi==="Purnima"?"purnima":
    calculated.tithi==="Amavasya"?"amavasya":
    calculated.tithi==="Ekadashi"?"ekadashi":null;
  const vratTestTargets=(["purnima","amavasya","ekadashi"] as const);
  const presentInVrat=vratTestTargets.filter(target=>
    calculateVratCalendar(target,year,city).some(row=>row.date===c.date));
  const expectedVrat=rawTarget?[rawTarget]:[];
  const mismatch=calculated.tithi!==c.expected||
    calculated.date!==c.date||!Number.isFinite(diagnostic.sunriseUtJd)||
    MUHURAT_BUILD_DATA_VERSION!==5||
    (fromSnapshot!==null&&(fromSnapshot.tithi!==calculated.tithi||
      fromSnapshot.tithiEnd!==calculated.tithiEnd||
      fromSnapshot.nakshatra!==calculated.nakshatra||
      fromSnapshot.karana!==calculated.karana))||
    JSON.stringify(presentInVrat)!==JSON.stringify(expectedVrat);
  if(mismatch)issues.push(c.city+"/"+c.date+" Panchang/Vrat/V5 mismatch");
  const note=c.context;
  const record={
    ...c,fromProductionPanchang:calculated.tithi,paksha:calculated.paksha,
    sunrise:calculated.sunrise,transitionTime:calculated.tithiEnd,
    transitionDate:calculated.tithiEndDate,
    exactUtLastBoundarySecondsBeforeSunrise:diagnostic.utLastTransitionSecondsBeforeSunrise,
    exactUtNextBoundarySecondsAfterSunrise:diagnostic.utNextTransitionSecondsAfterSunrise,
    closestExactBoundarySeconds:diagnostic.closestUtBoundaryDistanceSeconds,
    nearSunriseWith5Min:diagnostic.withinFiveMinutesOfUtBoundary,
    changedByLegacyTimeScale:diagnostic.localDateSelectionPotentiallyChanges,
    inCommittedV5Snapshot:fromSnapshot!==null,
    V5SnapshotMatchesLivePanchang:fromSnapshot===null?null:
      fromSnapshot.tithi===calculated.tithi&&fromSnapshot.tithiEnd===calculated.tithiEnd,
    actualVratSunriseRows:presentInVrat,expectedVratSunriseRows:expectedVrat,
    sourceReviewFlag:boolToStatus(risk!==null),
    independentSecondResolutionOfPublishedSunrise:null,
    independentPublisherAlgorithmAgreementEstablished:false,
    ritualVratOrParanaCertified:false,
    reviewedPrimaryIssue:note
  };
  results.push(record);
  console.log("[3w-boundary] "+c.city+" "+c.date+
    " Tithi="+calculated.tithi+" secondsToBoundary="+
    diagnostic.closestUtBoundaryDistanceSeconds+" cached="+Boolean(fromSnapshot)+
    " sourceCaution="+Boolean(risk)+" diff="+mismatch);
}
function boolToStatus(v:boolean){return v?"publisher-review-notice-live":"source-review-no-warning" as const}
const errors=criticalBoundaryNotices.filter(n=>
  !CHECKS.some(x=>x.city===n.city&&x.date===n.date)||
  n.mathematicalCalculationChanged!==false||n.fastOrCeremonyDateCertified!==false||
  n.evidence.some(e=>!e.url.startsWith("https://")||!e.publisher));
for(const bad of errors)issues.push("Invalid curated source warning "+bad.city+"/"+bad.date);
const report={
  executedAt:new Date().toISOString(),wave:"3W",
  status:"UT-CORRECT-CROSS-FAMILY-VALIDATED-COMPUTATION-EXTERNAL-RITUAL-UNVERIFIED",
  targets:CHECKS.length,publicationWarningDates:criticalBoundaryNotices.length,
  shardVersion:MUHURAT_BUILD_DATA_VERSION,
  scope:"Seven preselected post-V5 sensitive city/date records, not a complete India-wide accuracy census.",
  verifiedComputationalConsistency:issues.length===0,
  independentlyCertifiedAllCalendarDates:false,
  religionOrVratConventionVerified:false,
  publisherMethodMatchingVerified:false,
  sourceRetrievalType:"manual reviewed source-page snapshots; no live third-party collection in CI",
  records:results,errors:issues
};
mkdirSync("artifacts",{recursive:true});
writeFileSync(output,JSON.stringify(report,null,2)+"\n");
console.log("[3w-boundary] cases="+CHECKS.length+" warnings="+criticalBoundaryNotices.length+
  " failure="+issues.length+" V5="+MUHURAT_BUILD_DATA_VERSION);
if(issues.length)process.exitCode=1;
