/**
 * Wave CT1: content-trust check of the actually rendered indexable Daily HTML.
 *
 * A structural SEO pass cannot certify the truth of Hindu ritual advice. This
 * gate prevents a known set of unreviewed heuristic claims from returning to
 * indexable Daily pages, and requires links to explicit source/method policies.
 *
 * Deliberately does not interpret "no flags" as independent astronomy or
 * tradition validation; other families are recorded as unreviewed.
 */
const DAILY=/^\/panchang\/[^/]+\/\d{4}-\d{2}-\d{2}$/;
const UNVERIFIED_CLAIMS=[
  {code:"unverified-activity-advice",pattern:/\b(?:Traditional favorable signals|Favorable signal|Leadership tasks|Disciplined work|Problem solving|Visibility & outreach|Trade & negotiation)\b/i},
  {code:"synthetic-day-fingerprint",pattern:/\bDAY FINGERPRINT\b/i},
  {code:"synthetic-local-interpretation",pattern:/\bLOCAL DAY INTERPRETATION\b/i},
  {code:"invented-sunrise-taxonomy",pattern:/\bmid-morning-edge sunrise\b/i},
];
export function inspectRenderedContentTrust(pathname,html){
  if(!DAILY.test(pathname))return null;
  const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if(!main)return {pathname,issues:["missing-rendered-main"],riskFlags:[]};
  const readable=main.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ");
  const issues=UNVERIFIED_CLAIMS.filter(x=>x.pattern.test(readable)).map(x=>x.code);
  if(!/<a\b[^>]*href=["']\/methodology["'][^>]*>/i.test(main))issues.push("missing-methodology-link");
  if(!/<a\b[^>]*href=["']\/accuracy["'][^>]*>/i.test(main))issues.push("missing-accuracy-link");
  const riskFlags=["astronomy-unverified-external","ritual-rules-unverified-external"];
  return {pathname,issues,riskFlags};
}
export function summarizeContentTrust(records){
  const inspected=records.filter(Boolean);
  const failures=inspected.filter(x=>x.issues.length);
  const flags={};
  for(const record of inspected)for(const flag of record.riskFlags)flags[flag]=(flags[flag]??0)+1;
  return {scope:"sitemap-indexable-daily",inspected:inspected.length,failures,remainingExternalReviewFlags:flags,meaning:"Heuristic-claim gate only: not astronomical or ritual certification, and no automatic noindex."};
}
