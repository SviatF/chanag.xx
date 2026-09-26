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
if(sitemapUrls<=0)failures.push("empty sitemap corpus");
if(fetched!==sitemapUrls)failures.push(`rendered corpus incomplete (${fetched}/${sitemapUrls})`);
if((totals.fetchErrors??0)>0)failures.push(`${totals.fetchErrors} fetch error(s)`);
if((totals.structuralIssues??0)>0)failures.push(`${totals.structuralIssues} structural issue(s)`);
if((totals.hreflangIssues??0)>0)failures.push(`${totals.hreflangIssues} hreflang issue(s)`);
if((totals.duplicateCanonicals??0)>0)failures.push(`${totals.duplicateCanonicals} duplicate canonical owner(s)`);
if((totals.disclaimerPages??0)>0)failures.push(`${totals.disclaimerPages} disclaimer-style page(s)`);
if((totals.exactNormalizedDuplicateGroups??0)>0)failures.push(`${totals.exactNormalizedDuplicateGroups} exact normalized duplicate group(s)`);
if((totals.highSimilarityPairs??0)>0)failures.push(`${totals.highSimilarityPairs} high similarity pair(s)`);
if((totals.severeSimilarityPairs??0)>0)failures.push(`${totals.severeSimilarityPairs} severe similarity pair(s)`);
if(programmaticIssues>0)failures.push(`${programmaticIssues} programmatic family issue(s)`);
if(programmaticWarnings>0)failures.push(`${programmaticWarnings} programmatic family warning(s)`);

console.log(`[content-gate] sitemap=${sitemapUrls} fetched=${fetched}`);
console.log(`[content-gate] structural=${totals.structuralIssues??0} hreflang=${totals.hreflangIssues??0} canonicals=${totals.duplicateCanonicals??0} disclaimers=${totals.disclaimerPages??0}`);
console.log(`[content-gate] similarity exact=${totals.exactNormalizedDuplicateGroups??0} high=${totals.highSimilarityPairs??0} severe=${totals.severeSimilarityPairs??0}`);
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

console.log("[content-gate] PASS — full rendered corpus is clean: exact/high/severe similarity are zero, programmatic families have zero issues/warnings, and structural/canonical/hreflang/disclaimer checks are clean.");
