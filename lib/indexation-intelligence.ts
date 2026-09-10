import type {GscIndexInspection,GscTrafficSnapshot} from "./gsc";
import type {OpportunityLifecycleRecord} from "./opportunity-lifecycle";
import type {SearchOpportunity} from "./search-opportunities";

export const INDEXATION_INSPECTION_LIMIT=12;
const SITE_ORIGIN="https://panchvani.com";

export type IndexInspectionSource="SHIPPED"|"OPPORTUNITY"|"TRAFFIC";
export type IndexIssueType="FETCH_ERROR"|"ROBOTS_BLOCK"|"NOINDEX_BLOCK"|"CANONICAL_MISMATCH"|"NOT_INDEXED"|"STALE_CRAWL"|"NO_SITEMAP_SIGNAL"|"UNKNOWN"|"HEALTHY";
export type IndexIssueSeverity="CRITICAL"|"HIGH"|"MEDIUM"|"INFO"|"HEALTHY";

export type IndexInspectionCandidate={
  url:string;
  source:IndexInspectionSource;
  priority:number;
  reason:string;
};

export type IndexationFinding={
  url:string;
  source:IndexInspectionSource;
  severity:IndexIssueSeverity;
  issue:IndexIssueType;
  verdict:string;
  coverageState:string;
  pageFetchState:string;
  indexingState:string;
  robotsTxtState:string;
  googleCanonical:string|null;
  userCanonical:string|null;
  lastCrawlTime:string|null;
  crawlAgeDays:number|null;
  sitemapCount:number;
  action:string;
  evidence:string;
  inspectedAt:string;
};

export type IndexationIntelligenceSummary={
  inspected:number;
  healthy:number;
  critical:number;
  high:number;
  medium:number;
  info:number;
  indexedPass:number;
  canonicalMismatches:number;
  crawlBlocks:number;
  fetchErrors:number;
};

function cleanUrl(raw:string|null|undefined){
  if(!raw)return null;
  try{
    const url=new URL(raw,SITE_ORIGIN);
    if(url.protocol!=="https:"&&url.protocol!=="http:")return null;
    url.hash="";url.search="";
    return url.toString().replace(/\/$/,"")||SITE_ORIGIN;
  }catch{return null;}
}

function pathOnly(raw:string|null|undefined){
  const url=cleanUrl(raw);if(!url)return null;
  try{return new URL(url).pathname.replace(/\/$/,"")||"/";}catch{return null;}
}

function sameCanonical(a:string|null,b:string|null){
  const ap=pathOnly(a),bp=pathOnly(b);
  return Boolean(ap&&bp&&ap===bp);
}

function addCandidate(map:Map<string,IndexInspectionCandidate>,candidate:IndexInspectionCandidate){
  const url=cleanUrl(candidate.url);if(!url)return;
  const current=map.get(url);
  if(!current||candidate.priority>current.priority)map.set(url,{...candidate,url});
}

export function selectIndexInspectionCandidates(
  snapshot:GscTrafficSnapshot,
  opportunities:SearchOpportunity[],
  records:Record<string,OpportunityLifecycleRecord>,
  limit=INDEXATION_INSPECTION_LIMIT
){
  const candidates=new Map<string,IndexInspectionCandidate>();

  for(const record of Object.values(records)){
    const implementation=record.implementations?.find(item=>item.id===record.shippedImplementationId);
    const url=implementation?.deployedUrl??(record.shippedAt&&record.context?.recommendedPath?`${SITE_ORIGIN}${record.context.recommendedPath}`:null);
    if(url)addCandidate(candidates,{url,source:"SHIPPED",priority:100,reason:`Attributed shipped implementation ${record.shippedImplementationId??record.key}.`});
  }

  for(const item of opportunities){
    if(item.status==="NEW_CLUSTER"||item.status==="NO_CLEAR_LANDING")continue;
    addCandidate(candidates,{url:`${SITE_ORIGIN}${item.recommendedPath}`,source:"OPPORTUNITY",priority:70+Math.min(25,Math.round(item.score/4)),reason:`${item.status.replaceAll("_"," ")} · opportunity ${item.score}/100 · ${Math.round(item.impressions)} impressions.`});
  }

  const trafficRows=snapshot.pages.slice().sort((a,b)=>(b.impressions??0)-(a.impressions??0)||(b.clicks??0)-(a.clicks??0));
  for(const row of trafficRows.slice(0,100)){
    const url=row.keys?.[0];if(!url)continue;
    addCandidate(candidates,{url,source:"TRAFFIC",priority:50+Math.min(20,Math.round(Math.log10((row.impressions??0)+1)*7)),reason:`Top GSC landing · ${Math.round(row.impressions??0)} impressions · ${Math.round(row.clicks??0)} clicks.`});
  }

  return [...candidates.values()].sort((a,b)=>b.priority-a.priority||a.url.localeCompare(b.url)).slice(0,Math.max(1,limit));
}

function crawlAgeDays(lastCrawlTime:string|null,asOf:Date){
  if(!lastCrawlTime)return null;
  const time=new Date(lastCrawlTime).getTime();
  if(Number.isNaN(time))return null;
  return Math.max(0,Math.floor((asOf.getTime()-time)/86_400_000));
}

function classify(inspection:GscIndexInspection,asOf:Date):Omit<IndexationFinding,"url"|"source"|"verdict"|"coverageState"|"pageFetchState"|"indexingState"|"robotsTxtState"|"googleCanonical"|"userCanonical"|"lastCrawlTime"|"sitemapCount"|"inspectedAt">{
  const age=crawlAgeDays(inspection.lastCrawlTime,asOf);
  const coverage=inspection.coverageState.toLowerCase();
  const fetch=inspection.pageFetchState;
  const indexing=inspection.indexingState;
  const robots=inspection.robotsTxtState;

  if(robots==="DISALLOWED"||fetch==="BLOCKED_ROBOTS_TXT")return {severity:"CRITICAL",issue:"ROBOTS_BLOCK",crawlAgeDays:age,action:"Remove unintended robots.txt blocking for this indexable URL, then re-inspect after Google recrawls it.",evidence:`robots=${robots} · fetch=${fetch} · coverage=${inspection.coverageState}`};
  if(indexing==="BLOCKED_BY_META_TAG"||indexing==="BLOCKED_BY_HTTP_HEADER")return {severity:"CRITICAL",issue:"NOINDEX_BLOCK",crawlAgeDays:age,action:"Remove unintended noindex from the canonical owner before requesting recrawl or expanding internal links.",evidence:`indexing=${indexing} · coverage=${inspection.coverageState}`};
  if(fetch!=="SUCCESSFUL"&&fetch!=="PAGE_FETCH_STATE_UNSPECIFIED")return {severity:fetch==="SERVER_ERROR"||fetch==="NOT_FOUND"||fetch==="ACCESS_FORBIDDEN"?"CRITICAL":"HIGH",issue:"FETCH_ERROR",crawlAgeDays:age,action:"Fix the fetch/HTTP response first. Do not treat content or internal-link changes as the primary remedy while Google cannot retrieve the URL reliably.",evidence:`pageFetchState=${fetch} · verdict=${inspection.verdict}`};
  if(inspection.googleCanonical&&inspection.userCanonical&&!sameCanonical(inspection.googleCanonical,inspection.userCanonical))return {severity:"HIGH",issue:"CANONICAL_MISMATCH",crawlAgeDays:age,action:"Audit duplicate/content/internal-link signals and make the intended canonical materially stronger; verify the declared canonical is correct before changing it.",evidence:`Declared ${pathOnly(inspection.userCanonical)} · Google selected ${pathOnly(inspection.googleCanonical)}.`};
  if(inspection.verdict==="FAIL"||inspection.verdict==="NEUTRAL"||/not indexed|currently not indexed|discovered|excluded/.test(coverage))return {severity:inspection.verdict==="FAIL"?"HIGH":"MEDIUM",issue:"NOT_INDEXED",crawlAgeDays:age,action:"Diagnose coverage state, content uniqueness, discovery and canonical signals before adding more similar URLs to indexable expansion.",evidence:`verdict=${inspection.verdict} · coverage=${inspection.coverageState}`};
  if(age!==null&&age>45)return {severity:"MEDIUM",issue:"STALE_CRAWL",crawlAgeDays:age,action:"Check whether the page still receives internal-link and sitemap reinforcement; avoid forced changes if the page is otherwise indexed and stable.",evidence:`Last Google crawl was ${age} days ago.`};
  if(!inspection.sitemaps.length)return {severity:"INFO",issue:"NO_SITEMAP_SIGNAL",crawlAgeDays:age,action:"Verify sitemap membership locally. Treat this as an informational signal because URL Inspection sitemap data is not guaranteed to be exhaustive.",evidence:"Google URL Inspection did not report a known sitemap for this URL."};
  if(inspection.verdict==="PASS")return {severity:"HEALTHY",issue:"HEALTHY",crawlAgeDays:age,action:"No indexation intervention required. Preserve the current canonical/crawl configuration and continue normal measurement.",evidence:`PASS · ${inspection.coverageState} · ${inspection.sitemaps.length} sitemap signal(s).`};
  return {severity:"INFO",issue:"UNKNOWN",crawlAgeDays:age,action:"Keep monitoring and inspect manually if this URL is strategically important; current API fields are not conclusive.",evidence:`verdict=${inspection.verdict} · coverage=${inspection.coverageState}`};
}

export function analyzeIndexInspections(
  inspections:GscIndexInspection[],
  candidates:IndexInspectionCandidate[],
  asOf=new Date()
):IndexationFinding[]{
  const byUrl=new Map(candidates.map(candidate=>[cleanUrl(candidate.url),candidate]));
  const severityOrder:Record<IndexIssueSeverity,number>={CRITICAL:0,HIGH:1,MEDIUM:2,INFO:3,HEALTHY:4};
  return inspections.map(inspection=>{
    const normalized=cleanUrl(inspection.inspectedUrl);
    const candidate=byUrl.get(normalized)??{url:inspection.inspectedUrl,source:"TRAFFIC" as const,priority:0,reason:"Direct inspection"};
    const result=classify(inspection,asOf);
    return {
      url:inspection.inspectedUrl,source:candidate.source,
      severity:result.severity,issue:result.issue,verdict:inspection.verdict,coverageState:inspection.coverageState,
      pageFetchState:inspection.pageFetchState,indexingState:inspection.indexingState,robotsTxtState:inspection.robotsTxtState,
      googleCanonical:inspection.googleCanonical,userCanonical:inspection.userCanonical,lastCrawlTime:inspection.lastCrawlTime,
      crawlAgeDays:result.crawlAgeDays,sitemapCount:inspection.sitemaps.length,action:result.action,evidence:result.evidence,inspectedAt:inspection.inspectedAt
    };
  }).sort((a,b)=>severityOrder[a.severity]-severityOrder[b.severity]||a.url.localeCompare(b.url));
}

export function summarizeIndexation(findings:IndexationFinding[]):IndexationIntelligenceSummary{
  const count=(severity:IndexIssueSeverity)=>findings.filter(item=>item.severity===severity).length;
  return {
    inspected:findings.length,healthy:count("HEALTHY"),critical:count("CRITICAL"),high:count("HIGH"),medium:count("MEDIUM"),info:count("INFO"),
    indexedPass:findings.filter(item=>item.verdict==="PASS").length,
    canonicalMismatches:findings.filter(item=>item.issue==="CANONICAL_MISMATCH").length,
    crawlBlocks:findings.filter(item=>item.issue==="ROBOTS_BLOCK"||item.issue==="NOINDEX_BLOCK").length,
    fetchErrors:findings.filter(item=>item.issue==="FETCH_ERROR").length
  };
}
