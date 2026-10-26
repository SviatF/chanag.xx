import {writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {extractSeoIdentity,auditSeoIdentity} from "./seo-identity-quality.mjs";
import {inspectDailyVisibleFacts,summarizeDailyFactIntegrity} from "./daily-fact-integrity.mjs";
import {inspectCrossPageCalendar,reconcileRenderedCalendar} from "./crosspage-calendar-integrity.mjs";
import {chooseUnlistedDailyReferences} from "./unlisted-calendar-reference-sampler.mjs";
import {inspectRenderedDailyTrust,summarizeDailyTrust} from "./daily-content-trust.mjs";
import {inspectRenderedMuhuratTrust,summarizeMuhuratTrust} from "./muhurat-content-trust.mjs";
import {evidenceDistinctSimilarityPair} from "./factual-similarity-evidence.mjs";

const args=process.argv.slice(2);
function arg(name,fallback){
  const prefix=`--${name}=`;
  const hit=args.find(value=>value.startsWith(prefix));
  return hit?hit.slice(prefix.length):fallback;
}
function flag(name){return args.includes(`--${name}`);}

const baseUrl=arg("base-url",process.env.CONTENT_AUDIT_BASE_URL||"http://127.0.0.1:3000").replace(/\/$/,"");
const reportPath=arg("report","content-quality-report.json");
const concurrency=Math.max(1,Number(arg("concurrency","10"))||10);
const maxPages=Math.max(0,Number(arg("max-pages","0"))||0);
const unlistedLimit=Math.max(1,Math.min(512,Number(arg("unlisted-limit","192"))||192));
const enforceSimilarity=flag("enforce-similarity")||process.env.CONTENT_AUDIT_ENFORCE_SIMILARITY==="1";
const HIGH_RISK_SIMILARITY=Number(arg("high-risk","0.72"));
const SEVERE_SIMILARITY=Number(arg("severe","0.86"));

const NAVIGATION_ONLY=new Set([
  "/","/cities","/tools","/festivals","/muhurat","/regional","/knowledge","/vrat","/gold-rate"
]);

const DISCLAIMER_PATTERNS=[
  /not (?:financial|legal|medical|professional|personalized) advice/i,
  /not a (?:recommendation|substitute|guaranteed|personalized)/i,
  /qualified practitioner/i,
  /personalized (?:ritual|ceremony|astrolog)/i,
  /confirm (?:the )?(?:exact|relevant) .*?(?:practitioner|jeweller)/i,
  /accuracy\s*&\s*limitations/i,
  /explicit limitations/i,
];

function decodeEntities(value){
  return value
    .replace(/&nbsp;/gi," ")
    .replace(/&amp;/gi,"&")
    .replace(/&lt;/gi,"<")
    .replace(/&gt;/gi,">")
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi,(_,code)=>String.fromCodePoint(parseInt(code,16)));
}

function stripBlock(html,tag){
  return html.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`,"gi")," ");
}
function primaryText(html){
  const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]??html;
  let value=main;
  for(const tag of ["script","style","svg","header","nav","noscript"])value=stripBlock(value,tag);
  value=value
    .replace(/<div\b[^>]*class=["'][^"']*breadcrumbs[^"']*["'][^>]*>[\s\S]*?<\/div>/gi," ")
    .replace(/<div\b[^>]*class=["'][^"']*pill-links[^"']*["'][^>]*>[\s\S]*?<\/div>/gi," ")
    .replace(/<[^>]+>/g," ");
  return decodeEntities(value).replace(/\s+/g," ").trim();
}

function parseTagAttrs(tag){
  const attrs={};
  for(const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))attrs[match[1].toLowerCase()]=match[2]??match[3]??"";
  return attrs;
}
function linkTags(html){return [...html.matchAll(/<link\b[^>]*>/gi)].map(match=>parseTagAttrs(match[0]));}
function metaTags(html){return [...html.matchAll(/<meta\b[^>]*>/gi)].map(match=>parseTagAttrs(match[0]));}
function extractCanonical(html){
  const link=linkTags(html).find(attrs=>(attrs.rel||"").toLowerCase().split(/\s+/).includes("canonical"));
  return link?.href||null;
}
function extractAlternates(html){
  return linkTags(html)
    .filter(attrs=>(attrs.rel||"").toLowerCase().split(/\s+/).includes("alternate")&&attrs.hreflang&&attrs.href)
    .map(attrs=>({hreflang:attrs.hreflang,href:attrs.href}));
}
function extractRobots(html){
  return metaTags(html).filter(attrs=>(attrs.name||"").toLowerCase()==="robots").map(attrs=>attrs.content||"").join(",").toLowerCase();
}
function extractH1(html){
  const match=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return match?decodeEntities(match[1].replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()):"";
}
function absolutePath(value){
  try{return new URL(value,baseUrl).pathname.replace(/\/$/,"")||"/";}catch{return null;}
}
function routeTokens(pathname){
  return pathname.split("/").filter(Boolean).flatMap(part=>part.split(/[-_]/)).filter(token=>token.length>=3&&!/^\d+$/.test(token));
}
function normalizeWords(text,pathname){
  let value=text.toLowerCase().normalize("NFKC");
  for(const token of [...new Set(["panchvani",...routeTokens(pathname)])].sort((a,b)=>b.length-a.length)){
    value=value.replace(new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,"gi")," ");
  }
  return value
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g," ")
    .replace(/\b\d+(?::\d+)?(?:\.\d+)?%?\b/g," ")
    .replace(/[^\p{L}\p{M}]+/gu," ")
    .trim().split(/\s+/).filter(Boolean);
}
function shingles(words,size=3){
  if(words.length<size)return new Set(words);
  const out=new Set();
  for(let i=0;i<=words.length-size;i++)out.add(words.slice(i,i+size).join(" "));
  return out;
}
function jaccard(leftWords,rightWords){
  const left=shingles(leftWords),right=shingles(rightWords);
  if(!left.size&&!right.size)return 1;
  let overlap=0;
  for(const item of left)if(right.has(item))overlap++;
  return overlap/(left.size+right.size-overlap||1);
}
function sha(value){return createHash("sha256").update(value).digest("hex");}

function classify(pathname){
  if(NAVIGATION_ONLY.has(pathname))return null;
  let m;
  if((m=pathname.match(/^\/panchang\/([^/]+)\/(\d{4}-\d{2}-\d{2})$/)))return {family:"panchang-daily",cluster:`date:${m[2]}`};
  if((m=pathname.match(/^\/calendar\/([^/]+)\/(\d{4})\/(\d{2})$/)))return {family:"calendar-month",cluster:`month:${m[2]}-${m[3]}`};
  if((m=pathname.match(/^\/calendar\/([^/]+)\/(\d{4})$/)))return {family:"calendar-year-city",cluster:`year:${m[2]}`};
  if((m=pathname.match(/^\/festivals\/([^/]+)\/(\d{4})\/([^/]+)$/)))return {family:"festival-city",cluster:`festival:${m[1]}:${m[2]}`};
  if((m=pathname.match(/^\/festivals\/([^/]+)\/(\d{4})$/)))return {family:"festival-year",cluster:`year:${m[2]}`};
  if((m=pathname.match(/^\/festivals-calendar\/(\d{4})$/)))return {family:"festival-calendar-year",cluster:"festival-calendar"};
  if((m=pathname.match(/^\/vrat\/([^/]+)\/(\d{4})\/([^/]+)$/)))return {family:"vrat-city",cluster:`vrat:${m[1]}:${m[2]}`};
  if((m=pathname.match(/^\/vrat\/([^/]+)\/(\d{4})$/)))return {family:"vrat-year",cluster:`vrat:${m[1]}`};
  if((m=pathname.match(/^\/muhurat\/([^/]+)\/(\d{4})\/(\d{2})\/([^/]+)$/)))return {family:"muhurat-city-month",cluster:`muhurat:${m[1]}:${m[2]}-${m[3]}`};
  if((m=pathname.match(/^\/muhurat\/([^/]+)\/(\d{4})\/(\d{2})$/)))return {family:"muhurat-month",cluster:`muhurat:${m[1]}:${m[2]}`};
  if((m=pathname.match(/^\/muhurat\/([^/]+)\/(\d{4})$/)))return {family:"muhurat-year",cluster:`muhurat:${m[1]}`};
  if((m=pathname.match(/^\/regional\/([^/]+)\/([^/]+)\/([^/]+)$/)))return {family:"regional-intent-city",cluster:`regional:${m[1]}:${m[3]}`};
  if((m=pathname.match(/^\/regional\/([^/]+)\/([^/]+)$/)))return {family:"regional-city",cluster:`regional:${m[1]}`};
  if((m=pathname.match(/^\/tools\/choghadiya\/([^/]+)$/)))return {family:"choghadiya-city",cluster:"choghadiya-today"};
  if((m=pathname.match(/^\/tools\/hindu-baby-names\/([^/]+)$/)))return {family:"baby-name-nakshatra",cluster:"baby-name"};
  if((m=pathname.match(/^\/gold-rate\/([^/]+)$/)))return {family:"gold-rate-city",cluster:"gold-rate"};
  if((m=pathname.match(/^\/knowledge\/([^/]+)$/)))return {family:"knowledge-topic",cluster:"knowledge"};
  if((m=pathname.match(/^\/hindu-calendar\/(\d{4})$/)))return {family:"hindu-calendar-year",cluster:"hindu-calendar"};
  if(pathname.startsWith("/tools/"))return {family:"tool-singleton",cluster:pathname};
  if(["/about","/accuracy","/corrections","/data-sources","/editorial-policy","/methodology","/disclaimer","/photo-credits"].includes(pathname))return {family:"authority-singleton",cluster:pathname};
  return {family:"other-content",cluster:pathname};
}

async function fetchText(url,label=url){
  let last;
  for(let attempt=0;attempt<2;attempt++){
    try{
      const response=await fetch(url,{headers:{"user-agent":"PanchvaniContentQualityAudit/1.0"}});
      if(!response.ok)throw new Error(`${response.status} ${response.statusText}`);
      return await response.text();
    }catch(error){last=error;if(attempt===0)await new Promise(resolve=>setTimeout(resolve,250));}
  }
  throw new Error(`Failed ${label}: ${last?.message||last}`);
}
function sitemapLocalUrl(loc){
  const url=new URL(loc,baseUrl);
  return `${baseUrl}${url.pathname}${url.search}`;
}
async function collectSitemapUrls(){
  const root=await fetchText(`${baseUrl}/sitemap.xml`,"sitemap index");
  const locs=[...root.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map(match=>decodeEntities(match[1].trim()));
  const sitemapLocs=root.includes("<sitemapindex")?locs:[];
  const pageLocs=root.includes("<urlset")?locs:[];
  for(const sitemap of sitemapLocs){
    const xml=await fetchText(sitemapLocalUrl(sitemap),sitemap);
    for(const match of xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi))pageLocs.push(decodeEntities(match[1].trim()));
  }
  const unique=[...new Set(pageLocs.map(loc=>new URL(loc).pathname.replace(/\/$/,"")||"/"))];
  return maxPages?unique.slice(0,maxPages):unique;
}

async function mapLimit(items,limit,worker){
  const results=new Array(items.length);
  let cursor=0;
  async function run(){
    while(true){
      const index=cursor++;
      if(index>=items.length)return;
      try{results[index]=await worker(items[index],index);}catch(error){results[index]={pathname:items[index],fetchError:error.message};}
    }
  }
  await Promise.all(Array.from({length:Math.min(limit,items.length)},run));
  return results;
}

function factualEvidenceSignals(html,text){
  // Evidence density != correctness; these counts only identify candidates for review.
  // Count unique concrete values instead of rewarding repetitions of the same clock.
  const clocks=[...new Set(text.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g)||[])];
  const isoDates=[...new Set(text.match(/\b20\d{2}-\d{2}-\d{2}\b/g)||[])];
  const factualCards=[...html.matchAll(/<div\b[^>]*class=["'][^"']*\bdata-card\b[^"']*["'][^>]*>/gi)].length;
  const dataRows=[...html.matchAll(/<tr\b/gi)].length;
  const sections=[...html.matchAll(/<h[2-4]\b/gi)].length;
  return {distinctClockValues:clocks.length,distinctIsoDates:isoDates.length,factualCards,dataRows,sections,clockValues:clocks};
}

function auditPage(pathname,html){
  const classification=classify(pathname);
  const text=primaryText(html);
  const factualEvidence=factualEvidenceSignals(html,text);
  const words=normalizeWords(text,pathname);
  const canonical=extractCanonical(html);
  const canonicalPath=canonical?absolutePath(canonical):null;
  const alternates=extractAlternates(html).map(item=>({...item,pathname:absolutePath(item.href)}));
  const robots=extractRobots(html);
  const h1=extractH1(html);
  const seo=extractSeoIdentity(html);
  const dailyFact=inspectDailyVisibleFacts(pathname,html);
  const dailyTrust=inspectRenderedDailyTrust(pathname,html);
  const muhuratTrust=inspectRenderedMuhuratTrust(pathname,html);
  const issues=[];
  const warnings=[];
  if(!canonical)issues.push("missing canonical");
  else if(canonicalPath!==pathname)issues.push(`self-canonical mismatch -> ${canonicalPath}`);
  if(robots.includes("noindex"))issues.push("sitemap URL renders noindex");
  if(!h1)issues.push("missing H1");
  if(classification&&words.length<60)issues.push(`thin primary text (${words.length} normalized words)`);
  else if(classification&&words.length<120)warnings.push(`light primary text (${words.length} normalized words)`);
  const selfAlternate=alternates.some(item=>item.pathname===pathname);
  if(alternates.length&&!selfAlternate)warnings.push("hreflang cluster has no self-reference");
  if(alternates.length&&!alternates.some(item=>item.hreflang.toLowerCase()==="x-default"))warnings.push("hreflang cluster has no x-default");
  const disclaimerHits=DISCLAIMER_PATTERNS.filter(pattern=>pattern.test(text)).map(pattern=>pattern.source);
  if(classification&&disclaimerHits.length)warnings.push(`disclaimer-style copy (${disclaimerHits.length} pattern${disclaimerHits.length===1?"":"s"})`);
  return {
    pathname,
    family:classification?.family??"navigation",
    cluster:classification?.cluster??pathname,
    canonical,
    canonicalPath,
    alternates,
    robots,
    h1,
    seo,
    dailyFact,
    dailyTrust,
    muhuratTrust,
    crossPage:inspectCrossPageCalendar(pathname,html),
    factualEvidence,
    wordCount:words.length,
    normalizedHash:sha(words.join(" ")),
    normalizedWords:words,
    disclaimerHits,
    issues,
    warnings,
  };
}

function pairwiseSimilarity(pages){
  const groups=new Map();
  for(const page of pages){
    if(page.family==="navigation"||page.family.endsWith("singleton")||page.family==="other-content")continue;
    const key=`${page.family}::${page.cluster}`;
    const list=groups.get(key)??[];list.push(page);groups.set(key,list);
  }
  const pairs=[];
  for(const [group,list] of groups){
    if(list.length<2)continue;
    for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
      const score=jaccard(list[i].normalizedWords,list[j].normalizedWords);
      if(score>=HIGH_RISK_SIMILARITY){
        const different=evidenceDistinctSimilarityPair(list[i],list[j],score);
        pairs.push({group,left:list[i].pathname,right:list[j].pathname,score:Number(score.toFixed(4)),severity:score>=SEVERE_SIMILARITY?"severe":different?"factually-distinct-review":"high",clockEvidenceDistinct:different});
      }
    }
  }
  return pairs.sort((a,b)=>b.score-a.score);
}

const startedAt=new Date().toISOString();
console.log(`[content-audit] base=${baseUrl} concurrency=${concurrency}`);
const paths=await collectSitemapUrls();
console.log(`[content-audit] sitemap URLs=${paths.length}`);
const fetched=await mapLimit(paths,concurrency,async pathname=>{
  const html=await fetchText(`${baseUrl}${pathname}`,pathname);
  return auditPage(pathname,html);
});

const fetchErrors=fetched.filter(item=>item?.fetchError);
const pages=fetched.filter(item=>item&&!item.fetchError);
const pathSet=new Set(pages.map(page=>page.pathname));
const structuralIssues=[];
for(const page of pages)for(const issue of page.issues)structuralIssues.push({pathname:page.pathname,issue});

const hreflangIssues=[];
const byPath=new Map(pages.map(page=>[page.pathname,page]));
for(const page of pages){
  for(const alt of page.alternates){
    if(!alt.pathname||!pathSet.has(alt.pathname))continue;
    const target=byPath.get(alt.pathname);
    const reciprocal=target?.alternates.some(back=>back.pathname===page.pathname);
    if(!reciprocal)hreflangIssues.push({pathname:page.pathname,target:alt.pathname,hreflang:alt.hreflang,issue:"non-reciprocal hreflang"});
  }
}

const duplicateCanonicals=[];
const canonicalOwners=new Map();
for(const page of pages){
  if(!page.canonicalPath)continue;
  const owners=canonicalOwners.get(page.canonicalPath)??[];owners.push(page.pathname);canonicalOwners.set(page.canonicalPath,owners);
}
for(const [canonical,owners] of canonicalOwners)if(owners.length>1)duplicateCanonicals.push({canonical,owners});

const seoIdentity=auditSeoIdentity(pages);
const dailyFactIntegrity=summarizeDailyFactIntegrity(pages.map(page=>page.dailyFact));
const dailyTrust=summarizeDailyTrust(pages.map(page=>page.dailyTrust));
const muhuratTrust=summarizeMuhuratTrust(pages.map(page=>page.muhuratTrust));
// Check non-sitemap Daily URLs directly, without adding low-value pages
// to sitemap/index. All reference owners stay available for reconciliation.
const preliminaryCrossPage=reconcileRenderedCalendar(pages.map(page=>page.crossPage));
const unlistedSelection=chooseUnlistedDailyReferences(preliminaryCrossPage.missingCounterparts,unlistedLimit);
console.log(`[content-audit] validating unlisted Daily references unique=${unlistedSelection.uniqueTargets} sample=${unlistedSelection.selected.length}`);
const onDemandResults=await mapLimit(unlistedSelection.selected.map(item=>item.path),8,async pathname=>{
  const html=await fetchText(`${baseUrl}${pathname}`,pathname);
  const record=inspectCrossPageCalendar(pathname,html);
  const detail=inspectDailyVisibleFacts(pathname,html);
  if(!detail||detail.problems.length)throw new Error("invalid non-sitemap Daily visible facts: "+(detail?.problems.join(", ")??"missing"));
  return record;
});
const onDemandErrors=onDemandResults.filter(item=>item?.fetchError).map(item=>({
  pathname:item.pathname,error:item.fetchError
}));
const verifiedOnDemand=onDemandResults.filter(item=>item&&!item.fetchError);
const crossPageCalendar=reconcileRenderedCalendar([...pages.map(page=>page.crossPage),...verifiedOnDemand]);
const unlistedAudit={
  uniqueTargets:unlistedSelection.uniqueTargets,
  referencedRows:unlistedSelection.sourceReferences,
  requested:unlistedSelection.selected.length,
  verified:verifiedOnDemand.length,
  fetchErrors:onDemandErrors,
  sampledPaths:unlistedSelection.selected.map(x=>x.path),
  policy:"Direct SSR validation only; sampled URLs NOT added to sitemap or approved for indexing",
  sampleMethod:unlistedSelection.sampleMethod
};
const similarityPairs=pairwiseSimilarity(pages);
const exactNormalizedDuplicates=[];
const hashGroups=new Map();
for(const page of pages){
  if(page.family==="navigation"||page.normalizedWords.length<40)continue;
  const list=hashGroups.get(page.normalizedHash)??[];list.push(page.pathname);hashGroups.set(page.normalizedHash,list);
}
for(const [hash,owners] of hashGroups)if(owners.length>1)exactNormalizedDuplicates.push({hash,owners});

const familySummary={};
for(const page of pages){
  const entry=familySummary[page.family]??={pages:0,issues:0,warnings:0,disclaimerPages:0};
  entry.pages++;entry.issues+=page.issues.length;entry.warnings+=page.warnings.length;if(page.disclaimerHits.length)entry.disclaimerPages++;
  entry.evidenceTotals??={distinctClockValues:0,distinctIsoDates:0,factualCards:0,dataRows:0,sections:0};
  for(const key of Object.keys(entry.evidenceTotals))entry.evidenceTotals[key]+=page.factualEvidence[key];
  if(page.factualEvidence.distinctClockValues===0&&["panchang-daily","festival-city","muhurat-city-month","choghadiya-city"].includes(page.family)){
    entry.noExplicitClockPages=(entry.noExplicitClockPages??0)+1;
  }
}
for(const pair of similarityPairs){
  const family=pair.group.split("::")[0];
  const entry=familySummary[family]??={pages:0,issues:0,warnings:0,disclaimerPages:0};
  if(pair.severity==="factually-distinct-review")entry.factuallyDistinctReviewPairs=(entry.factuallyDistinctReviewPairs??0)+1;
  else entry.highSimilarityPairs=(entry.highSimilarityPairs??0)+1;
  if(pair.severity==="severe")entry.severeSimilarityPairs=(entry.severeSimilarityPairs??0)+1;
}

const report={
  generatedAt:new Date().toISOString(),startedAt,baseUrl,
  mode:enforceSimilarity?"structural+similarity-enforcement":"structural-enforcement+similarity-observation",
  thresholds:{highRiskSimilarity:HIGH_RISK_SIMILARITY,severeSimilarity:SEVERE_SIMILARITY},
  totals:{
    sitemapUrls:paths.length,fetched:pages.length,fetchErrors:fetchErrors.length,
    structuralIssues:structuralIssues.length,hreflangIssues:hreflangIssues.length,
    duplicateCanonicals:duplicateCanonicals.length,exactNormalizedDuplicateGroups:exactNormalizedDuplicates.length,
    unlistedDailyVerified:unlistedAudit.verified,
    unlistedDailyFailures:unlistedAudit.fetchErrors.length,
    crossPageCalendarContradictions:crossPageCalendar.contradictions.length,
    crossPageCalendarMatchedMonth:crossPageCalendar.matchedMonth,
    crossPageCalendarMatchedVrat:crossPageCalendar.matchedVrat,
    dailyFactFailures:dailyFactIntegrity.failures.length,
    dailyFactIdenticalGroups:dailyFactIntegrity.identicalLocalFactGroups.length,
    dailyTrustInspected:dailyTrust.inspected,
    dailyTrustFailures:dailyTrust.failures.length,
    muhuratTrustInspected:muhuratTrust.inspected,
    muhuratTrustFailures:muhuratTrust.failures.length,
    seoIdentityIssues:seoIdentity.issues.length,
    duplicateSeoTitles:seoIdentity.duplicateTitles.length,
    duplicateMetaDescriptions:seoIdentity.duplicateDescriptions.length,
    highSimilarityPairs:similarityPairs.filter(pair=>pair.severity!=="factually-distinct-review").length,
    factuallyDistinctReviewPairs:similarityPairs.filter(pair=>pair.severity==="factually-distinct-review").length,
    severeSimilarityPairs:similarityPairs.filter(pair=>pair.severity==="severe").length,
    disclaimerPages:pages.filter(page=>page.disclaimerHits.length).length,
  },
  familySummary,
  seoIdentity,
  dailyFactIntegrity,
  dailyTrust,
  muhuratTrust,
  crossPageCalendar,
  unlistedAudit,
  evidenceNote:"Quantitative evidence counts are observation and prioritization only, not independent fact verification.",
  fetchErrors,
  structuralIssues,
  hreflangIssues,
  duplicateCanonicals,
  exactNormalizedDuplicates,
  similarityPairs,
  pages:pages.map(({normalizedWords,crossPage,...page})=>page),
};
writeFileSync(reportPath,JSON.stringify(report,null,2));

console.log(`[content-audit] fetched=${pages.length}/${paths.length}`);
console.log(`[content-audit] structural=${structuralIssues.length} hreflang=${hreflangIssues.length} duplicateCanonicals=${duplicateCanonicals.length}`);
console.log(`[content-audit] similarity high=${report.totals.highSimilarityPairs} factual-review=${report.totals.factuallyDistinctReviewPairs} severe=${report.totals.severeSimilarityPairs} exact=${exactNormalizedDuplicates.length}`);
console.log(`[content-audit] SEO identity audited=${seoIdentity.programmaticPages} issues=${seoIdentity.issues.length} duplicateTitles=${seoIdentity.duplicateTitles.length} duplicateDescriptions=${seoIdentity.duplicateDescriptions.length}`);
console.log(`[content-audit] rendered daily facts=${dailyFactIntegrity.dailyPages} errors=${dailyFactIntegrity.failures.length} identicalLocalVectors=${dailyFactIntegrity.identicalLocalFactGroups.length} (human review, not presumed error)`);
console.log(`[content-audit] crossPage month=${crossPageCalendar.matchedMonth}/${crossPageCalendar.monthRows} vrat=${crossPageCalendar.matchedVrat}/${crossPageCalendar.vratRows} contradictions=${crossPageCalendar.contradictions.length} unmatched=${crossPageCalendar.missingCounterparts.length}`);
console.log(`[content-audit] directUnlisted verified=${unlistedAudit.verified}/${unlistedAudit.requested} errors=${unlistedAudit.fetchErrors.length} uniqueTargetUniverse=${unlistedAudit.uniqueTargets}`);
console.log(`[content-audit] disclaimerPages=${report.totals.disclaimerPages}`);
console.log(`[content-audit] CT3 Daily trust reviewed=${dailyTrust.inspected} regressions=${dailyTrust.failures.length}; independent truth remains unverified`);
console.log(`[content-audit] Muhurat trust=${muhuratTrust.inspected} unresolved claims=${muhuratTrust.failures.length}; independent ritual verification still open`);
console.log(`[content-audit] report=${reportPath}`);
if(similarityPairs.length)console.log("[content-audit] top similarity risks:\n"+similarityPairs.slice(0,20).map(pair=>`  ${pair.score} ${pair.left} <> ${pair.right}`).join("\n"));

const fatal=[];
if(fetchErrors.length)fatal.push(`${fetchErrors.length} fetch error(s)`);
if(structuralIssues.length)fatal.push(`${structuralIssues.length} structural issue(s)`);
if(hreflangIssues.length)fatal.push(`${hreflangIssues.length} hreflang reciprocity issue(s)`);
if(duplicateCanonicals.length)fatal.push(`${duplicateCanonicals.length} duplicate canonical owner(s)`);
if(dailyFactIntegrity.failures.length)fatal.push(`${dailyFactIntegrity.failures.length} invalid rendered daily fact(s)`);
if(dailyTrust.failures.length)fatal.push(`${dailyTrust.failures.length} Daily trust claim(s)`);
if(muhuratTrust.failures.length)fatal.push(`${muhuratTrust.failures.length} Muhurat presentation trust issue(s)`);
if(crossPageCalendar.contradictions.length)fatal.push(`${crossPageCalendar.contradictions.length} cross-page lunar contradiction(s)`);
if(onDemandErrors.length)fatal.push(`${onDemandErrors.length} failed direct non-sitemap Daily fact(s)`);
if(seoIdentity.issues.length)fatal.push(`${seoIdentity.issues.length} indexed page identity problem(s)`);
if(seoIdentity.duplicateTitles.length)fatal.push(`${seoIdentity.duplicateTitles.length} duplicate SEO title group(s)`);
if(seoIdentity.duplicateDescriptions.length)fatal.push(`${seoIdentity.duplicateDescriptions.length} duplicate meta description group(s)`);
if(exactNormalizedDuplicates.length)fatal.push(`${exactNormalizedDuplicates.length} exact normalized duplicate group(s)`);
if(report.totals.disclaimerPages)fatal.push(`${report.totals.disclaimerPages} disclaimer-style page(s)`);
if(enforceSimilarity&&report.totals.severeSimilarityPairs)fatal.push(`${report.totals.severeSimilarityPairs} severe similarity pair(s)`);
if(fatal.length){
  console.error(`[content-audit] FAILED: ${fatal.join("; ")}`);
  process.exit(1);
}
console.log("[content-audit] PASS");
