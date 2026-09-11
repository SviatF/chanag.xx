import {mkdir,writeFile} from "node:fs/promises";

const BASE=(process.env.AUDIT_BASE_URL||"https://panchvani.com").replace(/\/$/,"");
const ORIGIN=new URL(BASE).origin;
const CONCURRENCY=Math.max(1,Number(process.env.AUDIT_CONCURRENCY||6));
const TIMEOUT_MS=Math.max(3000,Number(process.env.AUDIT_TIMEOUT_MS||15000));
const MAX_URLS=Math.max(0,Number(process.env.AUDIT_MAX_URLS||0));
const USER_AGENT="Panchvani-PreGSC-Audit/1.0 (+technical indexation check)";
const EXPECTED_SITEMAPS=[
  "sitemap-core.xml",
  "sitemap-panchang-daily.xml",
  "sitemap-panchang-monthly.xml",
  "sitemap-yearly.xml",
  "sitemap-festivals.xml",
  "sitemap-vrat.xml",
  "sitemap-muhurat.xml",
  "sitemap-regional.xml",
  "sitemap-tools.xml",
  "sitemap-knowledge.xml"
];

const report={
  generatedAt:new Date().toISOString(),
  baseUrl:BASE,
  blockers:[],
  warnings:[],
  summary:{},
  sitemaps:[],
  pages:[],
  orphanUrls:[],
  linkedOutsideSitemap:[],
  duplicateCanonicals:[],
  hreflangIssues:[]
};

function addBlocker(code,message,details={}){report.blockers.push({code,message,...details});}
function addWarning(code,message,details={}){report.warnings.push({code,message,...details});}
function decodeXml(value){return value.replaceAll("&amp;","&").replaceAll("&lt;","<").replaceAll("&gt;",">").replaceAll("&quot;",'"').replaceAll("&apos;","'");}
function extractLocs(xml){return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(match=>decodeXml(match[1].trim()));}
function normalizeUrl(raw){
  try{
    const url=new URL(raw,BASE);
    url.hash="";
    if(url.pathname!=="/"&&url.pathname.endsWith("/"))url.pathname=url.pathname.replace(/\/+$/,"");
    return url.toString();
  }catch{return null;}
}
function sameOrigin(raw){try{return new URL(raw,BASE).origin===ORIGIN;}catch{return false;}}
function attrs(tag){
  const result={};
  for(const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))result[match[1].toLowerCase()]=match[2]??match[3]??match[4]??"";
  return result;
}
function tags(html,name){return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`,"gi"))].map(match=>match[0]);}
function extractCanonical(html){
  for(const tag of tags(html,"link")){
    const a=attrs(tag);
    const rel=(a.rel||"").toLowerCase().split(/\s+/);
    if(rel.includes("canonical")&&a.href)return normalizeUrl(a.href);
  }
  return null;
}
function extractRobots(html){
  const values=[];
  for(const tag of tags(html,"meta")){
    const a=attrs(tag);
    const name=(a.name||a.property||"").toLowerCase();
    if(name==="robots"||name==="googlebot")values.push((a.content||"").toLowerCase());
  }
  return values;
}
function extractAlternates(html){
  const values=[];
  for(const tag of tags(html,"link")){
    const a=attrs(tag);
    const rel=(a.rel||"").toLowerCase().split(/\s+/);
    if(rel.includes("alternate")&&a.hreflang&&a.href){
      const href=normalizeUrl(a.href);
      if(href)values.push({hreflang:a.hreflang.toLowerCase(),href});
    }
  }
  return values;
}
function extractAnchors(html){
  const values=[];
  for(const tag of tags(html,"a")){
    const a=attrs(tag);
    if(!a.href)continue;
    const href=normalizeUrl(a.href);
    if(href)values.push(href);
  }
  return values;
}
function extractTitle(html){const match=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);return match?match[1].replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim():"";}
function h1Count(html){return (html.match(/<h1\b/gi)||[]).length;}
function shouldIgnoreLinkedUrl(raw){
  try{
    const u=new URL(raw);
    const p=u.pathname;
    return u.origin!==ORIGIN||u.search||p.startsWith("/admin")||p.startsWith("/api/")||p.startsWith("/_next/")||p.startsWith("/favicon")||p==="/robots.txt"||p.endsWith(".xml")||/\.(?:webp|png|jpe?g|svg|ico|css|js|woff2?|ttf|map)$/i.test(p);
  }catch{return true;}
}
function robotsBlocksPath(pathname,disallows){
  return disallows.some(rule=>rule&&rule!=="/"?pathname.startsWith(rule):rule==="/");
}

async function fetchText(url,{retries=2}={}){
  let lastError;
  for(let attempt=0;attempt<=retries;attempt++){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),TIMEOUT_MS);
    try{
      const response=await fetch(url,{redirect:"manual",headers:{"user-agent":USER_AGENT,"accept":"text/html,application/xml,text/xml,text/plain;q=0.9,*/*;q=0.8"},signal:controller.signal});
      const text=await response.text();
      clearTimeout(timer);
      if([429,500,502,503,504].includes(response.status)&&attempt<retries){
        await new Promise(resolve=>setTimeout(resolve,400*(attempt+1)));
        continue;
      }
      return {ok:true,status:response.status,headers:Object.fromEntries(response.headers.entries()),text,bytes:Buffer.byteLength(text),url};
    }catch(error){
      clearTimeout(timer);
      lastError=error;
      if(attempt<retries){await new Promise(resolve=>setTimeout(resolve,400*(attempt+1)));continue;}
    }
  }
  return {ok:false,status:0,headers:{},text:"",bytes:0,url,error:String(lastError)};
}

async function pool(items,worker,limit=CONCURRENCY){
  const output=new Array(items.length);
  let cursor=0;
  async function run(){
    while(true){
      const index=cursor++;
      if(index>=items.length)return;
      output[index]=await worker(items[index],index);
    }
  }
  await Promise.all(Array.from({length:Math.min(limit,Math.max(1,items.length))},()=>run()));
  return output;
}

function checkStatus(label,result,url){
  if(!result.ok){addBlocker("NETWORK_ERROR",`${label} could not be fetched.`,{url,error:result.error});return false;}
  if(result.status>=300&&result.status<400){addBlocker("UNEXPECTED_REDIRECT",`${label} redirects instead of returning 200.`,{url,status:result.status,location:result.headers.location||null});return false;}
  if(result.status!==200){addBlocker("NON_200",`${label} returned HTTP ${result.status}.`,{url,status:result.status});return false;}
  return true;
}

async function main(){
  await mkdir("artifacts",{recursive:true});

  const home=await fetchText(`${BASE}/`);
  checkStatus("Homepage",home,`${BASE}/`);
  if(home.ok&&home.status===200&&!String(home.headers["content-type"]||"").includes("text/html"))addBlocker("HOME_CONTENT_TYPE","Homepage is not served as HTML.",{contentType:home.headers["content-type"]||null});

  const robotsUrl=`${BASE}/robots.txt`;
  const robots=await fetchText(robotsUrl);
  const disallows=[];
  if(checkStatus("robots.txt",robots,robotsUrl)){
    const body=robots.text;
    if(!/^\s*user-agent:\s*\*/im.test(body))addBlocker("ROBOTS_USER_AGENT","robots.txt does not define User-agent: *.");
    if(!new RegExp(`^\\s*sitemap:\\s*${BASE.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}/sitemap\\.xml\\s*$`,`im`).test(body))addBlocker("ROBOTS_SITEMAP","robots.txt does not advertise the canonical sitemap index.",{expected:`${BASE}/sitemap.xml`});
    for(const match of body.matchAll(/^\s*disallow:\s*([^#\r\n]*)/gim))disallows.push(match[1].trim());
    if(disallows.includes("/"))addBlocker("ROBOTS_BLOCK_ALL","robots.txt blocks the entire site with Disallow: /.");
  }

  const indexUrl=`${BASE}/sitemap.xml`;
  const sitemapIndex=await fetchText(indexUrl);
  let sitemapUrls=[];
  if(checkStatus("sitemap.xml",sitemapIndex,indexUrl)){
    if(!String(sitemapIndex.headers["content-type"]||"").includes("xml"))addWarning("SITEMAP_CONTENT_TYPE","sitemap.xml does not advertise an XML content type.",{contentType:sitemapIndex.headers["content-type"]||null});
    sitemapUrls=extractLocs(sitemapIndex.text).map(normalizeUrl).filter(Boolean);
    if(!sitemapUrls.length)addBlocker("EMPTY_SITEMAP_INDEX","sitemap.xml contains no child sitemap URLs.");
    for(const name of EXPECTED_SITEMAPS){
      const expected=normalizeUrl(`${BASE}/${name}`);
      if(!sitemapUrls.includes(expected))addBlocker("MISSING_CHILD_SITEMAP",`${name} is missing from sitemap.xml.`,{sitemap:name});
    }
    for(const url of sitemapUrls){
      if(!sameOrigin(url))addBlocker("FOREIGN_SITEMAP_ORIGIN","Sitemap index references another origin.",{url});
      if(!url.startsWith("https://"))addBlocker("INSECURE_SITEMAP_URL","Sitemap index contains a non-HTTPS URL.",{url});
    }
  }

  const childResults=await pool(sitemapUrls,async url=>({url,result:await fetchText(url)}),Math.min(CONCURRENCY,5));
  const urlOwners=new Map();
  for(const item of childResults){
    const name=new URL(item.url).pathname.slice(1);
    const info={name,url:item.url,status:item.result.status,bytes:item.result.bytes,urlCount:0};
    report.sitemaps.push(info);
    if(!checkStatus(name,item.result,item.url))continue;
    if(item.result.bytes>50_000_000)addBlocker("SITEMAP_TOO_LARGE",`${name} exceeds the 50 MB uncompressed sitemap limit.`,{bytes:item.result.bytes});
    const locs=extractLocs(item.result.text).map(normalizeUrl).filter(Boolean);
    info.urlCount=locs.length;
    if(!locs.length)addBlocker("EMPTY_CHILD_SITEMAP",`${name} contains no URLs.`,{sitemap:name});
    if(locs.length>50_000)addBlocker("SITEMAP_URL_LIMIT",`${name} exceeds 50,000 URLs.`,{count:locs.length});
    const localSeen=new Set();
    for(const url of locs){
      if(localSeen.has(url))addBlocker("DUPLICATE_WITHIN_SITEMAP",`${name} contains a duplicate URL.`,{url,sitemap:name});
      localSeen.add(url);
      if(!sameOrigin(url))addBlocker("FOREIGN_PAGE_ORIGIN",`${name} contains a URL on another origin.`,{url,sitemap:name});
      if(!url.startsWith("https://"))addBlocker("INSECURE_PAGE_URL",`${name} contains a non-HTTPS URL.`,{url,sitemap:name});
      const owners=urlOwners.get(url)||[];
      owners.push(name);
      urlOwners.set(url,owners);
    }
  }

  for(const [url,owners] of urlOwners){
    if(owners.length>1)addBlocker("CROSS_SITEMAP_DUPLICATE","The same indexable URL appears in multiple child sitemaps.",{url,sitemaps:owners});
  }

  let pageUrls=[...urlOwners.keys()];
  if(MAX_URLS>0)pageUrls=pageUrls.slice(0,MAX_URLS);
  const sitemapSet=new Set(pageUrls);
  const pageMap=new Map();
  const canonicalOwners=new Map();
  const inbound=new Map(pageUrls.map(url=>[url,0]));
  const linkedOutside=new Map();

  const pageResults=await pool(pageUrls,async url=>{
    const result=await fetchText(url);
    const row={url,status:result.status,contentType:result.headers["content-type"]||null,canonical:null,robots:[],xRobots:result.headers["x-robots-tag"]||null,title:"",h1Count:0,alternates:[],links:[]};
    report.pages.push(row);
    if(!checkStatus("Sitemap URL",result,url))return row;
    if(robotsBlocksPath(new URL(url).pathname,disallows))addBlocker("ROBOTS_BLOCKS_SITEMAP_URL","robots.txt blocks a URL that is present in a sitemap.",{url});
    const contentType=String(result.headers["content-type"]||"");
    if(!contentType.includes("text/html")){
      addBlocker("NON_HTML_SITEMAP_URL","A page URL in the sitemap does not return HTML.",{url,contentType});
      return row;
    }
    row.canonical=extractCanonical(result.text);
    row.robots=extractRobots(result.text);
    row.title=extractTitle(result.text);
    row.h1Count=h1Count(result.text);
    row.alternates=extractAlternates(result.text);
    row.links=extractAnchors(result.text).filter(sameOrigin);

    const noindex=[...row.robots,String(row.xRobots||"").toLowerCase()].some(value=>value.includes("noindex"));
    if(noindex)addBlocker("NOINDEX_IN_SITEMAP","An indexable sitemap URL emits noindex.",{url,robots:row.robots,xRobots:row.xRobots});
    if(!row.canonical)addBlocker("MISSING_CANONICAL","A sitemap URL has no canonical link.",{url});
    else{
      if(normalizeUrl(row.canonical)!==normalizeUrl(url))addBlocker("CANONICAL_MISMATCH","Canonical does not match the sitemap URL.",{url,canonical:row.canonical});
      const owners=canonicalOwners.get(row.canonical)||[];
      owners.push(url);
      canonicalOwners.set(row.canonical,owners);
    }
    if(!row.title)addBlocker("MISSING_TITLE","A sitemap URL has no <title>.",{url});
    if(row.h1Count!==1)addWarning("H1_COUNT",`Expected one H1 but found ${row.h1Count}.`,{url,count:row.h1Count});
    return row;
  });

  for(const row of pageResults)pageMap.set(row.url,row);
  for(const [canonical,owners] of canonicalOwners){
    const unique=[...new Set(owners)];
    if(unique.length>1){
      const issue={canonical,urls:unique};
      report.duplicateCanonicals.push(issue);
      addBlocker("DUPLICATE_CANONICAL","Multiple sitemap URLs resolve to the same canonical.",issue);
    }
  }

  for(const row of pageResults){
    for(const href of row.links){
      const normalized=normalizeUrl(href);
      if(!normalized||normalized===row.url)continue;
      if(sitemapSet.has(normalized))inbound.set(normalized,(inbound.get(normalized)||0)+1);
      else if(!shouldIgnoreLinkedUrl(normalized))linkedOutside.set(normalized,(linkedOutside.get(normalized)||0)+1);
    }
  }

  const orphanExempt=new Set([normalizeUrl(`${BASE}/`),normalizeUrl(`${BASE}/cities`),normalizeUrl(`${BASE}/regional`),normalizeUrl(`${BASE}/muhurat`),normalizeUrl(`${BASE}/tools`),normalizeUrl(`${BASE}/knowledge`),normalizeUrl(`${BASE}/festivals`),normalizeUrl(`${BASE}/vrat`)]);
  report.orphanUrls=[...inbound.entries()].filter(([url,count])=>count===0&&!orphanExempt.has(url)).map(([url])=>url);
  if(report.orphanUrls.length)addWarning("ORPHAN_SITEMAP_URLS",`${report.orphanUrls.length} sitemap URLs have no detected internal inbound link from another audited sitemap page.`,{sample:report.orphanUrls.slice(0,25)});

  report.linkedOutsideSitemap=[...linkedOutside.entries()].sort((a,b)=>b[1]-a[1]).map(([url,inboundLinks])=>({url,inboundLinks}));
  if(report.linkedOutsideSitemap.length)addWarning("LINKED_OUTSIDE_SITEMAP",`${report.linkedOutsideSitemap.length} same-origin HTML URLs are internally linked but absent from the audited sitemap set.`,{sample:report.linkedOutsideSitemap.slice(0,25)});

  for(const row of pageResults.filter(item=>item.url.includes("/regional/")&&item.alternates.length)){
    const self=row.alternates.some(alt=>alt.href===row.url);
    if(!self){
      const issue={url:row.url,type:"missing-self-reference"};
      report.hreflangIssues.push(issue);
      addBlocker("HREFLANG_SELF_MISSING","Regional page has hreflang alternates but no self-reference.",issue);
    }
    for(const alt of row.alternates){
      if(!sameOrigin(alt.href))continue;
      const target=pageMap.get(alt.href);
      if(!target){
        const issue={url:row.url,target:alt.href,hreflang:alt.hreflang,type:"target-not-indexable"};
        report.hreflangIssues.push(issue);
        addBlocker("HREFLANG_TARGET_NOT_INDEXABLE","hreflang points to a same-origin URL that is not present in the audited sitemap set.",issue);
        continue;
      }
      const reciprocal=target.alternates.some(candidate=>candidate.href===row.url);
      if(!reciprocal){
        const issue={url:row.url,target:alt.href,hreflang:alt.hreflang,type:"non-reciprocal"};
        report.hreflangIssues.push(issue);
        addBlocker("HREFLANG_NON_RECIPROCAL","hreflang alternate is not reciprocal.",issue);
      }
    }
  }

  const titleOwners=new Map();
  for(const row of pageResults){
    if(!row.title)continue;
    const key=row.title.trim().toLowerCase();
    const owners=titleOwners.get(key)||[];
    owners.push(row.url);
    titleOwners.set(key,owners);
  }
  const duplicateTitles=[...titleOwners.entries()].filter(([,urls])=>urls.length>1).map(([title,urls])=>({title,urls}));
  if(duplicateTitles.length)addWarning("DUPLICATE_TITLES",`${duplicateTitles.length} exact title groups are shared by multiple sitemap URLs.`,{sample:duplicateTitles.slice(0,15)});

  report.summary={
    status:report.blockers.length?"BLOCKED":"READY_FOR_GSC",
    sitemapFiles:report.sitemaps.length,
    sitemapUrls:urlOwners.size,
    auditedUrls:pageResults.length,
    blockers:report.blockers.length,
    warnings:report.warnings.length,
    orphanUrls:report.orphanUrls.length,
    linkedOutsideSitemap:report.linkedOutsideSitemap.length,
    duplicateCanonicalGroups:report.duplicateCanonicals.length,
    hreflangIssues:report.hreflangIssues.length,
    concurrency:CONCURRENCY
  };

  const md=[
    "# Panchvani Pre-GSC Live Audit",
    "",
    `Generated: ${report.generatedAt}`,
    `Base: ${BASE}`,
    `Status: **${report.summary.status}**`,
    "",
    "## Summary",
    "",
    `- Child sitemaps: ${report.summary.sitemapFiles}`,
    `- Unique sitemap URLs: ${report.summary.sitemapUrls}`,
    `- Audited HTML URLs: ${report.summary.auditedUrls}`,
    `- Blockers: ${report.summary.blockers}`,
    `- Warnings: ${report.summary.warnings}`,
    `- Orphan sitemap URLs: ${report.summary.orphanUrls}`,
    `- Linked HTML URLs outside sitemap: ${report.summary.linkedOutsideSitemap}`,
    `- Duplicate canonical groups: ${report.summary.duplicateCanonicalGroups}`,
    `- hreflang issues: ${report.summary.hreflangIssues}`,
    "",
    "## Blockers",
    "",
    ...(report.blockers.length?report.blockers.map(item=>`- **${item.code}** — ${item.message}${item.url?` — ${item.url}`:""}`):["- None ✅"]),
    "",
    "## Warnings",
    "",
    ...(report.warnings.length?report.warnings.map(item=>`- **${item.code}** — ${item.message}`):["- None ✅"]),
    "",
    "## Sitemap inventory",
    "",
    ...report.sitemaps.map(item=>`- ${item.name}: HTTP ${item.status} · ${item.urlCount} URLs · ${item.bytes} bytes`),
    ""
  ].join("\n");

  await writeFile("artifacts/pre-gsc-audit.json",JSON.stringify(report,null,2));
  await writeFile("artifacts/pre-gsc-audit.md",md);

  console.log("\n=== PANCHVANI PRE-GSC LIVE AUDIT ===");
  console.log(JSON.stringify(report.summary,null,2));
  if(report.blockers.length){
    console.log("\nBLOCKERS:");
    for(const item of report.blockers.slice(0,50))console.log(`- ${item.code}: ${item.message}${item.url?` (${item.url})`:""}`);
  }
  if(report.warnings.length){
    console.log("\nWARNINGS:");
    for(const item of report.warnings.slice(0,25))console.log(`- ${item.code}: ${item.message}`);
  }
  console.log("Reports: artifacts/pre-gsc-audit.json and artifacts/pre-gsc-audit.md");

  if(report.blockers.length)process.exitCode=1;
}

main().catch(async error=>{
  addBlocker("AUDIT_CRASH","Pre-GSC audit crashed.",{error:String(error?.stack||error)});
  report.summary={status:"BLOCKED",blockers:report.blockers.length,warnings:report.warnings.length};
  await mkdir("artifacts",{recursive:true});
  await writeFile("artifacts/pre-gsc-audit.json",JSON.stringify(report,null,2));
  console.error(error);
  process.exitCode=1;
});
