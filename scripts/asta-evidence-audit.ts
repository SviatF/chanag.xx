/**
 * Non-production Asta provenance coverage report (Wave 3N).
 * This report is NOT a list of allowed/rejected ritual dates.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {coreCities} from "../lib/cities";
import {astaReferenceErrors,evaluateAstaReferences} from "../lib/asta-reference-audit";
import {astaEvidenceLedger} from "../tests/fixtures/asta-evidence-ledger";

const asLocality=(name:string,state:string)=>name==="Delhi"?"New Delhi":name+", "+state;
const targets=coreCities.flatMap(city=>
  [2025,2026,2027].flatMap(year=>
    (["Jupiter","Venus"] as const).map(planet=>
      evaluateAstaReferences(astaEvidenceLedger,planet,year,asLocality(city.name,city.state))
    )
  )
);
const invalid=astaEvidenceLedger.flatMap((entry,index)=>
  astaReferenceErrors(entry).map(error=>({index,planet:entry.planet,locality:entry.locality,error}))
);
const comparisonsReady=targets.filter(x=>x.status==="comparison-ready");
const disagreements=targets.filter(x=>x.status==="boundary-disagreement"||x.status==="method-disagreement");
const data={
  createdAt:new Date().toISOString(),
  releaseStatus:"RESEARCH-ONLY-DO-NOT-ENABLE-RITUAL-GATING",
  safeForCeremonyFiltering:false,
  caveat:"Core-city evidence coverage does NOT imply all those cities have publicly indexed Muhurat pages.",
  targetScope:"coreCities × 2025–2027 × Jupiter/Venus; IST local civil time",
  sourceRecords:astaEvidenceLedger.length,
  coreCityCount:coreCities.length,
  requiredTargetComparisons:targets.length,
  independentModelComparisonReady:comparisonsReady.length,
  unresolvedTargetComparisons:targets.length-comparisonsReady.length,
  methodOrBoundaryDisagreements:disagreements.length,
  invalidSourceRecords:invalid,
  priorityLocalities:["Mumbai, Maharashtra","Pune, Maharashtra","New Delhi","Chennai, Tamil Nadu"],
  examples:targets.filter(r=>
    ["Mumbai, Maharashtra","Pune, Maharashtra","New Delhi","Chennai, Tamil Nadu"].includes(r.locality)
  ),
  externalLocationRecords:astaEvidenceLedger.filter(r=>
    !targets.some(t=>t.locality===r.locality)
  ),
  sourceEvidence:astaEvidenceLedger,
  limitations:[
    "One publisher's city-specific time is not an independently corroborated transition.",
    "Date-only, differently located, undated or methodologically incompatible sources cannot certify minute-level boundaries.",
    "Matching published instants are only eligible for a separate physical-method benchmark, not automatic ritual approvals.",
    "The existing geocentric threshold experiment has multi-day residuals for Mumbai 2027 Jupiter Asta.",
    "Full marriage, house-entry and regional Shuddhi remain incomplete; no Asta interval is imported into lib/muhurat.ts."
  ]
};
mkdirSync("artifacts",{recursive:true});
const dest=process.argv.find(x=>x.startsWith("--report="))?.slice("--report=".length)||"artifacts/asta-evidence-audit.json";
writeFileSync(dest,JSON.stringify(data,null,2)+"\n");
console.log("[asta-evidence] reference records="+data.sourceRecords+
  " core cities="+data.coreCityCount+" comparisons="+targets.length+
  " ready-for-model-benchmark="+comparisonsReady.length+
  " unresolved="+data.unresolvedTargetComparisons+" invalid="+invalid.length);
console.log("[asta-evidence] status=RESEARCH-ONLY; NOT ceremony verified; report="+dest);
if(invalid.length||targets.some(x=>x.safeForCeremonyFiltering))process.exitCode=1;
