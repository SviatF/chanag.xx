import {mkdir,readFile,writeFile} from "node:fs/promises";
import {dirname} from "node:path";
import {pathToFileURL} from "node:url";

export const DEFAULT_SITEMAP="https://panchvani.com/sitemap.xml";

function decodeXml(value){
  return value
    .replaceAll("&amp;","&")
    .replaceAll("&lt;","<")
    .replaceAll("&gt;",">")
    .replaceAll("&quot;",'"')
    .replaceAll("&apos;","'");
}

export function normalizeUrl(raw){
  try{
    const url=new URL(String(raw).trim());
    url.hash="";
    url.search="";
    const path=url.pathname.replace(/\/{2,}/g,"/").replace(/\/$/,"")||"/";
    return `${url.protocol}//${url.host.toLowerCase()}${path}`;
  }catch{
    return null;
  }
}

export function parseCsvRows(text){
  const rows=[];
  let row=[],cell="",quoted=false;
  const input=String(text).replace(/^\uFEFF/,"");
  for(let i=0;i<input.length;i++){
    const ch=input[i];
    if(quoted){
      if(ch==='"'&&input[i+1]==='"'){cell+='"';i++;continue;}
      if(ch==='"'){quoted=false;continue;}
      cell+=ch;
      continue;
    }
    if(ch==='"'){quoted=true;continue;}
    if(ch===","){row.push(cell);cell="";continue;}
    if(ch==="\n"){
      row.push(cell.replace(/\r$/,""));
      rows.push(row);
      row=[];cell="";
      continue;
    }
    cell+=ch;
  }
  if(cell.length||row.length){
    row.push(cell.replace(/\r$/,""));
    rows.push(row);
  }
  return rows;
}

export function extractUrlsFromCsv(text,{host="panchvani.com"}={}){
  const urls=[];
  const seen=new Set();
  for(const row of parseCsvRows(text)){
    for(const value of row){
      const normalized=normalizeUrl(value);
      if(!normalized)continue;
      const parsed=new URL(normalized);
      if(host&&parsed.hostname!==host&&!parsed.hostname.endsWith(`.${host}`))continue;
      if(seen.has(normalized))continue;
      seen.add(normalized);
      urls.push(normalized);
      break;
    }
  }
  return urls;
}

function toNumber(raw){
  return /^\d+$/.test(raw??"")?Number(raw):null;
}

export function classifyPanchvaniUrl(raw){
  const normalized=normalizeUrl(raw);
  if(!normalized)return {family:"invalid",path:null};
  const url=new URL(normalized);
  const parts=url.pathname.split("/").filter(Boolean);
  const base={path:url.pathname,city:null,year:null,month:null,date:null,topic:null};

  if(parts.length===0)return {...base,family:"home"};
  if(parts[0]==="panchang"){
    if(parts.length===2)return {...base,family:"panchang-today-alias",city:parts[1]};
    if(parts.length===3)return {...base,family:"panchang-daily",city:parts[1],date:parts[2],year:toNumber(parts[2]?.slice(0,4)),month:toNumber(parts[2]?.slice(5,7))};
  }
  if(parts[0]==="calendar"){
    if(parts.length===3)return {...base,family:"calendar-year-city",city:parts[1],year:toNumber(parts[2])};
    if(parts.length===4)return {...base,family:"calendar-month",city:parts[1],year:toNumber(parts[2]),month:toNumber(parts[3])};
  }
  if(parts[0]==="hindu-calendar"&&parts.length===2)return {...base,family:"hindu-calendar-year",year:toNumber(parts[1])};
  if(parts[0]==="festivals-calendar"&&parts.length===2)return {...base,family:"festival-calendar-year",year:toNumber(parts[1])};
  if(parts[0]==="festivals"){
    if(parts.length===3)return {...base,family:"festival-year",topic:parts[1],year:toNumber(parts[2])};
    if(parts.length===4)return {...base,family:"festival-city",topic:parts[1],year:toNumber(parts[2]),city:parts[3]};
    return {...base,family:"festival-directory"};
  }
  if(parts[0]==="muhurat"){
    if(parts.length===3)return {...base,family:"muhurat-year",topic:parts[1],year:toNumber(parts[2])};
    if(parts.length===4)return {...base,family:"muhurat-month",topic:parts[1],year:toNumber(parts[2]),month:toNumber(parts[3])};
    if(parts.length===5)return {...base,family:"muhurat-city-month",topic:parts[1],year:toNumber(parts[2]),month:toNumber(parts[3]),city:parts[4]};
    return {...base,family:"muhurat-directory"};
  }
  if(parts[0]==="vrat"){
    if(parts.length===3)return {...base,family:"vrat-year",topic:parts[1],year:toNumber(parts[2])};
    if(parts.length===4)return {...base,family:"vrat-city",topic:parts[1],year:toNumber(parts[2]),city:parts[3]};
    return {...base,family:"vrat-directory"};
  }
  if(parts[0]==="regional"){
    if(parts.length===1)return {...base,family:"regional-directory"};
    if(parts.length===2)return {...base,family:"regional-language",topic:parts[1]};
    if(parts.length===3)return {...base,family:"regional-city",topic:parts[1],city:parts[2]};
    if(parts.length>=4)return {...base,family:"regional-intent-city",topic:`${parts[1]}:${parts[3]}`,city:parts[2]};
  }
  if(parts[0]==="tools"){
    if(parts[1]==="choghadiya"&&parts[2])return {...base,family:"choghadiya-city",city:parts[2]};
    if(parts[1]==="hindu-baby-names"&&parts[2])return {...base,family:"baby-names-nakshatra",topic:parts[2]};
    return {...base,family:"tool",topic:parts.slice(1).join("/")||null};
  }
  if(parts[0]==="knowledge")return {...base,family:parts.length===1?"knowledge-directory":"knowledge-topic",topic:parts[1]??null};
  if(parts[0]==="gold-rate")return {...base,family:parts.length>1?"gold-rate-city":"gold-rate",city:parts[1]??null};
  if(["about","methodology","data-sources","editorial-policy","contact","privacy","terms","photo-credits","cities"].includes(parts[0])){
    return {...base,family:"authority-core",topic:parts[0]};
  }
  return {...base,family:"other",topic:parts[0]};
}

function locs(xml){
  return [...String(xml).matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map(match=>decodeXml(match[1].trim()));
}

export async function fetchSitemapUrls(sitemapUrl=DEFAULT_SITEMAP,{fetchImpl=fetch,maxDocuments=50}={}){
  const queue=[sitemapUrl];
  const visited=new Set();
  const urls=new Set();

  while(queue.length){
    const current=queue.shift();
    if(visited.has(current))continue;
    if(visited.size>=maxDocuments)throw new Error(`Sitemap document limit exceeded (${maxDocuments}).`);
    visited.add(current);

    const response=await fetchImpl(current,{headers:{"user-agent":"Panchvani-GSC-Export-Audit/1.0"}});
    if(!response.ok)throw new Error(`Failed to fetch sitemap ${current}: HTTP ${response.status}`);
    const xml=await response.text();
    const entries=locs(xml);

    if(/<sitemapindex\b/i.test(xml)){
      for(const entry of entries)queue.push(entry);
      continue;
    }
    for(const entry of entries){
      const normalized=normalizeUrl(entry);
      if(normalized)urls.add(normalized);
    }
  }

  return {urls,documents:[...visited]};
}

function inc(map,key){
  if(key===null||key===undefined||key==="")return;
  map.set(String(key),(map.get(String(key))??0)+1);
}
function sortedCounts(map){
  return [...map.entries()].map(([key,count])=>({key,count})).sort((a,b)=>b.count-a.count||a.key.localeCompare(b.key));
}

export function analyzeUrls(urls,sitemapUrls=new Set()){
  const normalizedSitemap=new Set([...sitemapUrls].map(normalizeUrl).filter(Boolean));
  const byFamily=new Map(),byCity=new Map(),byYear=new Map(),byStatus=new Map();
  const rows=urls.map(raw=>{
    const url=normalizeUrl(raw);
    const meta=classifyPanchvaniUrl(url);
    const status=normalizedSitemap.has(url)?"CURRENT_SITEMAP":"OUTSIDE_SITEMAP";
    inc(byFamily,meta.family);inc(byCity,meta.city);inc(byYear,meta.year);inc(byStatus,status);
    return {url,status,...meta};
  });
  return {
    total:rows.length,
    currentSitemap:rows.filter(row=>row.status==="CURRENT_SITEMAP").length,
    outsideSitemap:rows.filter(row=>row.status==="OUTSIDE_SITEMAP").length,
    byFamily:sortedCounts(byFamily),
    byCity:sortedCounts(byCity),
    byYear:sortedCounts(byYear),
    byStatus:sortedCounts(byStatus),
    rows
  };
}

function csvCell(value){
  const text=value===null||value===undefined?"":String(value);
  return /[",\n\r]/.test(text)?`"${text.replaceAll('"','""')}"`:text;
}

export function analysisToCsv(report){
  const columns=["url","status","family","city","year","month","date","topic"];
  const lines=[columns.join(",")];
  for(const row of report.rows){
    lines.push(columns.map(column=>csvCell(row[column])).join(","));
  }
  return lines.join("\n")+"\n";
}

function parseArgs(argv){
  const input=argv.find(arg=>!arg.startsWith("--"));
  const option=name=>argv.find(arg=>arg.startsWith(`--${name}=`))?.slice(name.length+3);
  return {
    input,
    sitemap:option("sitemap")||DEFAULT_SITEMAP,
    out:option("out")||"artifacts/gsc-indexing-export-audit.json",
    csvOut:option("csv-out")||"artifacts/gsc-indexing-export-audit.csv"
  };
}

export async function main(argv=process.argv.slice(2)){
  const args=parseArgs(argv);
  if(!args.input)throw new Error("Usage: npm run audit:gsc-export -- <gsc-export.csv> [--sitemap=https://panchvani.com/sitemap.xml] [--out=report.json] [--csv-out=rows.csv]");

  const source=await readFile(args.input,"utf8");
  const urls=extractUrlsFromCsv(source);
  if(!urls.length)throw new Error("No panchvani.com URLs found in the CSV export.");

  const sitemap=await fetchSitemapUrls(args.sitemap);
  const report={
    generatedAt:new Date().toISOString(),
    sourceFile:args.input,
    sitemapUrl:args.sitemap,
    sitemapDocuments:sitemap.documents,
    sitemapUrlCount:sitemap.urls.size,
    ...analyzeUrls(urls,sitemap.urls)
  };

  await mkdir(dirname(args.out),{recursive:true});
  await mkdir(dirname(args.csvOut),{recursive:true});
  await writeFile(args.out,JSON.stringify(report,null,2));
  await writeFile(args.csvOut,analysisToCsv(report));

  console.log("\n=== GSC INDEXING EXPORT AUDIT ===");
  console.log(JSON.stringify({
    exportedUrls:report.total,
    sitemapUrls:report.sitemapUrlCount,
    currentSitemap:report.currentSitemap,
    outsideSitemap:report.outsideSitemap,
    topFamilies:report.byFamily.slice(0,10),
    topCities:report.byCity.slice(0,10),
    reports:{json:args.out,csv:args.csvOut}
  },null,2));
  return report;
}

const direct=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(direct)main().catch(error=>{console.error(error);process.exitCode=1;});
