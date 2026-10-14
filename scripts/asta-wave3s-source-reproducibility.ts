/**
 * Wave 3S: autonomous evidence-integrity gate for Asta publisher page locality.
 *
 * Conservatively audits *snapshots* of indexed and page-fetch results. It does
 * not scrape a source in CI or claim a locale-stable third-party API.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {coreCities} from "../lib/cities";
import {evaluateAstaReferences} from "../lib/asta-reference-audit";
import {auditCitySourceReproducibility} from "../lib/asta-city-source-reproducibility";
import {astaEvidenceLedger} from "../tests/fixtures/asta-evidence-ledger";
import {unstableAstaCitySourceCaptures} from "../tests/fixtures/asta-city-source-captures";

const out=process.argv.find(x=>x.startsWith("--report="))?.slice(9)||
  "artifacts/asta-wave3s-local-source-reproducibility.json";
const audit=auditCitySourceReproducibility(
  unstableAstaCitySourceCaptures,astaEvidenceLedger);
const priorityCities=["Mumbai, Maharashtra","Pune, Maharashtra","New Delhi",
  "Chennai, Tamil Nadu"];
const asLocality=(name:string,state:string)=>name==="Delhi"?"New Delhi":name+", "+state;
const allTargets=coreCities.flatMap(city=>[2025,2026,2027].flatMap(year=>
  (["Jupiter","Venus"] as const).map(planet=>
    evaluateAstaReferences(astaEvidenceLedger,planet,year,
      asLocality(city.name,city.state))
  )
));
const countStatuses=allTargets.reduce<Record<string,number>>((acc,r)=>{
  acc[r.status]=(acc[r.status]??0)+1;return acc;
},{});
const ready=allTargets.filter(x=>x.status==="comparison-ready");
const priority=allTargets.filter(x=>priorityCities.includes(x.locality));
const data={
  createdAt:new Date().toISOString(),wave:"3S",
  status:"UNVERIFIED-SOURCE-LOCATION-REPRODUCIBILITY",
  safeForCeremonyFiltering:false,
  thirdPartyPageAccess:"historic-indexed-and-separate-page-fetch-captures-not-a-live-api",
  observerBindingSemantics:"no verified immutable third-party permalink for a city",
  captures:unstableAstaCitySourceCaptures,
  observationAudit:audit,
  publisherReconciliation:{
    scope:"coreCities × 2025–2027 × Jupiter/Venus",
    targetCount:allTargets.length,
    priorityTargetCount:priority.length,
    readyForIndependentObserverModelBenchmark:ready.length,
    unresolved:allTargets.length-ready.length,
    statusCounts:countStatuses,
    priority,needsExternalEvidence:[
      "A URL containing an immutable city identifier, verified in the page content and independently repeated without cookie/geolocation context.",
      "At least two genuinely distinct publishers of same-city, same-method, minute-precision transition times.",
      "Independent evidence that the astronomical *event definition* used for Asta matches that publication, not merely the 11/10/8 degree family.",
      "Observer location and timezone metadata, date-correct 24+ clock handling, and a human-reviewed capture trail.",
      "Do not merge VedicTithi (Ujjain page), VedicMarga (NPT), or Swarn Siddhi fixed angular into local Drik observer-visibility evidence simply because their minutes agree."
    ]
  },
  blockers:[
    "Exactly the same Drik ?year=3206 page was observed rendering Mumbai and Washington, D.C. in different retrieval contexts.",
    "Even two identical observer-city titles on repeat do not demonstrate an immutable city-binding URL parameter.",
    "Drik year query numbers can differ from rendered Gregorian year; no inference from query value is allowed.",
    "A third independently published *fixed-angle* source cannot certify Drik location-dependent Asta or a ritual Muhurat.",
    "Asta claim status remains unknown, not a license to claim weddings/house entry are allowed."
  ]
};
mkdirSync("artifacts",{recursive:true});
writeFileSync(out,JSON.stringify(data,null,2)+"\n");
console.log("[asta-3s] URL observations="+audit.totalCaptures+
  " city-conflicting-URLs="+audit.conflictingURLCount+
  " independently-pinned-URLs="+audit.independentlyCityPinnedURLCount+
  " invalid="+audit.invalidCaptures.length);
console.log("[asta-3s] observer targets="+allTargets.length+" ready="+ready.length+
  " unresolved="+data.publisherReconciliation.unresolved+
  " priority="+priority.length);
for(const u of audit.urls.filter(x=>x.state==="observed-multi-locality-at-one-url"))
  console.log("[asta-3s] SAME URL, DIFFERENT CITIES: "+u.url+" "+u.cities.join(" / "));
console.log("[asta-3s] RESEARCH ONLY; cannot enable Wedding/Griha; report="+out);
if(audit.invalidCaptures.length||!audit.conflictingURLCount||ready.length||
  audit.independentlyCityPinnedURLCount||allTargets.some(x=>x.safeForCeremonyFiltering))
  process.exitCode=1;
