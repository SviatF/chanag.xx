/**
 * Wave 3Q — reconciliation from committed research inputs created by 3O/3P.
 *
 * No calibrated dates are fed to the published Muhurat engine.
 * The signed differences below measure temporal proximity only; the published
 * Drik observer-aware Asta algorithm is not specified as Swiss heliacal.
 */
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {reconcileAstaScenarios,type AstaNativeRecord} from "../lib/asta-uncertainty-audit";
import {astaEvidenceLedger} from "../tests/fixtures/asta-evidence-ledger";

const nativeFile=process.argv.find(s=>s.startsWith("--native="))?.slice(9)||
  "artifacts/asta-heliacal-deep.json";
const angularFile=process.argv.find(s=>s.startsWith("--angular="))?.slice(10)||
  "artifacts/asta-observer-model-comparison.json";
const outFile=process.argv.find(s=>s.startsWith("--report="))?.slice(9)||
  "artifacts/asta-wave3q-uncertainty-crosswalk.json";
type NativeReport={
  safeForCeremonyFiltering:boolean;
  heliacalSearchCount:number;nativeHeliacalResults:AstaNativeRecord[];
};
type AngularReport={safeForCeremonyFiltering:boolean;cases:Array<{
  locality:string;planet:string;referenceMethod:string;
  sourceLocationMode:string;models?:Array<{
    model:string;enterResidualMinutes?:number|null;exitResidualMinutes?:number|null;
    methodVerifiedAgainstIndependentObserverSources?:boolean
  }>
}>};
const native=JSON.parse(readFileSync(nativeFile,"utf8")) as NativeReport;
const angular=JSON.parse(readFileSync(angularFile,"utf8")) as AngularReport;
if(native.safeForCeremonyFiltering!==false||angular.safeForCeremonyFiltering!==false||
  !Array.isArray(native.nativeHeliacalResults)||!Array.isArray(angular.cases))
  throw Error("Wave 3Q needs an explicit research-only input schema");
const nativeResults=native.nativeHeliacalResults;
const targets=new Map<string,{planet:"Jupiter"|"Venus";year:number;locality:string}>();
const add=(planet:"Jupiter"|"Venus",year:number,locality:string)=>{
  targets.set([planet,year,locality].join("|"),{planet,year,locality});
};
for(const source of astaEvidenceLedger)add(source.planet,source.year,source.locality);
for(const event of nativeResults){
  // Target year refers to the search run's explicit *requested* year; avoid
  // interpreting a 2028 returned Venus event as evidence for year 2028.
  if(event.planet==="Jupiter"||event.planet==="Venus")add(event.planet,2027,event.locality);
}
const comparisons=[...targets.values()].map(t=>
  reconcileAstaScenarios(t.planet,t.year,t.locality,nativeResults,astaEvidenceLedger)
);
const angularDiagnostics=angular.cases.map(r=>({
  locality:r.locality,planet:r.planet,
  publisherMethod:r.referenceMethod,publisherLocationMode:r.sourceLocationMode,
  sourceVsAngularCrosswalk:
    r.referenceMethod==="fixed-angular-threshold"?
      "geometric-family-may-be-relevant-but-exact-angle-convention-not-validated":
      "NOT-COMPARABLE-WITH-OBSERVER-SENSITIVE-ASTA",
  modelFullyMatchesPublisherAlgorithm:false,
  comparisons:(r.models??[]).map(m=>({
    model:m.model,temporalStartOffsetMinutes:m.enterResidualMinutes??null,
    temporalEndOffsetMinutes:m.exitResidualMinutes??null,
    notPhysicalObservability:true,
    methodIndependentlyValidated:false
  }))
}));
const methodTaxonomy=[
  {method:"surya-siddhanta-fixed-angle",event:"solar-angular-threshold",
    localObserverSensitive:false,publisherCompatibility:"possible-by-declared-class-only",
    automaticCeremonyEligibility:false},
  {method:"swiss-geocentric-spherical-or-ecliptic",event:"geometric-angular-cutoff",
    localObserverSensitive:false,publisherCompatibility:"requires-exact-coordinate-and-threshold-agreement",
    automaticCeremonyEligibility:false},
  {method:"swiss-topocentric-spherical",event:"observer-angular-cutoff-not-naked-eye-visibility",
    localObserverSensitive:true,publisherCompatibility:"NOT-ESTABLISHED",
    automaticCeremonyEligibility:false},
  {method:"swiss-native-heliacal",event:"visibility-evening-last-and-morning-first",
    localObserverSensitive:true,publisherCompatibility:"NOT-ESTABLISHED",
    automaticCeremonyEligibility:false},
  {method:"drik-location-specific-asta",event:"publisher-local-asta-and-udaya",
    localObserverSensitive:true,publisherCompatibility:"undisclosed-mapping-to-swiss",
    automaticCeremonyEligibility:false}
];
const statuses=comparisons.reduce<Record<string,number>>((s,x)=>{
  s[x.status]=(s[x.status]??0)+1;return s;
},{});
const uncertain=comparisons.filter(x=>x.scenarioSensitivity!==null);
const report={
  createdAt:new Date().toISOString(),wave:"3Q",
  releaseStatus:"RESEARCH-ONLY-SOURCE-EQUIVALENCE-UNVERIFIED",
  safeForCeremonyFiltering:false,
  methodCrosswalkVerified:false,
  isConfidenceInterval:false,
  provenance:{angularFile,nativeFile,
    publishedReferenceCount:astaEvidenceLedger.length,
    nativeEventCount:native.heliacalSearchCount},
  methodTaxonomy,targets:comparisons.length,
  comparisonStatuses:statuses,
  scenarioEnvelopeGroups:uncertain.length,
  modelsApprovedForWedding:0,
  incompleteSourceMethodology:true,
  comparisons,angularDiagnostics,
  interpretation:[
    "Drik modern location-based Asta timings do not disclose a reproducible Swiss heliacal event mapping; do not treat temporal offsets as method agreement.",
    "Swiss native heliacal events are model-dependent and can be returned for a later year; 2028 Venus returns are rejected from 2027 comparison.",
    "A sampled clear/hazy spread is NOT a statistical confidence interval or bounds on real atmospheric uncertainty; no live local weather/topographic horizon.",
    "A fixed-angular publisher and a geometric model can only share a METHOD CLASS, not guaranteed the same precise formula or ritual cutoff.",
    "Source credibility requires independent same-city minute citations with pinned observer, then separate observational-model and ceremony-rule verification.",
    "No source-derived ceremonial Muhurat gating; unknown is unknown, never allowed."
  ]
};
mkdirSync("artifacts",{recursive:true});
writeFileSync(outFile,JSON.stringify(report,null,2)+"\n");
console.log("[asta-3q] targets="+report.targets+" native="+nativeResults.length+
  " scenarioEnvelopeGroups="+uncertain.length+" statusCounts="+JSON.stringify(statuses));
for(const c of comparisons){
  if(!c.scenarioSensitivity&&!c.pairs.length)continue;
  console.log("[asta-3q] "+c.locality+" "+c.planet+" "+c.year+" status="+c.status+
    " source="+c.sourceEvidence+" pairs="+c.usableProfiles+
    " lastEveningSpreadMin="+c.scenarioSensitivity?.lastEveningSpreadMinutes+
    " firstMorningSpreadMin="+c.scenarioSensitivity?.firstMorningSpreadMinutes);
}
console.log("[asta-3q] RESEARCH ONLY — no physical or ritual certification. "+outFile);
if(!comparisons.length||nativeResults.length!==native.heliacalSearchCount||
  comparisons.some(c=>c.safeForCeremonyFiltering||c.independentlyValidated)||
  report.modelsApprovedForWedding!==0)process.exitCode=1;
