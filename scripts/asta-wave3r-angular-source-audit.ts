/**
 * Wave 3R — compare independently *published* fixed-angle references.
 * Publication provenance != proof of independent calculation code.
 * Keeps minute-only worldwide angular conventions OUT of locality-pinned
 * observer Asta and production ritual results.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {
  angularSourceErrors,comparePublishedAngularFamily,temporalGapFromAngularToLocalSnapshot
} from "../lib/asta-global-angular-evidence";
import {globalAngularEvidence} from "../tests/fixtures/asta-global-angular-evidence";
import {astaEvidenceLedger} from "../tests/fixtures/asta-evidence-ledger";

const out=process.argv.find(x=>x.startsWith("--report="))?.slice(9)||
  "artifacts/asta-wave3r-independent-angular-sources.json";
const problems=globalAngularEvidence.flatMap((source,index)=>
  angularSourceErrors(source).map(issue=>({index,publisher:source.publisher,issue})));
const comparisons=(["Jupiter","Venus"] as const).flatMap(planet=>
  [2025,2026,2027].map(year=>
    comparePublishedAngularFamily(globalAngularEvidence,planet,year)
  )
);
const globalJupiter2027=globalAngularEvidence.find(x=>x.planet==="Jupiter"&&x.year===2027&&x.publisher==="VedicMarga")!;
const observedMumbaiJupiter2027=astaEvidenceLedger.find(x=>x.planet==="Jupiter"&&x.year===2027&&x.locality==="Mumbai, Maharashtra")!;
const crossMethodMumbai=temporalGapFromAngularToLocalSnapshot(globalJupiter2027,observedMumbaiJupiter2027);
const angularAgreement=comparisons.filter(c=>c.status==="fixed-angle-published-minute-agreement");
const angularDisagreement=comparisons.filter(c=>c.status==="fixed-angle-minute-disagreement");
const dateOnly=comparisons.filter(c=>c.status==="date-only-publisher-agreement");
const report={
  reviewedOn:"2026-10-13",wave:"3R",
  status:"RESEARCH-ONLY-FIXED-ANGLE-PUBLICATIONS-NOT-OBSERVER-CERTIFIED",
  safeForCeremonyFiltering:false,
  validatedLocalObserverAstaCount:0,
  independentlyAuditedComputationCount:0,
  sourceRecords:globalAngularEvidence.length,
  assessedPlanetYears:comparisons.length,
  invalidRecords:problems,
  publishedMinuteAgreementPairs:angularAgreement.length,
  publishedMinuteDisagreementPairs:angularDisagreement.length,
  dayOnlyPublicationAgreementPairs:dateOnly.length,
  independentPublisherDomainDoesNotProveIndependentEphemeris:true,
  methodFamily:"fixed-angular-threshold",
  confirmedTimezoneOffsetMinutes:{NPT:345,IST:330,difference:15},
  comparisons,
  crossMethodComparisonMumbai2027:crossMethodMumbai,
  caveats:[
    "A Drik observer-dependent Asta transition and fixed-angular geocentric combustion are NOT the same method. Difference in dates is not automatically a publisher data error.",
    "VedicMarga publishes fixed-angular references in Nepal Time (+05:45) for its transit computations. The city-labeled Swarn Siddhi reference uses India Time (+05:30), so convert instants before comparing.",
    "Publisher domains are distinct, but method/data pipeline independence has NOT been established. A close fit is reproducible published-family corroboration, not two audited independent astronomical algorithms.",
    "Day-only 2027 Swarn Siddhi entries cannot independently establish minute-level agreement for VedicMarga Guru or Shukra 2027.",
    "Comparing nonlocal angular references with city-local Drik Mumbai can reveal a cross-method numerical gap, but does not certify either for wedding/Griha Pravesh.",
    "Nothing in this research ledger adds or changes ceremony exclusion dates, indexation policy, SEO city pages, or precomputed Panchang."
  ]
};
mkdirSync("artifacts",{recursive:true});
writeFileSync(out,JSON.stringify(report,null,2)+"\n");
console.log("[asta-3r] sources="+report.sourceRecords+
  " planetYears="+report.assessedPlanetYears+
  " minutePublicationAgreements="+report.publishedMinuteAgreementPairs+
  " dayOnlyAgreements="+report.dayOnlyPublicationAgreementPairs+
  " invalid="+problems.length);
for(const match of comparisons.filter(c=>c.distinctPublisherDomainCount>1)){
  console.log("[asta-3r] "+match.planet+" "+match.year+
    " result="+match.status+" startSpread="+match.startSpreadMinutes+
    " endSpread="+match.endSpreadMinutes);
}
console.log("[asta-3r] Mumbai 2027 Jupiter angular-vs-observer START gap="+
  crossMethodMumbai?.startGapMinutes+"m END gap="+crossMethodMumbai?.endGapMinutes+"m — NOT method validation");
console.log("[asta-3r] NON-PRODUCTION fixed-angle publication corroboration only: "+out);
if(problems.length||angularAgreement.length!==1||angularDisagreement.length||
   report.validatedLocalObserverAstaCount!==0||
   crossMethodMumbai?.comparison!=="cross-method-time-gap-not-local-validation"||
   comparisons.some(c=>c.safeForCeremonyFiltering||c.independentCityObserverVerified))
  process.exitCode=1;
