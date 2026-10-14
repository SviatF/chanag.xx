/**
 * Wave 3X: read-only deployed response verification for 2026–27 V5 risks.
 * Does not infer that city astronomical matching proves ritual correctness.
 * No cache-busting: check the public-facing exact URLs, not a private build.
 */
import {mkdirSync,writeFileSync} from "node:fs";
const BASE=(process.argv.find(s=>s.startsWith("--base-url="))?.slice(11)||
  "https://panchvani.com").replace(/\/$/,"");
const strict=process.argv.includes("--strict");
const CHECKS=[
  {path:"/vrat/purnima/2026/delhi",
   contains:["Purnima 2026","2026-06-29","12 sunrise states","0 repeated"],
   absent:["2026-06-30Sunrise","13 sunrise states","1 repeated at sunrise"],
   reason:"UT V5 eliminated historical erroneous Delhi June 30 Purnima at sunrise"},
  {path:"/panchang/delhi/2026-06-30",
   contains:["Pratipada","Krishna Paksha","05:27"],absent:["Shukla Paksha Purnima"],
   reason:"Exact Delhi Purnima transition precedes sunrise by ~40 s"},
  {path:"/panchang/thane/2026-08-25",
   contains:["Trayodashi"],absent:["Dwadashi","Dwadashi Tithi"],
   reason:"UT V5 changed Thane sunrise Tithi from Dwadashi to Trayodashi"},
  {path:"/panchang/kanpur/2026-11-21",
   contains:["Dwadashi"],absent:["Shukla Paksha Ekadashi"],
   reason:"UT V5 sunrise Tithi differs from some fasting convention publication"},
  {path:"/panchang/bhopal/2026-12-24",
   contains:["Pratipada"],absent:["Shukla Paksha Purnima"],
   reason:"UT V5 changed Bhopal Purnima sunrise state"},
  {path:"/panchang/patna/2027-01-31",
   contains:["Dashami"],absent:["Navami Tithi"],
   reason:"City-source disagreement remains unresolved; disclosure should be visible",
   notice:"Navami changes to Dashami"},
  {path:"/panchang/kolkata/2027-08-05",
   contains:["Chaturthi"],absent:["Tritiya Tithi"],
   reason:"UT V5 Kolkata corrected sunrise Tithi"},
  {path:"/panchang/lucknow/2027-09-17",
   contains:["Dvitiya"],absent:["Pratipada Tithi"],
   reason:"Second-rounded external Tithi boundary remains a source uncertainty",
   notice:"Pratipada ends around Lucknow sunrise"},
];
const results=[];
for(const check of CHECKS){
  const path=check.path;
  const item={path,reason:check.reason,httpStatus:null,canonical:null,
    staleV4Indicators:[],missingIndicators:[],sourceReviewNoticePresent:null,
    verified:false,errors:[],workerVersion:null};
  try{
    const r=await fetch(BASE+path,{
      headers:{"accept":"text/html","user-agent":"Panchvani-Live-V5-Astronomy-Audit/1.0"},
      redirect:"follow",signal:AbortSignal.timeout(18000)
    });
    const html=await r.text();
    item.httpStatus=r.status;item.workerVersion=r.headers.get("x-panchvani-worker-version");
    const canonicalTags=[...html.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi)];
    const canonicalTag=canonicalTags.at(0)?.[0]??"";
    const href=canonicalTag.match(/\bhref=["']([^"']+)/i)?.[1]??null;
    item.canonical=href?new URL(href,BASE+path).href:null;
    const markerText=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
      .replace(/<[^>]*>/g," ").replace(/\s+/g," ");
    const lower=markerText.toLowerCase();
    for(const token of check.contains)if(!lower.includes(token.toLowerCase()))
      item.missingIndicators.push(token);
    for(const token of check.absent)if(lower.includes(token.toLowerCase()))
      item.staleV4Indicators.push(token);
    if(check.notice){
      item.sourceReviewNoticePresent=lower.includes(check.notice.toLowerCase());
      if(!item.sourceReviewNoticePresent)item.errors.push("missing explicit independent-source uncertainty notice");
    }
    if(r.status!==200)item.errors.push("HTTP "+r.status);
    if(item.canonical!==BASE+path)item.errors.push("wrong canonical "+item.canonical);
    if(item.missingIndicators.length)item.errors.push("missing expected V5 body markers");
    if(item.staleV4Indicators.length)item.errors.push("stale V4 / wrong-day markers present");
    if(/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*\bnoindex\b/i.test(html))
      item.errors.push("unexpected noindex on named publicly accessible route");
    item.verified=item.errors.length===0;
  }catch(e){item.errors.push("live fetch failure "+String(e))}
  results.push(item);
  console.log("[live-3x] "+JSON.stringify(item));
}
const report={
  checkedAt:new Date().toISOString(),environment:BASE,scope:"eight fixed high-risk city/route cases only",
  checked:results.length,verified:results.filter(x=>x.verified).length,
  failed:results.filter(x=>!x.verified).length,results,
  limitations:[
    "This checks only eight selected end-user URLs, not every city/date, and a single edge region cannot certify CDN-wide release.",
    "HTML string matching provides regression warning; external method and ephemeris accuracy require independent geolocated source-time validation.",
    "Vrat sunrise Tithi does not establish festival observance, Smarta/Vaishnava Ekadashi fast dates or Parana.",
    "Google-indexed selection and SEO rankings require Search Console evidence; a 200 response does not establish indexing.",
    "Near sunrise: Patna source disagreement remains unresolved; this audit verifies transparent publication, not source correctness."
  ]
};
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/live-v5-astronomy-evidence.json",JSON.stringify(report,null,2)+"\n");
console.log("[live-3x] "+report.verified+"/"+report.checked+" passed");
if(strict&&report.failed)process.exitCode=1;
