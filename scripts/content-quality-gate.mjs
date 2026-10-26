import {readFileSync} from "node:fs";

const reportPath=process.argv[2]||"content-quality-report.json";
const report=JSON.parse(readFileSync(reportPath,"utf8"));
const totals=report.totals??{};
const familySummary=report.familySummary??{};

const NON_PROGRAMMATIC_FAMILIES=new Set([
  "navigation",
  "authority-singleton",
  "tool-singleton",
  "other-content",
]);

function isProgrammaticFamily(family){
  return !NON_PROGRAMMATIC_FAMILIES.has(family)&&!family.endsWith("singleton");
}

const programmaticFamilies=Object.entries(familySummary)
  .filter(([family])=>isProgrammaticFamily(family))
  .sort(([left],[right])=>left.localeCompare(right));

const programmaticWarnings=programmaticFamilies.reduce((sum,[,entry])=>sum+(entry.warnings??0),0);
const programmaticIssues=programmaticFamilies.reduce((sum,[,entry])=>sum+(entry.issues??0),0);
const sitemapUrls=totals.sitemapUrls??0;
const fetched=totals.fetched??0;

const failures=[];
if(!report.seoIdentity||!Number.isInteger(report.seoIdentity.programmaticPages))failures.push("SEO identity audit missing or incomplete");
if(!report.dailyFactIntegrity||!Number.isInteger(report.dailyFactIntegrity.dailyPages)||report.dailyFactIntegrity.dailyPages===0)failures.push("rendered daily fact integrity audit missing or empty");
if((totals.dailyFactFailures??0)>0)failures.push(`${totals.dailyFactFailures} invalid rendered daily fact(s)`);
if(!report.dailyTrust||report.dailyTrust.scope!=="indexed-daily-ssr"||!Number.isInteger(report.dailyTrust.inspected)||report.dailyTrust.inspected<1)failures.push("CT3 rendered Daily content-trust check missing");
if((totals.dailyTrustFailures??0)>0)failures.push(`${totals.dailyTrustFailures} unsupported Daily content claims`);
if(!report.muhuratTrust||!Number.isInteger(report.muhuratTrust.inspected)||report.muhuratTrust.inspected<1)failures.push("rendered Muhurat content-trust audit missing");
if((totals.muhuratTrustFailures??0)>0)failures.push(`${totals.muhuratTrustFailures} Muhurat presentation trust issue(s)`);
if(!report.crossPageCalendar||!Number.isInteger(report.crossPageCalendar.monthRows))failures.push("rendered cross-page calendar audit missing");
if((totals.crossPageCalendarContradictions??0)>0)failures.push(`${totals.crossPageCalendarContradictions} cross-page lunar contradictions`);
if(!report.unlistedAudit||!Number.isInteger(report.unlistedAudit.requested)||
   report.unlistedAudit.requested<1||report.unlistedAudit.verified!==report.unlistedAudit.requested)
  failures.push("direct non-sitemap calendar validation missing or incomplete");
if((totals.unlistedDailyFailures??0)>0)failures.push(`${totals.unlistedDailyFailures} non-sitemap Daily fetch/validation error(s)`);
if(sitemapUrls<=0)failures.push("empty sitemap corpus");
if(fetched!==sitemapUrls)failures.push(`rendered corpus incomplete (${fetched}/${sitemapUrls})`);
if((totals.fetchErrors??0)>0)failures.push(`${totals.fetchErrors} fetch error(s)`);
if((totals.structuralIssues??0)>0)failures.push(`${totals.structuralIssues} structural issue(s)`);
if((totals.hreflangIssues??0)>0)failures.push(`${totals.hreflangIssues} hreflang issue(s)`);
if((totals.duplicateCanonicals??0)>0)failures.push(`${totals.duplicateCanonicals} duplicate canonical owner(s)`);
if((totals.seoIdentityIssues??0)>0)failures.push(`${totals.seoIdentityIssues} HTML identity issue(s)`);
if((totals.duplicateSeoTitles??0)>0)failures.push(`${totals.duplicateSeoTitles} duplicate indexed SEO-title group(s)`);
if((totals.duplicateMetaDescriptions??0)>0)failures.push(`${totals.duplicateMetaDescriptions} duplicate indexed meta-description group(s)`);
if((totals.disclaimerPages??0)>0)failures.push(`${totals.disclaimerPages} disclaimer-style page(s)`);
if((totals.exactNormalizedDuplicateGroups??0)>0)failures.push(`${totals.exactNormalizedDuplicateGroups} exact normalized duplicate group(s)`);
if((totals.highSimilarityPairs??0)>0)failures.push(`${totals.highSimilarityPairs} high similarity pair(s)`);
if((totals.severeSimilarityPairs??0)>0)failures.push(`${totals.severeSimilarityPairs} severe similarity pair(s)`);
if(programmaticIssues>0)failures.push(`${programmaticIssues} programmatic family issue(s)`);
if(programmaticWarnings>0)failures.push(`${programmaticWarnings} programmatic family warning(s)`);

console.log(`[content-gate] sitemap=${sitemapUrls} fetched=${fetched}`);
console.log(`[content-gate] structural=${totals.structuralIssues??0} hreflang=${totals.hreflangIssues??0} canonicals=${totals.duplicateCanonicals??0} disclaimers=${totals.disclaimerPages??0}`);
console.log(`[content-gate] directUnlisted verified=${totals.unlistedDailyVerified??0} errors=${totals.unlistedDailyFailures??0}`);
console.log(`[content-gate] crossPage month=${totals.crossPageCalendarMatchedMonth??0} vrat=${totals.crossPageCalendarMatchedVrat??0} contradictions=${totals.crossPageCalendarContradictions??0}`);
console.log(`[content-gate] muhuratTrust inspected=${totals.muhuratTrustInspected??0} regressions=${totals.muhuratTrustFailures??0}; ritual dates NOT certified`);
console.log(`[content-gate] dailyTrust reviewed=${totals.dailyTrustInspected??0} regressions=${totals.dailyTrustFailures??0}; astronomy and religious eligibility NOT certified`);
console.log(`[content-gate] dailyFactErrors=${totals.dailyFactFailures??0} physically-identical-vectors=${totals.dailyFactIdenticalGroups??0} (review only)`);
console.log(`[content-gate] seoIdentity issues=${totals.seoIdentityIssues??0} duplicateTitles=${totals.duplicateSeoTitles??0} duplicateDescriptions=${totals.duplicateMetaDescriptions??0}`);
console.log(`[content-gate] similarity exact=${totals.exactNormalizedDuplicateGroups??0} high=${totals.highSimilarityPairs??0} factualReview=${totals.factuallyDistinctReviewPairs??0} severe=${totals.severeSimilarityPairs??0}`);
console.log(`[content-gate] programmatic issues=${programmaticIssues} warnings=${programmaticWarnings}`);

console.log("[content-gate] family-by-family summary:");
for(const [family,entry] of Object.entries(familySummary).sort(([left],[right])=>left.localeCompare(right))){
  const scope=isProgrammaticFamily(family)?"programmatic":"support";
  console.log(
    `  ${family} [${scope}] pages=${entry.pages??0} issues=${entry.issues??0} warnings=${entry.warnings??0} `+
    `high=${entry.highSimilarityPairs??0} severe=${entry.severeSimilarityPairs??0} disclaimers=${entry.disclaimerPages??0}`
  );
}

if(failures.length){
  console.error(`[content-gate] FAILED: ${failures.join("; ")}`);
  process.exit(1);
}

console.log("[content-gate] PASS — full rendered corpus passed structural, SEO metadata identity and exact/high/severe similarity gates, programmatic families have zero issues/warnings, and structural/canonical/hreflang/disclaimer checks are clean.");
