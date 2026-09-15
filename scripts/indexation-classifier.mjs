import {readFile,writeFile} from "node:fs/promises";
import {pathToFileURL} from "node:url";

export const AUDIT_PRIORITY_CITIES=[
  "mumbai","delhi","bengaluru","hyderabad","ahmedabad",
  "chennai","kolkata","surat","pune","jaipur",
  "lucknow","kanpur","nagpur","indore","thane",
  "bhopal","visakhapatnam","patna","vadodara","varanasi"
];

export const AUDIT_PRIMARY_MUHURAT_EVENTS=["wedding","griha-pravesh","vehicle-purchase"];

const priorityCities=new Set(AUDIT_PRIORITY_CITIES);
const primaryMuhuratEvents=new Set(AUDIT_PRIMARY_MUHURAT_EVENTS);

function indiaDayFromIso(iso){
  const instant=new Date(iso);
  if(Number.isNaN(instant.getTime()))throw new Error(`Invalid audit timestamp: ${iso}`);
  return new Date(instant.getTime()+330*60_000);
}

function isoDay(date){return date.toISOString().slice(0,10);}
function dayDistance(targetIso,referenceIso){
  const target=new Date(`${targetIso}T00:00:00Z`);
  const reference=new Date(`${referenceIso}T00:00:00Z`);
  return Math.round((target.getTime()-reference.getTime())/86_400_000);
}
function monthDistance(year,month,referenceIso){
  const reference=new Date(`${referenceIso}T00:00:00Z`);
  return year*12+(month-1)-(reference.getUTCFullYear()*12+reference.getUTCMonth());
}
function validMonth(raw){return /^(0[1-9]|1[0-2])$/.test(raw);}
function validYear(raw){return /^\d{4}$/.test(raw)&&Number(raw)>=1900&&Number(raw)<=2100;}
function validIsoDate(raw){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(raw))return false;
  const value=new Date(`${raw}T00:00:00Z`);
  return !Number.isNaN(value.getTime())&&value.toISOString().slice(0,10)===raw;
}

function result(classification,reason,family,detail){return {classification,reason,family,...(detail?{detail}:{})};}

export function classifyOutsideUrl(rawUrl,referenceIso){
  let url;
  try{url=new URL(rawUrl);}catch{return result("needs_review","INVALID_URL","unknown");}
  const parts=url.pathname.split("/").filter(Boolean);
  const currentYear=Number(referenceIso.slice(0,4));
  const yearlyMuhuratYears=new Set([currentYear-1,currentYear,currentYear+1,currentYear+2]);

  if(parts[0]==="panchang"&&parts.length===2){
    return result("intentional_exclusion","TODAY_ALIAS_CANONICALIZES_TO_DATED_PAGE","panchang-today-alias");
  }

  if(parts[0]==="panchang"&&parts.length===3&&priorityCities.has(parts[1])&&validIsoDate(parts[2])){
    const delta=dayDistance(parts[2],referenceIso);
    if(Math.abs(delta)<=45){
      return result("indexable_candidate","DAILY_METADATA_INDEXABLE_OUTSIDE_SITEMAP","panchang-daily",`dayOffset=${delta}`);
    }
    return result("intentional_exclusion","DAILY_OUTSIDE_45_DAY_INDEX_WINDOW","panchang-daily",`dayOffset=${delta}`);
  }

  if(parts[0]==="calendar"&&parts.length===4&&priorityCities.has(parts[1])&&validYear(parts[2])&&validMonth(parts[3])){
    const distance=monthDistance(Number(parts[2]),Number(parts[3]),referenceIso);
    if(distance>=-3&&distance<=12){
      return result("indexable_candidate","MONTHLY_METADATA_INDEXABLE_OUTSIDE_SITEMAP","calendar-month",`monthOffset=${distance}`);
    }
    return result("intentional_exclusion","MONTHLY_OUTSIDE_INDEX_WINDOW","calendar-month",`monthOffset=${distance}`);
  }

  if(parts[0]==="festivals"&&(parts.length===3||parts.length===4)){
    return result("intentional_exclusion","FESTIVAL_VALIDATION_OR_CITY_POLICY_EXCLUSION",parts.length===4?"festival-city":"festival-year");
  }

  if(parts[0]==="muhurat"&&(parts.length===4||parts.length===5)&&validYear(parts[2])&&validMonth(parts[3])){
    const event=parts[1];
    const year=Number(parts[2]);
    const city=parts.length===5?parts[4]:null;
    const metadataIndexable=primaryMuhuratEvents.has(event)&&yearlyMuhuratYears.has(year)&&(!city||priorityCities.has(city));
    if(metadataIndexable){
      return result("indexable_candidate","MUHURAT_METADATA_INDEXABLE_OUTSIDE_ROLLING_SITEMAP",city?"muhurat-city-month":"muhurat-month");
    }
    return result("intentional_exclusion","MUHURAT_EVENT_YEAR_OR_CITY_POLICY_EXCLUSION",city?"muhurat-city-month":"muhurat-month");
  }

  if((parts[0]==="gold-rate")||(parts[0]==="tools"&&parts[1]==="gold-value-calculator")){
    return result("needs_review","DYNAMIC_GOLD_ACCURACY_GATE_REQUIRES_LIVE_CHECK",parts[0]==="gold-rate"?"gold-rate":"gold-value-calculator");
  }

  return result("needs_review","UNCLASSIFIED_ROUTE_FAMILY",parts[0]||"root");
}

function extractNoindex(html,headers={}){
  const header=String(headers["x-robots-tag"]||headers.get?.("x-robots-tag")||"").toLowerCase();
  if(header.includes("noindex"))return true;
  for(const match of html.matchAll(/<meta\b[^>]*>/gi)){
    const tag=match[0];
    const name=tag.match(/(?:name|property)=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if(name!=="robots"&&name!=="googlebot")continue;
    const content=tag.match(/content=["']([^"']*)["']/i)?.[1]?.toLowerCase()||"";
    if(content.includes("noindex"))return true;
  }
  return false;
}

export async function resolveDynamicClassification(row,{fetchImpl=fetch,timeoutMs=10000}={}){
  if(row.reason!=="DYNAMIC_GOLD_ACCURACY_GATE_REQUIRES_LIVE_CHECK")return row;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetchImpl(row.url,{redirect:"manual",headers:{"user-agent":"Panchvani-Indexation-Classifier/1.0","accept":"text/html"},signal:controller.signal});
    const html=await response.text();
    clearTimeout(timer);
    if(response.status!==200)return {...row,classification:"needs_review",reason:"DYNAMIC_GATE_LIVE_CHECK_NON_200",detail:`HTTP ${response.status}`};
    if(extractNoindex(html,response.headers))return {...row,classification:"intentional_exclusion",reason:"DYNAMIC_GOLD_ACCURACY_GATE_NOINDEX",detail:"Live page emits noindex while the accuracy gate is closed."};
    return {...row,classification:"indexable_candidate",reason:"DYNAMIC_GOLD_GATE_OPEN_OUTSIDE_SITEMAP",detail:"Live page is indexable but absent from the audited sitemap set."};
  }catch(error){
    clearTimeout(timer);
    return {...row,classification:"needs_review",reason:"DYNAMIC_GATE_LIVE_CHECK_FAILED",detail:String(error)};
  }
}

function aggregate(rows){
  const counts={indexableCandidates:0,intentionalExclusions:0,needsReview:0};
  const byFamily=new Map();
  const byReason=new Map();
  for(const row of rows){
    if(row.classification==="indexable_candidate")counts.indexableCandidates++;
    else if(row.classification==="intentional_exclusion")counts.intentionalExclusions++;
    else counts.needsReview++;
    const family=byFamily.get(row.family)||{family:row.family,total:0,indexableCandidates:0,intentionalExclusions:0,needsReview:0,inboundLinks:0};
    family.total++;
    family.inboundLinks+=row.inboundLinks||0;
    if(row.classification==="indexable_candidate")family.indexableCandidates++;
    else if(row.classification==="intentional_exclusion")family.intentionalExclusions++;
    else family.needsReview++;
    byFamily.set(row.family,family);
    const key=`${row.classification}:${row.reason}`;
    const reason=byReason.get(key)||{classification:row.classification,reason:row.reason,count:0,inboundLinks:0};
    reason.count++;
    reason.inboundLinks+=row.inboundLinks||0;
    byReason.set(key,reason);
  }
  return {
    ...counts,
    byFamily:[...byFamily.values()].sort((a,b)=>b.total-a.total||a.family.localeCompare(b.family)),
    byReason:[...byReason.values()].sort((a,b)=>b.count-a.count||a.reason.localeCompare(b.reason)),
    candidateSample:rows.filter(row=>row.classification==="indexable_candidate").sort((a,b)=>(b.inboundLinks||0)-(a.inboundLinks||0)).slice(0,25),
    needsReviewSample:rows.filter(row=>row.classification==="needs_review").sort((a,b)=>(b.inboundLinks||0)-(a.inboundLinks||0)).slice(0,25),
  };
}

export async function classifyReport(report,{fetchImpl=fetch}={}){
  const referenceIso=isoDay(indiaDayFromIso(report.generatedAt));
  const classified=[];
  for(const item of report.linkedOutsideSitemap||[]){
    let row={...item,...classifyOutsideUrl(item.url,referenceIso)};
    if(row.classification==="needs_review"&&row.reason==="DYNAMIC_GOLD_ACCURACY_GATE_REQUIRES_LIVE_CHECK"){
      row=await resolveDynamicClassification(row,{fetchImpl});
    }
    classified.push(row);
  }
  report.linkedOutsideSitemap=classified;
  const summary=aggregate(classified);
  report.indexationClassification={referenceIndiaDate:referenceIso,total:classified.length,...summary};

  report.warnings=(report.warnings||[]).filter(item=>item.code!=="LINKED_OUTSIDE_SITEMAP"&&item.code!=="INDEXABLE_OUTSIDE_SITEMAP"&&item.code!=="OUTSIDE_SITEMAP_NEEDS_REVIEW");
  if(summary.indexableCandidates){
    report.warnings.push({code:"INDEXABLE_OUTSIDE_SITEMAP",message:`${summary.indexableCandidates} internally linked URLs are metadata-indexable but absent from the audited sitemap set.`,sample:summary.candidateSample});
  }
  if(summary.needsReview){
    report.warnings.push({code:"OUTSIDE_SITEMAP_NEEDS_REVIEW",message:`${summary.needsReview} internally linked URLs could not be safely classified from current indexation policy.`,sample:summary.needsReviewSample});
  }

  report.summary={
    ...(report.summary||{}),
    warnings:report.warnings.length,
    linkedOutsideSitemap:classified.length,
    outsideSitemapIndexableCandidates:summary.indexableCandidates,
    outsideSitemapIntentionalExclusions:summary.intentionalExclusions,
    outsideSitemapNeedsReview:summary.needsReview,
  };
  return report;
}

function markdownClassification(report){
  const c=report.indexationClassification;
  if(!c)return "";
  const families=c.byFamily.map(row=>`- ${row.family}: ${row.total} total · ${row.indexableCandidates} candidate · ${row.intentionalExclusions} intentional · ${row.needsReview} review`).join("\n");
  const reasons=c.byReason.map(row=>`- ${row.classification} · ${row.reason}: ${row.count}`).join("\n");
  return [
    "",
    "## Linked-outside-sitemap classification",
    "",
    `- India reference date: ${c.referenceIndiaDate}`,
    `- Indexable candidates: ${c.indexableCandidates}`,
    `- Intentional exclusions: ${c.intentionalExclusions}`,
    `- Needs review: ${c.needsReview}`,
    "",
    "### Route families",
    families||"- None",
    "",
    "### Reasons",
    reasons||"- None",
    ""
  ].join("\n");
}

export async function main(){
  const jsonPath="artifacts/pre-gsc-audit.json";
  const mdPath="artifacts/pre-gsc-audit.md";
  const report=JSON.parse(await readFile(jsonPath,"utf8"));
  await classifyReport(report);
  await writeFile(jsonPath,JSON.stringify(report,null,2));
  const currentMd=await readFile(mdPath,"utf8").catch(()=>"# Panchvani Pre-GSC Live Audit\n");
  const cleaned=currentMd.replace(/\n## Linked-outside-sitemap classification[\s\S]*$/m,"");
  await writeFile(mdPath,`${cleaned.trimEnd()}\n${markdownClassification(report)}`);
  console.log("\n=== INDEXATION CLASSIFICATION ===");
  console.log(JSON.stringify({
    referenceIndiaDate:report.indexationClassification.referenceIndiaDate,
    total:report.indexationClassification.total,
    indexableCandidates:report.indexationClassification.indexableCandidates,
    intentionalExclusions:report.indexationClassification.intentionalExclusions,
    needsReview:report.indexationClassification.needsReview,
  },null,2));
}

const direct=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(direct)main().catch(error=>{console.error(error);process.exitCode=1;});
