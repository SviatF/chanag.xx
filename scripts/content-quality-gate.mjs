import {readFileSync} from "node:fs";

const reportPath=process.argv[2]||"content-quality-report.json";
const report=JSON.parse(readFileSync(reportPath,"utf8"));
const totals=report.totals??{};

const failures=[];
if((totals.fetchErrors??0)>0)failures.push(`${totals.fetchErrors} fetch error(s)`);
if((totals.structuralIssues??0)>0)failures.push(`${totals.structuralIssues} structural issue(s)`);
if((totals.hreflangIssues??0)>0)failures.push(`${totals.hreflangIssues} hreflang issue(s)`);
if((totals.duplicateCanonicals??0)>0)failures.push(`${totals.duplicateCanonicals} duplicate canonical owner(s)`);
if((totals.disclaimerPages??0)>0)failures.push(`${totals.disclaimerPages} disclaimer-style page(s)`);

console.log(`[content-gate] sitemap=${totals.sitemapUrls??0} fetched=${totals.fetched??0}`);
console.log(`[content-gate] structural=${totals.structuralIssues??0} hreflang=${totals.hreflangIssues??0} canonicals=${totals.duplicateCanonicals??0} disclaimers=${totals.disclaimerPages??0}`);
console.log(`[content-gate] similarity observation: exact=${totals.exactNormalizedDuplicateGroups??0} high=${totals.highSimilarityPairs??0} severe=${totals.severeSimilarityPairs??0}`);

if(failures.length){
  console.error(`[content-gate] FAILED: ${failures.join("; ")}`);
  process.exit(1);
}

console.log("[content-gate] PASS — structural SEO and PATCH 1 disclosure/i18n checks are clean. Similarity remains observational until strict rollout.");
